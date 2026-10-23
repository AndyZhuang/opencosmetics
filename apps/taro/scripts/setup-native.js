#!/usr/bin/env node
/**
 * apps/taro/scripts/setup-native.js — 生成 Taro RN 原生外壳 (android/ + ios/)
 * ============================================================================
 * 为什么需要这个脚本:
 *   Taro 4 的 `taro init --template react-native` 依赖从 GitHub 拉模板仓库,
 *   而本机到 github.com 的出口被过滤(只有自己的仓库可达)。
 *   但 React Native 0.73 的官方模板就打包在 `react-native/template/` 里
 *   (npm 包自带), 所以直接用它当外壳:
 *     - android/ 与 ios/ 原生工程  —— 官方模板, 未经改动
 *     - index.js / metro.config.js / babel.config.js —— 由 Taro 的 rn-runner 生成
 *     - 其余接线 (AppRegistry 名称、包名、bundle id、签名配置) —— 由本脚本改写
 *
 * 用法:
 *   node scripts/setup-native.js            # 重建 android/ + ios/
 *   node scripts/setup-native.js --only-ios # 只重建 ios/
 *
 * 幂等: 重复执行会覆盖重建对应的目录。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const APP_NAME = 'FormulaLab';
const ANDROID_PACKAGE = 'com.formulalab.app';
const IOS_BUNDLE_ID = 'com.formulalab.app';
const DISPLAY_NAME = '配方引擎';
const NDK_VERSION = '26.1.10909125';

const templateRoot = path.join(projectRoot, 'node_modules', 'react-native', 'template');
if (!fs.existsSync(path.join(templateRoot, 'android'))) {
  console.error('[setup-native] 找不到 RN 模板, 请先在 apps/taro 执行 npm install');
  process.exit(1);
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

/** 递归改写文件内容; 二进制文件跳过而不是中断整棵树的遍历 */
function rewriteFiles(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteFiles(fp, fn);
      continue;
    }
    const buf = fs.readFileSync(fp);
    if (buf.includes(0)) continue; // 二进制 (keystore / jar / png), 跳过
    const text = buf.toString('utf8');
    const next = fn(text, fp.split(path.sep).join('/'));
    if (next !== text) fs.writeFileSync(fp, next, 'utf8');
  }
}

// ---------------------------------------------------------------------------
// Android
// ---------------------------------------------------------------------------
const androidDst = path.join(projectRoot, 'android');

if (!process.argv.includes('--only-ios')) {
  rmrf(androidDst);
  copyDir(path.join(templateRoot, 'android'), androidDst);

  // 包名目录: com/helloworld -> com/formulalab/app
  const androidPkgDir = path.join(androidDst, 'app/src/main/java/com/helloworld');
  const androidPkgDirNew = path.join(
    androidDst,
    'app/src/main/java',
    ANDROID_PACKAGE.replace(/\./g, '/')
  );
  fs.mkdirSync(path.dirname(androidPkgDirNew), { recursive: true });
  fs.renameSync(androidPkgDir, androidPkgDirNew);

  rewriteFiles(path.join(androidDst, 'app/src'), (text) =>
    text.replace(/com\.helloworld/g, ANDROID_PACKAGE)
  );
  rewriteFiles(androidDst, (text, fp) => {
    if (fp.endsWith('android/build.gradle')) {
      // 模板默认的 NDK 版本与 RN 0.73 要求的 26.1.10909125 不一致
      return text.replace(/ndkVersion\s*=\s*"[^"]*"/, `ndkVersion = "${NDK_VERSION}"`);
    }
    if (fp.endsWith('android/app/build.gradle')) {
      return patchAndroidAppGradle(text);
    }
    if (fp.endsWith('MainActivity.kt')) {
      // AppRegistry 注册名必须与 config/index.ts 的 rn.appName 一致
      return text.replace(
        /override fun getMainComponentName\(\): String\s*=\s*"[^"]*"/,
        `override fun getMainComponentName(): String = "${APP_NAME}"`
      );
    }
    if (fp.endsWith('strings.xml')) {
      return text.replace(
        /<string name="app_name">[^<]*<\/string>/,
        `<string name="app_name">${DISPLAY_NAME}</string>`
      );
    }
    return text;
  });

  console.log(`[setup-native] android -> ${path.relative(projectRoot, androidDst)}`);
}

/**
 * 给模板的 android/app/build.gradle 打补丁:
 *   1. namespace / applicationId
 *   2. 正式签名改成读 keystore.properties 或环境变量, 没配置时回落 debug keystore
 *   3. versionName
 */
function patchAndroidAppGradle(text) {
  let out = text
    .replace(/namespace "com\.helloworld"/, `namespace "${ANDROID_PACKAGE}"`)
    .replace(/applicationId "com\.helloworld"/, `applicationId "${ANDROID_PACKAGE}"`)
    .replace(/versionName "[^"]*"/, 'versionName "1.0.0"');

  const signingBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (releaseKeystore) {
                storeFile file(releaseKeystore)
                storePassword releaseStorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            }
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // 没配置正式密钥时回落到 debug keystore —— 照样能装机联调, 只是不能上架。
            signingConfig releaseKeystore ? signingConfigs.release : signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }`;

  const original = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }`;

  if (!out.includes(original)) {
    console.warn('[setup-native] 警告: android/app/build.gradle 的签名块与模板不一致, 未替换');
    return out;
  }
  out = out.replace(original, signingBlock);

  const props = `// ---------------------------------------------------------------------------
// 正式签名配置 (可选)
//   来源优先级: android/keystore.properties  >  环境变量  >  没有则用 debug keystore。
//   keystore.properties 形如:
//     FORMULALAB_KEYSTORE=fl-release.keystore
//     FORMULALAB_KEYSTORE_PASSWORD=xxxx
//     FORMULALAB_KEY_ALIAS=xxxx
//     FORMULALAB_KEY_PASSWORD=xxxx
// ---------------------------------------------------------------------------
def keystorePropsFile = rootProject.file("keystore.properties")
def keystoreProps = new Properties()
if (keystorePropsFile.exists()) {
    keystoreProps.load(new FileInputStream(keystorePropsFile))
}
def releaseKeystore = keystoreProps.getProperty("FORMULALAB_KEYSTORE") ?: System.getenv("FORMULALAB_KEYSTORE")
def releaseStorePassword = keystoreProps.getProperty("FORMULALAB_KEYSTORE_PASSWORD") ?: System.getenv("FORMULALAB_KEYSTORE_PASSWORD")
def releaseKeyAlias = keystoreProps.getProperty("FORMULALAB_KEY_ALIAS") ?: System.getenv("FORMULALAB_KEY_ALIAS")
def releaseKeyPassword = keystoreProps.getProperty("FORMULALAB_KEY_PASSWORD") ?: System.getenv("FORMULALAB_KEY_PASSWORD")

android {`;

  out = out.replace('android {', props);
  return out;
}

// ---------------------------------------------------------------------------
// iOS
// ---------------------------------------------------------------------------
const iosDst = path.join(projectRoot, 'ios');
if (!process.argv.includes('--only-android')) {
  rmrf(iosDst);
  copyDir(path.join(templateRoot, 'ios'), iosDst);

  /**
   * 递归把文件名里的 HelloWorld 换成 APP_NAME。
   * 必须递归: RN 模板里除了顶层目录, 还有
   *   ios/FormulaLab.xcodeproj/xcshareddata/xcschemes/HelloWorld.xcscheme
   *   ios/FormulaLabTests/HelloWorldTests.m
   * 这两处不改的话, Xcode 会找不到共享 scheme (只能生成临时 scheme),
   * 而 pbxproj 里指向测试文件的路径也会失效。
   */
  const renameInDir = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const from = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        renameInDir(from);
        continue;
      }
      if (!entry.name.includes('HelloWorld')) continue;
      const to = path.join(dir, entry.name.replace(/HelloWorld/g, APP_NAME));
      // Windows 上目录 rename 偶发 EPERM(杀软/索引器占用句柄), 改用 copy + delete
      fs.copyFileSync(from, to);
      fs.unlinkSync(from);
    }
  };
  renameInDir(iosDst);

  // -------------------------------------------------------------------------
  // `_xcode.env` -> `.xcode.env`
  // -------------------------------------------------------------------------
  // React Native 官方模板在仓库里叫 `ios/.xcode.env`, 但发到 npm 时 dotfile 会被
  // 打包规则改名成 `ios/_xcode.env` (react-native init 时会再改回来)。
  // 我们直接抄 npm 包, 所以拿到的是 `_xcode.env`。
  //
  // **这不是小事**: Xcode 工程的 "Bundle React Native code and images" 阶段把
  //   $(SRCROOT)/.xcode.env 与 $(SRCROOT)/.xcode.env.local
  // 声明成了 inputPaths。Xcode 找不到 inputPath 的文件会直接报
  //   error: Build input file cannot be found: '.../ios/.xcode.env'
  // 并让整个 build 失败 (不是 warning)。
  // 所以这里必须把名字改回去。
  const xcodeEnvTpl = path.join(iosDst, '_xcode.env');
  const xcodeEnvReal = path.join(iosDst, '.xcode.env');
  if (fs.existsSync(xcodeEnvTpl)) {
    fs.copyFileSync(xcodeEnvTpl, xcodeEnvReal);
    fs.unlinkSync(xcodeEnvTpl);
    console.log('[setup-native] ios/_xcode.env -> ios/.xcode.env');
  }

  // 顶层目录本身也要改名 (ios/HelloWorld -> ios/FormulaLab)
  for (const entry of fs.readdirSync(iosDst)) {
    if (!entry.includes('HelloWorld')) continue;
    const from = path.join(iosDst, entry);
    const to = path.join(iosDst, entry.replace(/HelloWorld/g, APP_NAME));
    if (fs.statSync(from).isDirectory()) {
      copyDir(from, to);
      rmrf(from);
    } else {
      fs.copyFileSync(from, to);
      fs.unlinkSync(from);
    }
  }

  rewriteFiles(iosDst, (text, fp) => {
    let out = text.replace(/com\.helloworld/g, IOS_BUNDLE_ID);
    // 所有文本文件里的 HelloWorld 都要换掉 (scheme 的 ReferencedContainer、
    // 测试类名、storyboard 里的 app 名……)
    out = out.replace(/HelloWorld/g, APP_NAME);
    if (fp.endsWith('AppDelegate.mm')) {
      // AppRegistry 注册名必须与 config/index.ts 的 rn.appName 一致
      out = out.replace(/self\.moduleName\s*=\s*@"[^"]*";/, `self.moduleName = @"${APP_NAME}";`);
    }
    if (fp.endsWith('Info.plist')) {
      if (/CFBundleDisplayName/.test(out)) {
        out = out.replace(
          /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
          `$1${DISPLAY_NAME}$2`
        );
      } else {
        out = out.replace(
          /<key>CFBundleName<\/key>/,
          `<key>CFBundleDisplayName</key>\n\t<string>${DISPLAY_NAME}</string>\n\t<key>CFBundleName</key>`
        );
      }
    }
    return out;
  });

  console.log(`[setup-native] ios     -> ${path.relative(projectRoot, iosDst)}`);
}

// ---------------------------------------------------------------------------
// react-native.config.js —— 告诉 RN CLI 自定义入口与资源目录
// ---------------------------------------------------------------------------
fs.writeFileSync(
  path.join(projectRoot, 'react-native.config.js'),
  `/**
 * React Native CLI 配置
 * 入口固定为 Taro 生成的 index.js (内容: import '@tarojs/rn-supporter/entry-file.js')
 */
module.exports = {
  project: {
    android: {},
    ios: {},
  },
}
`,
  'utf8'
);

console.log(`[setup-native] appName=${APP_NAME} displayName=${DISPLAY_NAME} package=${ANDROID_PACKAGE}`);
