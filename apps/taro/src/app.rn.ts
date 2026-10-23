import { PropsWithChildren } from 'react'

import { useAppBootstrap } from './app-init'
import './app.rn.scss'

/**
 * React Native 平台专用的 App 入口
 *
 * Taro 的 RN 编译链优先解析 `src/app.rn.ts`:
 *   - @tarojs/rn-transformer 的 getCommonStyle() 优先读 `app.rn.{tsx,ts,jsx,js}`
 *   - @tarojs/rn-supporter 的 lookup() 按 `.android -> .rn -> 原名` 找文件
 * 所以这里只需要把全局样式换成 RN 安全版 (src/app.rn.scss), 业务逻辑与 weapp/h5 共用。
 */
function App({ children }: PropsWithChildren) {
  useAppBootstrap()
  return children as any
}

export default App
