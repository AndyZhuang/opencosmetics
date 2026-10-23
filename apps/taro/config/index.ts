import path from 'node:path'

import { defineConfig, type UserConfigExport } from '@tarojs/cli'

import devConfig from './dev'
import prodConfig from './prod'

/**
 * 配方引擎 FormulaLab — Taro 4 多端配置
 *
 * 目标平台:
 *   weapp — 微信小程序 (小程序标题「配方引擎」)
 *   h5    — 浏览器
 *   rn    — React Native (android / ios), 见 README「rn 平台构建前置条件」
 *
 * 尺寸约定:
 *   designWidth = 750, 且三个平台的 pxtransform 换算一致:
 *     weapp 14px -> 14rpx -> 375pt 屏上 7pt
 *     h5    14px -> 0.35rem -> 375pt 屏上 7pt
 *     rn    14px -> 7px -> 375pt 屏上 7pt
 *   即: **源码里的 1px = 375pt 宽屏上的 0.5 物理 px**。
 *   src/styles/tokens.scss 中的 token 已按此倍率写好, 改样式时只改 token。
 */
export default defineConfig<'webpack5'>(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'formulalab',
    date: '2026-10-23',
    designWidth: 750,
    deviceRatio: {
      375: 2,
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    // 输出目录按平台隔离, 由 scripts/build.mjs 通过 TARO_OUTPUT_ROOT 注入:
    //   weapp -> dist        (小程序开发者工具直接导入这个目录)
    //   h5    -> dist/h5
    //   rn    -> dist/rn
    // 三者共用 'dist' 会互相覆盖 (H5 的 index.html 会盖掉小程序的 app.json)。
    outputRoot: process.env.TARO_OUTPUT_ROOT || 'dist',
    plugins: [],
    defineConstants: {},
    alias: {
      // RN 样式转换器用 dart-sass 的 legacy API 且不传 file 选项,
      // 同一目录的相对路径会被规范化成不带 './' 的形式 ('styles/tokens'),
      // 从而落到 node_modules 查找分支 -> 报「样式文件没有找到」。
      // 这里给出绝对路径别名兜底。
      // 注意: 别名值 **不带扩展名**, 因为转换器会在原 id 后面追加 .scss 再拼路径,
      // 带扩展名会变成 tokens.scss.scss。详见 scripts/fix-scss-imports.mjs 注释。
      'styles/tokens': path.resolve(__dirname, '../src/styles/tokens'),
      tokens: path.resolve(__dirname, '../src/styles/tokens'),
    },
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    // Taro 4 的 compiler 取值为 'webpack5' | 'vite' (旧版 Taro 3 的 'taro3'/'taro4' 已被
    // config schema 移除, 填 'taro4' 会被 CLI 判为配置错误并中止构建)。此处等价于默认 webpack5。
    compiler: 'webpack5',
    cache: {
      enable: false,
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
        },
      },
    },
    // 说明: Taro 4.x 不再支持 mini.projectConfig (那是 Taro 3 的写法),
    // 小程序配置统一走工程根目录的 project.config.json, 构建时由 Taro 拷贝进产物目录。
    h5: {
      publicPath: process.env.TARO_H5_PUBLIC_PATH || '/',
      staticDirectory: 'static',
      esnextModules: ['taro-ui'],
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
        },
      },
      devServer: {
        host: '0.0.0.0',
        port: 10086,
        // 本地开发: 把 /api 代理到上游 Next.js dev server (3010 端口)
        proxy: {
          '/api': {
            target: 'http://localhost:3010',
            changeOrigin: true,
          },
        },
      },
    },
    rn: {
      appName: 'FormulaLab',
      // RN 平台专用别名: 把未使用的重量级原生模块统一指向桩文件。
      // 详见 src/rn-stubs/native-unavailable.ts 顶部说明。
      alias: {
        'expo-camera': './src/rn-stubs/native-unavailable.ts',
        'expo-av': './src/rn-stubs/native-unavailable.ts',
        'expo-sensors': './src/rn-stubs/native-unavailable.ts',
        'expo-file-system': './src/rn-stubs/native-unavailable.ts',
        'expo-image-picker': './src/rn-stubs/native-unavailable.ts',
        'expo-location': './src/rn-stubs/native-unavailable.ts',
        'expo-brightness': './src/rn-stubs/native-unavailable.ts',
        'expo-keep-awake': './src/rn-stubs/native-unavailable.ts',
        'expo-barcode-scanner': './src/rn-stubs/native-unavailable.ts',
        'react-native-maps': './src/rn-stubs/native-unavailable.ts',
        'react-native-webview': './src/rn-stubs/native-unavailable.ts',
        'react-native-pager-view': './src/rn-stubs/native-unavailable.ts',
        'react-native-svg': './src/rn-stubs/native-unavailable.ts',
        '@react-native-community/slider': './src/rn-stubs/native-unavailable.ts',
        '@react-native-camera-roll/camera-roll': './src/rn-stubs/native-unavailable.ts',
        '@bam.tech/react-native-image-resizer': './src/rn-stubs/native-unavailable.ts',
        '@react-native-clipboard/clipboard': './src/rn-stubs/native-unavailable.ts',
        '@react-native-community/geolocation': './src/rn-stubs/native-unavailable.ts',
        '@react-native-community/netinfo': './src/rn-stubs/native-unavailable.ts',
        'react-native-image-zoom-viewer': './src/rn-stubs/native-unavailable.ts',
      },
    },
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
