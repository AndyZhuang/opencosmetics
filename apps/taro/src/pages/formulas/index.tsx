import { useCallback, useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Button,
  Card,
  Chip,
  DataRow,
  EmptyState,
  ErrorState,
  HScroll,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { compareFormulas, deleteFormula, getFormula, listFormulas } from '../../api/endpoints'
import type { CompareResponse, FormulaSummary } from '../../api/types'
import { delta, money, num } from '../../utils/format'
import { fromNow } from '../../utils/format'
import './index.scss'

export default function FormulasPage() {
  const [items, setItems] = useState<FormulaSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [cmp, setCmp] = useState<CompareResponse | null>(null)
  const [cmpLoading, setCmpLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setErr('')
    listFormulas()
      .then((res) => setItems(res.formulas || []))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 2
          ? [prev[1], id]
          : [...prev, id],
    )
    setCmp(null)
  }

  async function remove(id: string) {
    try {
      await deleteFormula(id)
      setSelected((prev) => prev.filter((x) => x !== id))
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : '删除失败')
    }
  }

  async function runCompare() {
    if (selected.length !== 2) return
    setCmpLoading(true)
    setErr('')
    try {
      const details = await Promise.all(
        selected.map(async (id) => {
          const res = await getFormula(id)
          return res.formula
        }),
      )
      if (!details[0] || !details[1]) throw new Error('草稿读取失败')
      const res = await compareFormulas({
        a: { lines: details[0].lines },
        b: { lines: details[1].lines },
      })
      setCmp(res)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '对比失败')
    } finally {
      setCmpLoading(false)
    }
  }

  return (
    <PageShell title="我的配方" subtitle="草稿按本机设备保存" tab>
      {err ? <ErrorState message={err} onRetry={load} /> : null}
      {loading ? <Skeleton rows={4} /> : null}

      {!loading && !err && items.length === 0 && (
        <Card>
          <EmptyState
            title="还没有草稿"
            hint="到「构建器」搭一个配方, 保存后会出现在这里"
          />
        </Card>
      )}

      {items.length > 0 && (
        <View>
          <SectionTitle title="草稿" hint={`${items.length} 个`} />
          <Card>
            {items.map((f, i) => (
              <View key={f.id} className="bn-f-item">
                <DataRow
                  index={String(i + 1).padStart(2, '0')}
                  name={f.name}
                  cn={f.product_type || undefined}
                  meta={
                    <>
                      <Badge tone="neutral">{f.ingredient_count} 成分</Badge>
                      <Badge tone="neutral">{f.total_pct}%</Badge>
                      <Badge tone="accent">v{f.version}</Badge>
                      <Text className="bn-draft-time">{fromNow(f.updated_at)}</Text>
                    </>
                  }
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/pages/bench/index?id=${encodeURIComponent(f.id)}`,
                    })
                  }
                />
                <View className="bn-f-actions">
                  <View
                    className={`bn-chip-btn${selected.includes(f.id) ? ' bn-chip-btn-on' : ''}`}
                    onClick={() => toggle(f.id)}
                  >
                    <Text className="bn-chip-btn-text">
                      {selected.includes(f.id) ? '已选' : '对比'}
                    </Text>
                  </View>
                  <View className="bn-chip-btn bn-chip-btn-danger" onClick={() => remove(f.id)}>
                    <Text className="bn-chip-btn-text">删除</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>

          {selected.length > 0 && (
            <View className="bn-actions">
              <Button onClick={runCompare} disabled={selected.length !== 2}>
                {cmpLoading ? '对比中…' : `对比所选 (${selected.length}/2)`}
              </Button>
            </View>
          )}

          {cmp && (
            <View>
              <SectionTitle title="版本对比" />
              <Card>
                <View className="bn-stat-row">
                  <View className="bn-cmp-cell">
                    <Text className="bn-label">A 单公斤</Text>
                    <Text className="bn-cmp-val mono">{money(cmp.cost.a.total_per_kg)}</Text>
                  </View>
                  <View className="bn-cmp-cell">
                    <Text className="bn-label">B 单公斤</Text>
                    <Text className="bn-cmp-val mono">{money(cmp.cost.b.total_per_kg)}</Text>
                  </View>
                </View>
                <View className="bn-stat-row">
                  <View className="bn-cmp-cell">
                    <Text className="bn-label">差异</Text>
                    <Text className="bn-cmp-val mono">{delta(cmp.cost.delta_per_kg)}</Text>
                  </View>
                  <View className="bn-cmp-cell">
                    <Text className="bn-label">变动比例</Text>
                    <Text className="bn-cmp-val mono">{num(cmp.cost.delta_pct, 1)}%</Text>
                  </View>
                </View>
              </Card>

              <Card>
                {cmp.diffs.length === 0 ? (
                  <EmptyState title="两个版本成分完全一致" />
                ) : (
                  cmp.diffs.map((d) => (
                    <View className="bn-cmp-row" key={d.inci_name}>
                      <Text className="bn-cmp-name mono">{d.inci_name}</Text>
                      <Text className="bn-cmp-num mono">
                        {d.a_pct} → {d.b_pct}
                      </Text>
                      <Badge
                        tone={
                          d.status === 'added'
                            ? 'ok'
                            : d.status === 'removed'
                              ? 'block'
                              : 'warn'
                        }
                      >
                        {d.status === 'added'
                          ? '新增'
                          : d.status === 'removed'
                            ? '移除'
                            : '调整'}
                      </Badge>
                    </View>
                  ))
                )}
              </Card>
            </View>
          )}
        </View>
      )}
    </PageShell>
  )
}
