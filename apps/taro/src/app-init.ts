import { useLaunch } from '@tarojs/taro'

import { loadPersistedApiBase, setDeviceId } from './api/client'
import { ensureDeviceId } from './store/device'

/**
 * App 启动引导 (weapp / h5 / rn 三端共用)
 *
 * 启动时:
 *   1. 读取本地覆盖的 API baseURL (真机联调时把 localhost 换成公网地址)
 *   2. 生成本机 device id (配方草稿按设备维度隔离)
 */
export function useAppBootstrap(): void {
  useLaunch(() => {
    try {
      loadPersistedApiBase()
      setDeviceId(ensureDeviceId())
    } catch (e) {
      console.warn('[FormulaLab] 启动初始化失败', e)
    }
  })
}
