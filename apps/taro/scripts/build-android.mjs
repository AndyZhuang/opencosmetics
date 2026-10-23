#!/usr/bin/env node
/**
 * apps/taro/scripts/build-android.mjs — 统一 Android 出包入口
 * ============================================================================
 * 用法:
 *   node scripts/build-android.mjs                 # assembleRelease (出 APK)
 *   node scripts/build-android.mjs assembleDebug   # 调试包
 *   node scripts/build-android.mjs bundleRelease   # 出 AAB (上架用)
 *
 * 必需环境变量:
 *   ANDROID_HOME (或 ANDROID_SDK_ROOT)  指向 Android SDK
 *   JAVA_HOME                          指向 JDK 17 (RN 0.73 要求)
 *   PATH 里要有 node (RN 的 Gradle 插件要调 node 打 JS bundle)
 *
 * 正式签名 (可选, 不给就回落 debug keystore):
 *   FORMULALAB_KEYSTORE / FORMULALAB_KEYSTORE_PASSWORD / FORMULALAB_KEY_ALIAS /
 *   FORMULALAB_KEY_PASSWORD
 *   这四个也可以写成 android/gradle.properties 里的同名属性。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');

const task = process.argv[2] || 'assembleRelease';
const extraArgs = process.argv.slice(3);

const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  path.resolve(projectRoot, '..', '..', 'android-sdk');

if (!fs.existsSync(sdk)) {
  console.error(`[build-android] 找不到 Android SDK: ${sdk}`);
  console.error('  请设置 ANDROID_HOME 环境变量。');
  process.exit(1);
}

const javaHome = process.env.JAVA_HOME;
// JDK 判活要跨平台: Windows 是 bin\java.exe, Linux/macOS 是 bin/java。
// (之前只认 java.exe, 在 GitHub Actions 的 ubuntu runner 上直接判定 JAVA_HOME 无效)
const javaBin =
  javaHome &&
  ['bin/java', 'bin/java.exe'].some((rel) => fs.existsSync(path.join(javaHome, rel)));
if (!javaHome || !javaBin) {
  console.error('[build-android] JAVA_HOME 未设置或无效 (需要 JDK 17)');
  console.error(`  当前 JAVA_HOME=${javaHome || '(未设置)'}`);
  process.exit(1);
}

const isWin = process.platform === 'win32';
const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');

// gradlew 在 git 里是 100644 (Windows 上无法保留可执行位), 在 Linux runner 上
// 会直接 "Permission denied"。这里运行时补一下执行位。
if (!isWin) {
  try {
    fs.chmodSync(gradlew, 0o755);
  } catch (e) {
    console.warn(`[build-android] chmod gradlew 失败: ${e.message}`);
  }
}

const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  JAVA_HOME: javaHome,
  PATH: `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
};

// 本机 HTTP_PROXY 指向已死的 127.0.0.1:7890, 不清掉会让 Gradle 全部超时
for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy']) {
  delete env[k];
}

console.log(`[build-android] task=${task}`);
console.log(`[build-android] sdk=${sdk}`);
console.log(`[build-android] java=${javaHome}`);

// --console 只能给一次, 重复给 Gradle 会直接报
// "Multiple arguments were provided for command-line option '--console'" 并打印用法退出。
const hasConsoleArg = extraArgs.some((a) => a.startsWith('--console'));
const gradleArgs = hasConsoleArg
  ? [task, ...extraArgs]
  : [task, ...extraArgs, '--console=plain'];

const child = spawn(gradlew, gradleArgs, {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWin,
});

child.on('exit', (code) => {
  console.log(`[build-android] exit=${code}`);
  process.exit(code ?? 1);
});
