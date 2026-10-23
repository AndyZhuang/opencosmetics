import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'

import { BottomNav } from './BottomNav'
import './PageShell.scss'
import './ui.scss'

/** 状态栏高度 (weapp 有, h5 / rn 为 0) */
export function getStatusBarHeight(): number {
  try {
    const taroAny = Taro as any
    const info = taroAny.getWindowInfo ? taroAny.getWindowInfo() : taroAny.getSystemInfoSync()
    const h = info && info.statusBarHeight
    return typeof h === 'number' && h > 0 ? h : 0
  } catch (e) {
    return 0
  }
}

/** 当前页面路径 */
export function getCurrentPath(): string {
  try {
    const inst = Taro.getCurrentInstance()
    return (inst && inst.router && inst.router.path) || ''
  } catch (e) {
    return ''
  }
}

/**
 * 页面外壳 —— 自绘顶栏 (navigationStyle: custom) + 内容区 + 可选底部导航。
 * 三端一致: 不依赖原生导航栏, h5 也不会出现两套标题。
 */
export function PageShell({
  title,
  subtitle,
  showBack = false,
  right,
  children,
  tab = false,
}: {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: ReactNode
  children?: ReactNode
  /** 是否显示底部导航 (4 个主页面) */
  tab?: boolean
}) {
  const statusBar = getStatusBarHeight()

  const onBack = () => {
    const inst: any = Taro.getCurrentInstance()
    const stack = inst && inst.router && inst.router.stack
    if (stack && stack.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.reLaunch({ url: '/pages/workbench/index' })
    }
  }

  return (
    <View className="shell">
      <View className="shell-topbar" style={{ paddingTop: `${statusBar}px` }}>
        <View className="topbar">
          <View className="topbar-left">
            {showBack ? (
              <View className="topbar-back" onClick={onBack}>
                <Text className="topbar-back-text mono">←</Text>
              </View>
            ) : (
              <View className="topbar-brand">
                <Text className="topbar-brand-mark mono">FL</Text>
              </View>
            )}
          </View>
          <View className="topbar-center">
            <Text className="topbar-title">{title}</Text>
            {subtitle ? <Text className="topbar-sub">{subtitle}</Text> : null}
          </View>
          <View className="topbar-right">{right}</View>
        </View>
      </View>
      <View className={`shell-body${tab ? ' shell-body-tab' : ''}`}>{children}</View>
      {tab ? <BottomNav current={getCurrentPath()} /> : null}
    </View>
  )
}
