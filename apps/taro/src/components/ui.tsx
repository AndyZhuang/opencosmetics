import { View, Text, Input, ScrollView } from '@tarojs/components'
import type { ReactNode } from 'react'

/** Taro 各端 style prop 类型不一致 (weapp 字符串 / h5 CSSProperties / RN StyleProp), 这里统一放开 */
type StyleProp = any

// ============================================================================
// UI Kit —— 三端统一的视觉语言
// 纸质 / 克制 / 高数据密度 / 细边框 + 留白 + 精确数字
// 注意: 不使用 gap / box-shadow / sticky, 保证 React Native 表现一致。
// ============================================================================

type Tone = 'accent' | 'ok' | 'warn' | 'block' | 'neutral' | 'ink'

/** 等宽字体文本 —— INCI 名称与所有数字 */
export function Mono({
  children,
  className = '',
  style,
}: {
  children?: ReactNode
  className?: string
  style?: StyleProp
}) {
  return (
    <Text className={`mono ${className}`} style={style}>
      {children}
    </Text>
  )
}

/** 卡片容器 */
export function Card({
  children,
  className = '',
  style,
  onClick,
}: {
  children?: ReactNode
  className?: string
  style?: StyleProp
  onClick?: () => void
}) {
  return (
    <View className={`card ${className}`} style={style} onClick={onClick}>
      {children}
    </View>
  )
}

/** 区块标题 */
export function SectionTitle({
  title,
  hint,
  extra,
}: {
  title: string
  hint?: string
  extra?: ReactNode
}) {
  return (
    <View className="section-title">
      <View className="section-title-main">
        <Text className="section-title-text">{title}</Text>
        {hint ? <Text className="section-title-hint">{hint}</Text> : null}
      </View>
      {extra ? <View className="section-title-extra">{extra}</View> : null}
    </View>
  )
}

/** 状态徽章 */
export function Badge({
  children,
  tone = 'neutral',
  solid = false,
}: {
  children?: ReactNode
  tone?: Tone
  solid?: boolean
}) {
  return (
    <Text className={`badge badge-${tone}${solid ? ' badge-solid' : ''}`}>{children}</Text>
  )
}

/** 大数字指标 */
export function Stat({
  label,
  value,
  unit,
  tone = 'ink',
  sub,
}: {
  label: string
  value: string
  unit?: string
  tone?: Tone
  sub?: string
}) {
  return (
    <View className="stat">
      <Text className="stat-label">{label}</Text>
      <View className="stat-value-row">
        <Text className={`stat-value mono tone-${tone}`}>{value}</Text>
        {unit ? <Text className="stat-unit">{unit}</Text> : null}
      </View>
      {sub ? <Text className="stat-sub">{sub}</Text> : null}
    </View>
  )
}

/** 键值行 */
export function KeyValue({
  label,
  value,
  mono = true,
  tone,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  tone?: Tone
}) {
  return (
    <View className="kv">
      <Text className="kv-label">{label}</Text>
      <Text className={`kv-value${mono ? ' mono' : ''}${tone ? ` tone-${tone}` : ''}`}>
        {value}
      </Text>
    </View>
  )
}

/** 数据行 —— 成分表用 */
export function DataRow({
  index,
  name,
  cn,
  right,
  meta,
  onClick,
  tone,
}: {
  index?: number | string
  name: string
  cn?: string | null
  right?: ReactNode
  meta?: ReactNode
  onClick?: () => void
  tone?: Tone
}) {
  return (
    <View className={`data-row${tone ? ` data-row-${tone}` : ''}`} onClick={onClick}>
      {index !== undefined ? <Text className="data-idx mono">{index}</Text> : null}
      <View className="data-main">
        <View className="data-name-row">
          <Text className="data-name mono">{name}</Text>
          {cn ? <Text className="data-cn">{cn}</Text> : null}
        </View>
        {meta ? <View className="data-meta">{meta}</View> : null}
      </View>
      {right ? <View className="data-right">{right}</View> : null}
    </View>
  )
}

/** 横向条形图 —— 成本构成 top5 */
export function BarRow({
  label,
  sub,
  value,
  max,
  display,
  tone = 'accent',
}: {
  label: string
  sub?: string
  value: number
  max: number
  display: string
  tone?: Tone
}) {
  const pctWidth = max > 0 ? Math.max(1.5, Math.min(100, (value / max) * 100)) : 0
  return (
    <View className="bar-row">
      <View className="bar-head">
        <Text className="bar-label mono">{label}</Text>
        {sub ? <Text className="bar-sub">{sub}</Text> : null}
        <Text className="bar-value mono">{display}</Text>
      </View>
      <View className="bar-track">
        <View className={`bar-fill tone-bg-${tone}`} style={{ width: `${pctWidth}%` }} />
      </View>
    </View>
  )
}

/** 空状态 */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="state-box">
      <View className="state-rule" />
      <Text className="state-title">{title}</Text>
      {hint ? <Text className="state-hint">{hint}</Text> : null}
    </View>
  )
}

/** 错误状态 —— 失败必须可见 */
export function ErrorState({
  message,
  onRetry,
  retryLabel = '重试',
}: {
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <View className="state-box state-error">
      <View className="state-rule state-rule-block" />
      <Text className="state-title">出错了</Text>
      <Text className="state-hint">{message}</Text>
      {onRetry ? (
        <View className="btn btn-ghost state-retry" onClick={onRetry}>
          <Text className="btn-text">{retryLabel}</Text>
        </View>
      ) : null}
    </View>
  )
}

/** 骨架屏 —— 加载态不留白屏 */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  const list = Array.from({ length: rows })
  return (
    <View className="skeleton">
      {list.map((_, i) => (
        <View key={i} className="skeleton-row" />
      ))}
    </View>
  )
}

/** 按钮 */
export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: {
  children?: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}) {
  return (
    <View
      className={`btn btn-${variant} btn-${size}${disabled ? ' btn-disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      <Text className="btn-text">{children}</Text>
    </View>
  )
}

/** 可选小标签 */
export function Chip({
  label,
  active = false,
  onClick,
  tone = 'neutral',
}: {
  label: string
  active?: boolean
  onClick?: () => void
  tone?: Tone
}) {
  return (
    <View
      className={`chip${active ? ' chip-active' : ''}${active ? ` chip-active-${tone}` : ''}`}
      onClick={onClick}
    >
      <Text className={`chip-text${active ? ' chip-text-active' : ''}`}>{label}</Text>
    </View>
  )
}

/** 分段控件 */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <View className="segmented">
      {options.map((opt) => (
        <View
          key={opt.value}
          className={`segment${opt.value === value ? ' segment-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <Text className={`segment-text${opt.value === value ? ' segment-text-active' : ''}`}>
            {opt.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

/** 搜索输入 */
export function SearchInput({
  value,
  onInput,
  placeholder = '搜索',
  onConfirm,
}: {
  value: string
  onInput: (v: string) => void
  placeholder?: string
  onConfirm?: () => void
}) {
  return (
    <View className="search">
      <View className="search-glyph">
        <Text className="search-glyph-text mono">/</Text>
      </View>
      <Input
        className="search-input"
        value={value}
        type="text"
        placeholder={placeholder}
        placeholderClass="search-placeholder"
        confirmType="search"
        onInput={(e) => onInput(e.detail.value)}
        onConfirm={onConfirm}
      />
      {value ? (
        <View className="search-clear" onClick={() => onInput('')}>
          <Text className="search-clear-text mono">×</Text>
        </View>
      ) : null}
    </View>
  )
}

/** 带标签的输入行 */
export function Field({
  label,
  value,
  onInput,
  placeholder,
  type = 'text',
  suffix,
}: {
  label: string
  value: string
  onInput: (v: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'digit'
  suffix?: string
}) {
  return (
    <View className="field">
      <Text className="field-label">{label}</Text>
      <View className="field-control">
        <Input
          className="field-input mono"
          value={value}
          type={type}
          placeholder={placeholder}
          placeholderClass="field-placeholder"
          onInput={(e) => onInput(e.detail.value)}
        />
        {suffix ? <Text className="field-suffix mono">{suffix}</Text> : null}
      </View>
    </View>
  )
}

/** 横向滚动容器 —— 筛选条 */
export function HScroll({ children }: { children?: ReactNode }) {
  return (
    <ScrollView className="hscroll" scrollX enhanced showScrollbar={false}>
      <View className="hscroll-inner">{children}</View>
    </ScrollView>
  )
}

/** 分隔线 */
export function Divider() {
  return <View className="divider" />
}

/** 纸张质感的小节容器 (带左竖线强调) */
export function Rule({ children }: { children?: ReactNode }) {
  return (
    <View className="rule-block">
      <View className="rule-line" />
      <View className="rule-content">{children}</View>
    </View>
  )
}
