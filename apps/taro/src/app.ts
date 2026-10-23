import { PropsWithChildren } from 'react'

import { useAppBootstrap } from './app-init'
import './app.scss'

/**
 * App 入口 (weapp / h5)
 * RN 平台走 src/app.rn.ts (全局样式不同, 见该文件注释)。
 */
function App({ children }: PropsWithChildren) {
  useAppBootstrap()
  return children as any
}

export default App
