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
 *   node scripts/build.mjs weapp      # -> dist/      微信小程序
 *   node scripts/build.mjs h5         # -> dist/h5/   浏览器
 *   node scripts/build.mjs rn         # -> dist/rn/   React Native bundle
 *   node scripts/build.mjs h5 --watch # 监听模式
 *   TARO_H5_PUBLIC_PATH=/m/ node scripts/build.mjs h5   # 部署到子路径
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const PLATFORM_OUTPUT = {
  weapp: 'dist',
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
