import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import './BottomNav.scss'

/**
 * 自绘底部导航 —— 不用原生 tabBar。
 * 原因: 原生 tabBar 必须配图片资源, 三端 (weapp/h5/rn) 图标表现也不一致;
 *       自绘可以做到三端像素级一致, 且不需要任何图片文件。
 */

export interface NavItem {
  key: string
  index: string
  label: string
  url: string
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'workbench', index: '01', label: '工作台', url: '/pages/workbench/index' },
  { key: 'bench', index: '02', label: '构建器', url: '/pages/bench/index' },
  { key: 'ingredients', index: '03', label: '成分库', url: '/pages/ingredients/index' },
  { key: 'formulas', index: '04', label: '我的', url: '/pages/formulas/index' },
]

export function BottomNav({ current }: { current: string }) {
  const go = (item: NavItem) => {
    if (item.url === current) return
    Taro.reLaunch({ url: item.url })
  }

  return (
    <View className="tabbar">
      {NAV_ITEMS.map((item) => {
        const active = item.url === current
        return (
          <View
            key={item.key}
            className={`tab${active ? ' tab-active' : ''}`}
            onClick={() => go(item)}
          >
            <View className={`tab-marker${active ? ' tab-marker-active' : ''}`} />
            <Text className={`tab-index mono${active ? ' tab-index-active' : ''}`}>
              {item.index}
            </Text>
            <Text className={`tab-label${active ? ' tab-label-active' : ''}`}>{item.label}</Text>
          </View>
        )
      })}
    </View>
  )
}
