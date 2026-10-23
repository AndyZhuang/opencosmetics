import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Card,
  DataRow,
  EmptyState,
  ErrorState,
  Mono,
  SearchInput,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { getStats, listFormulas, searchIngredients } from '../../api/endpoints'
import type { FormulaSummary, IngredientItem, StatsResponse } from '../../api/types'
import { dateOnly, fromNow } from '../../utils/format'
import { debounce } from '../../utils'
import './index.scss'

// ---- 工具九宫格 ---------------------------------------------------------
const TOOLS: { label: string; hint: string; url: string }[] = [
  { label: '配方构建器', hint: '用量 / 相位 / 成本', url: '/pages/bench/index' },
  { label: '风险审查', hint: '65 条规则', url: '/pages/risk/index' },
  { label: '成分替代', hint: '同功能替换', url: '/pages/substitute/index' },
  { label: '目标反推', hint: '功效 → 骨架', url: '/pages/claim/index' },
  { label: '参考配方', hint: '商业 INCI', url: '/pages/reference/index' },
  { label: '成分库', hint: '法规 / 用量 / 价格', url: '/pages/ingredients/index' },
  { label: '我的配方', hint: '草稿与对比', url: '/pages/formulas/index' },
]

const QUICK: { label: string; sub: string; url: string }[] = [
  { label: '粘 INCI 反查', sub: '粘贴成分列表 → 规则命中', url: '/pages/risk/index' },
  { label: '建配方', sub: '用量 / 相位 / 成本', url: '/pages/bench/index' },
  { label: '查成分', sub: '法规 / 用量 / 价格', url: '/pages/ingredients/index' },
]

export default function WorkbenchPage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<IngredientItem[]>([])
  const [sugLoading, setSugLoading] = useState(false)
  const [sugOpen, setSugOpen] = useState(false)

  const [drafts, setDrafts] = useState<FormulaSummary[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)
  const [draftsError, setDraftsError] = useState('')

  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [statsError, setStatsError] = useState('')

  const sugSeq = useRef(0)

  const loadDrafts = () => {
    setDraftsLoading(true)
    setDraftsError('')
    listFormulas()
      .then((res) => {
        setDrafts((res.formulas || []).slice(0, 3))
      })
      .catch((e) => {
        setDraftsError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        setDraftsLoading(false)
      })
  }

  const loadStats = () => {
    setStatsError('')
    getStats()
      .then(setStats)
      .catch((e) => {
        setStatsError(e instanceof Error ? e.message : String(e))
      })
  }

  useEffect(() => {
    loadDrafts()
    loadStats()
  }, [])

  const fetchSuggest = debounce((q: string) => {
    const seq = ++sugSeq.current
    if (!q.trim()) {
      setSuggestions([])
      setSugLoading(false)
      setSugOpen(false)
      return
    }
    setSugLoading(true)
    setSugOpen(true)
    searchIngredients({ q: q.trim(), limit: 8 })
      .then((res) => {
        if (seq !== sugSeq.current) return
        setSuggestions(res.items || [])
      })
      .catch(() => {
        if (seq !== sugSeq.current) return
        setSuggestions([])
      })
      .finally(() => {
        if (seq === sugSeq.current) setSugLoading(false)
      })
  }, 250)

  const onSearch = (v: string) => {
    setQuery(v)
    fetchSuggest(v)
  }

  const openIngredient = (item: IngredientItem) => {
    setSugOpen(false)
    Taro.navigateTo({ url: `/pages/ingredients/detail?name=${encodeURIComponent(item.inci_name)}` })
  }

  const goto = (url: string) => Taro.navigateTo({ url })

  const rulesCount =
    stats?.sources?.find((s) => s.type && s.type.indexOf('风险规则') === 0)?.n ??
    stats?.sources?.find((s) => s.name === 'rules.json')?.n ??
    65

  return (
    <PageShell title="配方引擎" subtitle="FormulaLab · 美妆配方工作台" tab>
      {/* 全局搜索 */}
      <View className="wb-search-wrap">
        <SearchInput
          value={query}
          onInput={onSearch}
          placeholder="搜成分名或中文名, 如 NIACINAMIDE / 烟酰胺"
        />
        {sugOpen ? (
          <View className="wb-suggest">
            {sugLoading && suggestions.length === 0 ? (
              <View className="wb-suggest-loading">
                <Text className="wb-suggest-hint">检索中…</Text>
              </View>
            ) : null}
            {!sugLoading && suggestions.length === 0 ? (
              <View className="wb-suggest-loading">
                <Text className="wb-suggest-hint">没有匹配的成分</Text>
              </View>
            ) : null}
            {suggestions.map((it) => (
              <View key={it.inci_name} className="wb-suggest-item" onClick={() => openIngredient(it)}>
                <View className="wb-suggest-main">
                  <Text className="wb-suggest-name mono">{it.inci_name}</Text>
                  {it.chinese_name ? (
                    <Text className="wb-suggest-cn">{it.chinese_name}</Text>
                  ) : null}
                </View>
                <View className="wb-suggest-meta">
                  {it.role ? <Badge tone="accent">{it.role}</Badge> : null}
                  {it.cn_status === 'iecic_i_included' ? (
                    <Badge tone="ok">IECIC</Badge>
                  ) : it.eu_status === 'banned' ? (
                    <Badge tone="block">EU 禁用</Badge>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* 快速入口 */}
      <View className="wb-quick">
        {QUICK.map((q) => (
          <View key={q.label} className="wb-quick-item" onClick={() => goto(q.url)}>
            <Text className="wb-quick-label">{q.label}</Text>
            <Text className="wb-quick-sub">{q.sub}</Text>
            <Text className="wb-quick-arrow mono">→</Text>
          </View>
        ))}
      </View>

      {/* 最近草稿 */}
      <SectionTitle title="我的草稿" hint="最近 3 条" />
      <Card>
        {draftsLoading ? (
          <Skeleton rows={2} />
        ) : draftsError ? (
          <ErrorState message={draftsError} onRetry={loadDrafts} />
        ) : drafts.length === 0 ? (
          <EmptyState
            title="还没有草稿"
            hint="到「构建器」搭一个配方, 保存后会出现在这里。"
          />
        ) : (
          drafts.map((d, i) => (
            <DataRow
              key={d.id}
              index={String(i + 1).padStart(2, '0')}
              name={d.name}
              cn={d.product_type || undefined}
              meta={
                <>
                  <Badge tone="neutral">{d.ingredient_count} 成分</Badge>
                  <Badge tone="neutral">{d.total_pct}%</Badge>
                  <Text className="wb-draft-time">更新于 {fromNow(d.updated_at)}</Text>
                </>
              }
              right={<Text className="wb-row-arrow mono">→</Text>}
              onClick={() =>
                Taro.navigateTo({ url: `/pages/formulas/index` })
              }
            />
          ))
        )}
      </Card>

      {/* 工具九宫格 */}
      <SectionTitle title="工具" hint="7 个" />
      <View className="wb-tools">
        {TOOLS.map((t) => (
          <View key={t.label} className="wb-tool" onClick={() => goto(t.url)}>
            <Text className="wb-tool-label">{t.label}</Text>
            <Text className="wb-tool-hint">{t.hint}</Text>
          </View>
        ))}
      </View>

      {/* 可信度信息 —— 不做炫技式大数字 */}
      <SectionTitle title="数据可信度" />
      <Card>
        {statsError ? (
          <ErrorState message={statsError} onRetry={loadStats} />
        ) : !stats ? (
          <Skeleton rows={3} />
        ) : (
          <View className="wb-trust">
            <View className="wb-trust-row">
              <Text className="wb-trust-label">数据源</Text>
              <Text className="wb-trust-value mono">
                {stats.sources.length} 个 · {stats.total_records.toLocaleString()} 条记录
              </Text>
            </View>
            <View className="wb-trust-row">
              <Text className="wb-trust-label">覆盖地区</Text>
              <Text className="wb-trust-value mono">
                EU {stats.by_region.EU?.toLocaleString() ?? '—'} · CN{' '}
                {stats.by_region.CN?.toLocaleString() ?? '—'} · US{' '}
                {stats.by_region.US?.toLocaleString() ?? '—'}
              </Text>
            </View>
            <View className="wb-trust-row">
              <Text className="wb-trust-label">风险规则</Text>
              <Text className="wb-trust-value mono">{rulesCount} 条 (7 类)</Text>
            </View>
            <View className="wb-trust-row">
              <Text className="wb-trust-label">数据快照</Text>
              <Text className="wb-trust-value mono">{dateOnly(stats.timestamp)}</Text>
            </View>
            <View className="wb-trust-note">
              <Text className="wb-trust-note-text">
                数据来自 EU CosIng / NMPA IECIC / FDA openFDA 等公开源, 价格为估算参考值, 须按供应商报价校准。
              </Text>
            </View>
          </View>
        )}
      </Card>
    </PageShell>
  )
}
