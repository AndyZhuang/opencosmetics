import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Card,
  Chip,
  DataRow,
  EmptyState,
  ErrorState,
  HScroll,
  Mono,
  SearchInput,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { searchIngredients } from '../../api/endpoints'
import type { IngredientItem } from '../../api/types'
import { range } from '../../utils/format'
import { roleZh } from '../../utils/inci'
import { debounce } from '../../utils'
import './index.scss'

const ROLES = [
  { v: '', l: '全部' },
  { v: 'active', l: '功效活性' },
  { v: 'solvent', l: '溶剂' },
  { v: 'humectant', l: '保湿剂' },
  { v: 'emollient', l: '润肤剂' },
  { v: 'emulsifier', l: '乳化剂' },
  { v: 'surfactant', l: '表活' },
  { v: 'thickener', l: '增稠剂' },
  { v: 'preservative', l: '防腐剂' },
  { v: 'antioxidant', l: '抗氧剂' },
  { v: 'uv_filter', l: '紫外线吸收剂' },
  { v: 'extract', l: '提取物' },
  { v: 'chelator', l: '螯合剂' },
  { v: 'ph_adjuster', l: 'pH调节剂' },
  { v: 'colorant', l: '着色剂' },
]

const FILTERS = [
  { v: '', l: '不限' },
  { v: 'cn', l: '已入 IECIC' },
  { v: 'priced', l: '有价格' },
]

export default function IngredientsPage() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [only, setOnly] = useState('')
  const [items, setItems] = useState<IngredientItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useMemo(
    () =>
      debounce((query: string, roleV: string, onlyV: string) => {
        setLoading(true)
        setErr('')
        searchIngredients({
          q: query.trim() || undefined,
          role: roleV || undefined,
          only: (onlyV || undefined) as 'cn' | 'priced' | 'banned' | undefined,
          limit: 60,
        })
          .then((res) => {
            setItems(res.items || [])
            setTotal(res.total || 0)
          })
          .catch((e) => {
            setErr(e instanceof Error ? e.message : String(e))
            setItems([])
          })
          .finally(() => setLoading(false))
      }, 280),
    [],
  )

  useEffect(() => {
    load(q, role, only)
  }, [q, role, only, load])

  function open(item: IngredientItem) {
    Taro.navigateTo({
      url: `/pages/ingredients/detail?name=${encodeURIComponent(item.inci_name)}`,
    })
  }

  return (
    <PageShell title="成分库" subtitle="CosIng + IECIC + 原料画像" tab>
      <View className="bn-search-wrap">
        <SearchInput
          id="formulalab-ingredient-search"
          value={q}
          onInput={setQ}
          placeholder="搜 INCI 或中文名, 如 niacinamide / 烟酰胺"
        />
      </View>

      <View className="bn-filter-row">
        <HScroll>
          {ROLES.map((r) => (
            <Chip
              key={r.v || 'all'}
              label={r.l}
              active={role === r.v}
              onClick={() => setRole(r.v)}
            />
          ))}
        </HScroll>
      </View>
      <View className="bn-filter-row">
        <HScroll>
          {FILTERS.map((f) => (
            <Chip
              key={f.v || 'all'}
              label={f.l}
              active={only === f.v}
              onClick={() => setOnly(f.v)}
            />
          ))}
        </HScroll>
        <Text className="bn-count mono">{loading ? '检索中…' : `${total} 条`}</Text>
      </View>

      {err ? <ErrorState message={err} onRetry={() => load(q, role, only)} /> : null}

      {loading && items.length === 0 ? (
        <Skeleton rows={6} />
      ) : null}

      {!loading && !err && items.length === 0 ? (
        <EmptyState title="没有匹配的成分" hint="换个关键词试试" />
      ) : null}

      {items.length > 0 && (
        <Card>
          {items.map((it, i) => (
            <DataRow
              key={it.inci_name}
              index={String(i + 1).padStart(2, '0')}
              name={it.inci_name}
              cn={it.chinese_name || undefined}
              meta={
                <>
                  <Badge tone="accent">{roleZh(it.role)}</Badge>
                  {it.use_min !== null ? (
                    <Badge tone="neutral">
                      典型 {range(it.use_min, it.use_max)}
                    </Badge>
                  ) : null}
                  {it.price_lo !== null ? (
                    <Badge tone="neutral">
                      ¥{it.price_lo}–{it.price_hi}/kg
                    </Badge>
                  ) : null}
                </>
              }
              right={
                <View className="bn-flags">
                  {it.cn_status === 'iecic_i_included' ? (
                    <Badge tone="ok">IECIC</Badge>
                  ) : it.cn_status === 'not_in_iecic' ? (
                    <Badge tone="neutral">未收录</Badge>
                  ) : null}
                  {it.eu_status === 'banned' ? (
                    <Badge tone="block">EU 禁用</Badge>
                  ) : it.eu_status === 'restricted' ? (
                    <Badge tone="warn">EU 限用</Badge>
                  ) : null}
                </View>
              }
              onClick={() => open(it)}
            />
          ))}
        </Card>
      )}

      <View className="bn-foot-note">
        <Text className="bn-foot-text">
          价格为估算参考值, 须按供应商报价校准
        </Text>
      </View>
    </PageShell>
  )
}
