#!/usr/bin/env node
/**
 * apps/taro/scripts/build.mjs — 跨平台统一构建入口
 *
 * 为什么需要它:
 *   Taro 的 outputRoot 只能全局指定一个, 三个平台共用 'dist' 会互相覆盖
 *   (H5 的 index.html / chunk/ 会把微信小程序的 app.json / pages/ 冲掉)。
 *   Taro 4 的 CLI 没有 --output-root 参数, 所以用环境变量注入, 由
 *   config/index.ts 读取 process.env.TARO_OUTPUT_ROOT。
 *
 * 用法:
 *   node scripts/build.mjs weapp      # -> dist/weapp/ 微信小程序
 *   node scripts/build.mjs h5         # -> dist/h5/    浏览器
 *   node scripts/build.mjs rn         # -> dist/rn/    React Native bundle
 *   node scripts/build.mjs h5 --watch # 监听模式
 *   TARO_H5_PUBLIC_PATH=/m/ node scripts/build.mjs h5   # 部署到子路径
 *
 * [为什么是三个平级目录]
 *   Taro 每次构建会 emptyOutputDir(outputRoot) —— **清空 outputRoot 本身**。
 *   如果 weapp 用 dist/ 而 h5 用 dist/h5/, 那么「构建 weapp」会把 dist/ 整个清空,
 *   连 dist/h5/ 和 dist/rn/ 一起没了 (之前就踩过: 重建小程序后 H5 产物凭空消失)。
 *   改成三个平级目录后, 各平台只清自己那一个, 互不干扰。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// 三个平级目录 —— 见文件头说明, 改成嵌套会导致「构建 weapp 清空整个 dist」
const PLATFORM_OUTPUT = {
  weapp: 'dist/weapp',
  h5: 'dist/h5',
  rn: 'dist/rn',
};

const type = process.argv[2];
const args = process.argv.slice(3);

if (!type || !PLATFORM_OUTPUT[type]) {
  console.error(
    `用法: node scripts/build.mjs <${Object.keys(PLATFORM_OUTPUT).join('|')}> [--watch]\n` +
      `未知平台: ${type || '(空)'}`
  );
  process.exit(1);
}

const outputRoot = PLATFORM_OUTPUT[type];
const watch = args.includes('--watch');

const env = {
  ...process.env,
  TARO_OUTPUT_ROOT: outputRoot,
};
if (type === 'h5' && process.env.TARO_H5_PUBLIC_PATH) {
  env.TARO_H5_PUBLIC_PATH = process.env.TARO_H5_PUBLIC_PATH;
}

// 清理本平台的产物目录 (Taro 自带 clean, 这里再兜一次底, 防止上次构建残留)
const outAbs = path.join(projectRoot, outputRoot);
if (fs.existsSync(outAbs)) {
  fs.rmSync(outAbs, { recursive: true, force: true });
  console.log(`[build] cleaned ${outputRoot}`);
}

// ---------------------------------------------------------------------------
// 旧布局迁移 (一次性)
// ---------------------------------------------------------------------------
// 早先三端共用的输出结构是: 小程序 -> dist/ 根目录, H5 -> dist/h5/, RN -> dist/rn/。
// 现在改成三个平级目录 (dist/weapp, dist/h5, dist/rn), 于是 dist/ 根目录下会
// 残留上一版小程序产物 (app.json / common.js / vendors.js / pages/ ...),
// 它们对新布局是死文件, 还会让「导入 dist/ 根目录」的旧操作数留下半吊子产物。
//
// dist/ 是纯构建输出目录 (已 gitignore), 所以规则很简单:
// **除了三个平台目录, dist/ 下的东西一律清掉**。
// 注意取的是路径**最后**一段 (weapp / h5 / rn), 不是第一段 (dist)
const PLATFORM_DIR_NAMES = new Set(
  Object.values(PLATFORM_OUTPUT).map((p) => p.split('/').pop())
);

function migrateLegacyLayout() {
  const distRoot = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distRoot)) return;
  const removed = [];
  for (const entry of fs.readdirSync(distRoot)) {
    if (PLATFORM_DIR_NAMES.has(entry)) continue;
    fs.rmSync(path.join(distRoot, entry), { recursive: true, force: true });
    removed.push(entry);
  }
  if (removed.length) {
    console.log(`[build] 清理旧布局残留: ${removed.join(', ')}`);
  }
}
migrateLegacyLayout();

const taroBin = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'taro.cmd' : 'taro'
);

const cmdArgs = ['build', '--type', type];
if (watch) cmdArgs.push('--watch');

console.log(`[build] platform=${type} outputRoot=${outputRoot}`);

const child = spawn(taroBin, cmdArgs, {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log(`[build] OK -> ${path.join(projectRoot, outputRoot)}`);
  } else {
    console.error(`[build] FAILED exit=${code}`);
  }
  process.exit(code ?? 1);
});
