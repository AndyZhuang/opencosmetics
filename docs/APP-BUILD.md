# 配方引擎 FormulaLab — 三端出包手册

> 产品：配方引擎 FormulaLab（`com.formulalab.app` / 小程序名「配方引擎」）
> 代码位置：`apps/taro/`（Taro 4 + React 18 + React Native 0.73）
> 一套业务代码 → **微信小程序 / H5 / Android APK / iOS IPA** 四端产物

---

## 0. 工程结构

```
apps/taro/
├── src/                     业务源码 (9 个页面 + UI Kit + API 层)
│   ├── app.ts               weapp / h5 入口
│   ├── app.rn.ts            React Native 入口 (全局样式不同)
│   ├── app-init.ts          三端共用的启动引导
│   ├── app.scss             全局样式 (weapp / h5)
│   ├── app.rn.scss          全局样式 (RN 安全版)
│   ├── api/                 网络层 (client / endpoints / types)
│   ├── components/          UI Kit + PageShell + BottomNav
│   ├── pages/               9 个页面
│   ├── rn-stubs/            RN 下未使用原生模块的占位桩
│   └── styles/              设计 token (SCSS 变量) + 页面公共样式
├── config/index.ts          Taro 三端配置 (weapp / h5 / rn)
├── scripts/
│   ├── build.mjs            统一构建入口 (weapp / h5 / rn)
│   ├── build-android.mjs    Android 出包入口
│   ├── setup-native.js      生成 android/ + ios/ 原生外壳
│   ├── fix-scss-imports.mjs @use/@forward 补 .scss 扩展名
│   └── fix-rn-line-height.mjs 无单位 line-height 换算成绝对值
├── android/                 React Native 原生工程 (包名 com.formulalab.app)
├── ios/                     React Native 原生工程 (bundle id com.formulalab.app)
├── index.js                 RN 入口 (Taro 生成, 必须入库)
├── metro.config.js          RN 的 Metro 配置 (Taro 生成, 必须入库)
├── babel.config.js          RN 的 Babel 配置 (Taro 生成, 必须入库)
└── project.config.json      微信小程序工程配置 (AppID 在这里改)
```

> ⚠️ `index.js` / `metro.config.js` / `babel.config.js` / `react-native.config.js`
> 虽然是构建期生成的，但 **CI 与本地出包都依赖它们，必须提交进仓库**。

---

## 1. 环境准备

| 组件 | 版本 | 说明 |
|---|---|---|
| Node.js | 20 / 22 | Taro 4.3 + RN 0.73 |
| JDK | 17 | RN 0.73 的 Gradle 插件要求 |
| Android SDK | platform 34 + build-tools 34.0.0 | `compileSdk`/`targetSdk` = 34 |
| Android NDK | 26.1.10909125 | 与 `android/build.gradle` 的 `ndkVersion` 一致 |
| Xcode | 15+ | 只在 CI (macos-14) 上需要，本机不需要 Mac |
| CocoaPods | 1.15+ | 只在 CI 上需要 |

**Windows 特别注意**：本机 `HTTP_PROXY` / `HTTPS_PROXY` 指向已死的 `127.0.0.1:7890`，
npm / Gradle 会被它拖死。跑任何构建前先清掉：

```powershell
$env:HTTP_PROXY=''; $env:HTTPS_PROXY=''; $env:http_proxy=''; $env:https_proxy=''
$env:npm_config_registry='https://registry.npmmirror.com'
```

---

## 2. 微信小程序

### 2.1 本地出包

```powershell
cd apps/taro
npm install
node scripts/build.mjs weapp
```

产物：`apps/taro/dist/`（约 430 KB，51 个文件）

```
dist/
├── app.js / app.json / app.wxss
├── project.config.json
├── pages/{workbench,bench,ingredients,risk,formulas,substitute,claim,reference}/...
└── base.wxml / common.js / common.wxss / taro.js / vendors.js ...
```

### 2.2 换成正式 AppID

编辑 `apps/taro/project.config.json`：

```json
{ "appid": "wx1234567890abcdef" }
```

然后重新 `node scripts/build.mjs weapp`（Taro 会把工程配置拷进产物目录）。

### 2.3 上传

1. 打开 **微信开发者工具** → 导入项目 → 目录选 `apps/taro/`（不是 `dist/`，
   因为 `project.config.json` 里的 `miniprogramRoot` 指向 `./dist/`）。
2. 工具内「上传」→ 填版本号与备注。
3. 登录 mp.weixin.qq.com → **版本管理** → 提交审核。

> 自动化上传可以用 `miniprogram-ci`，把 `project.config.json` 的 `appid` 与
> `privateKeyPath` 填好即可；本仓库目前保留的是「工具手动上传」路径。

---

## 3. H5（浏览器）

```powershell
cd apps/taro
node scripts/build.mjs h5
```

产物：`apps/taro/dist/h5/`（`index.html` + `chunk/` + `css/` + `js/`）。

部署到子路径时需要带 publicPath：

```powershell
$env:TARO_H5_PUBLIC_PATH='/m/'; node scripts/build.mjs h5
```

小程序与 H5 的产物目录是**隔离**的（`dist/` vs `dist/h5/`），互不覆盖。

---

## 4. Android APK

### 4.1 出包

```powershell
cd apps/taro
$env:ANDROID_HOME='D:\minimax\serverM\android-sdk'
$env:JAVA_HOME='D:\minimax\serverM\jdk\jdk-17.0.2'
node scripts/build-android.mjs assembleRelease        # APK
node scripts/build-android.mjs bundleRelease          # AAB (上架用)
```

产物：`apps/taro/android/app/build/outputs/apk/release/app-release.apk`

### 4.2 正式签名

没配置正式密钥时，release 包会回落到 **debug keystore** 签名 ——
照样能装到真机联调，但不能上架（也不能覆盖安装已上架的正式包）。

配置正式密钥（二选一）：

**方式 A：`apps/taro/android/keystore.properties`（本机，不入库）**

```properties
FORMULALAB_KEYSTORE=fl-release.keystore
FORMULALAB_KEYSTORE_PASSWORD=你的口令
FORMULALAB_KEY_ALIAS=你的别名
FORMULALAB_KEY_PASSWORD=你的口令
```

密钥文件放在 `apps/taro/android/app/` 下。

**方式 B：环境变量（CI 用）**

```bash
export FORMULALAB_KEYSTORE=fl-release.keystore
export FORMULALAB_KEYSTORE_PASSWORD=...
export FORMULALAB_KEY_ALIAS=...
export FORMULALAB_KEY_PASSWORD=...
```

### 4.3 装机

```bash
adb install -r app-release.apk
```

---

## 5. iOS IPA（云端 CI，不需要 Mac）

iOS 的签名与打包只能在 macOS 上做，所以走 GitHub Actions：
**macos-14 runner → CocoaPods → xcodebuild → 产物 artifact**。

### 5.1 流水线

`.github/workflows/ios.yml`，触发方式：

- 手动：**Actions → iOS Build (FormulaLab) → Run workflow**，选 `simulator` 或 `device`
- 自动：push 到 `master`/`main` 且改动了 `apps/taro/**` → 只出模拟器包

### 5.2 不配证书也能跑

`simulator` 模式产出 `FormulaLab-simulator.app.zip`（Release 配置，含 JS bundle，
不需要任何证书），下载后解压用 Xcode 模拟器打开即可。

### 5.3 出真机 IPA

在仓库 **Settings → Secrets** 里加：

| Secret | 内容 |
|---|---|
| `IOS_CERT_P12_BASE64` | `base64 -i dev.p12 -o dev.p12.b64` |
| `IOS_CERT_PASSWORD` | p12 密码 |
| `IOS_PROVISION_PROFILE` | `base64 -i xxx.mobileprovision -o xxx.b64` |
| `IOS_PROVISION_PROFILE_NAME` | 描述文件里的 Profile Name |
| `IOS_TEAM_ID` | Apple Team ID |
| `IOS_BUNDLE_ID` | 可选，默认 `com.formulalab.app` |

然后手动触发 workflow 选 `device`，artifact 里就是 `FormulaLab-ios-ipa/*.ipa`。

---

## 6. 自动化流水线总览

| Workflow | 触发 | 产物 |
|---|---|---|
| `.github/workflows/weapp.yml` | push 改 `apps/taro/src` | `formulalab-weapp.zip` / `formulalab-h5.zip` |
| `.github/workflows/android.yml` | push 改 `apps/taro/**` | `FormulaLab-android-apk` / `-aab` |
| `.github/workflows/ios.yml` | push / 手动 | `FormulaLab-ios-simulator`（可选 `-ipa`） |

---

## 7. 踩过的坑（照抄就行，别再踩第二遍）

1. **npm / Gradle 必须先清代理**。本机 `HTTP_PROXY` 指向已死的 7890 端口，
   不清的话 npm 和 Gradle 会全部超时。
2. **Taro 的 `outputRoot` 全局唯一**，三端共用 `dist/` 会互相覆盖
   （H5 的 `index.html` 会把小程序 `app.json` 冲掉）。
   所以用 `scripts/build.mjs` 注入 `TARO_OUTPUT_ROOT` 把三端拆开。
3. **Taro 4 不支持 `mini.projectConfig`**（那是 Taro 3 的写法），
   小程序配置统一放工程根目录的 `project.config.json`。
4. **RN 的样式必须带 `.scss` 扩展名**。Taro 的 RN 样式转换器用 dart-sass 的
   legacy API 且刻意不传 `file` 选项，找不到扩展名时只会在 `['.rn', '', '']` 里找。
   统一用 `scripts/fix-scss-imports.mjs` 修正。
5. **RN 没有 `page` / `body` 元素**，CSS→StyleSheet 时会被映射成 `'div'` 这种
   不存在的组件类型，stylelint 直接抛 `Unexpected token type: div`。
   所以 RN 用独立的 `src/app.rn.scss`（只有类选择器）。
6. **RN 的 `lineHeight` 是绝对像素**，无单位的 `line-height: 1.5` 会变成 1.5px，
   行高直接塌掉。用 `scripts/fix-rn-line-height.mjs` 换算成 `1.5 * $fs-body`。
7. **RN 的 `fontFamily` 只接受单个字体名**，不接受 CSS 字体栈。
   `$font-mono` 因此定成通用族名 `monospace`。
8. **`stylelint` 必须锁 16.10.0**。`stylelint-taro-rn@4.3.0` 依赖
   `stylelint/lib/utils/declarationValueIndex.cjs`，该文件在 stylelint 16.13+
   已被删除，装新版会直接构建失败。
9. **`@tarojs/runtime-rn` 的 npm 包曾经装不全**（只有 package.json 没有 dist/）。
   遇到 `Cannot find module` 先删掉 `node_modules/@tarojs/runtime-rn` 重装。
10. **`@react-native/metro-config` 必须单独装**，`react-native` 不带它。
11. **RN 原生外壳来自 `node_modules/react-native/template/`**。
    `taro init --template react-native` 依赖 GitHub 模板仓库（很多网络环境拉不到），
    所以用 `scripts/setup-native.js` 从 npm 包里取官方模板再改名接线。
12. **Gradle wrapper 的 `networkTimeout` 默认 10 秒**，下载 200MB 的发行包必超时。
    已改成 `gradle-8.2.1-all` + `networkTimeout=120000`。
13. **NDK 目录名必须带版本号**：`$ANDROID_HOME/ndk/26.1.10909125/`。
14. **Taro 的 `rn-runner` 不等待 `react-native bundle` 子进程**，
    `taro build --type rn` 报 OK 不代表 bundle 成功 —— 一定去看 `dist/rn/index.bundle`。
15. **`@tarojs/components-rn` 与 `@tarojs/taro-rn` 的 barrel 会无差别 re-export 全部组件**，
    其中 expo-camera / react-native-maps 等重量级模块我们一个都不用。
    `src/rn-stubs/native-unavailable.ts` + `config/index.ts` 的 `rn.alias` 把它们换成占位桩。
