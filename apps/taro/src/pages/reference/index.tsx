import { useEffect, useState } from 'react'
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
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { getReferenceFormula, listReferenceFormulas } from '../../api/endpoints'
import type { ReferenceFormula } from '../../api/types'
import './index.scss'

export default function ReferencePage() {
  const [items, setItems] = useState<ReferenceFormula[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [cat, setCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [detail, setDetail] = useState<ReferenceFormula | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    listReferenceFormulas()
      .then((res) => {
        setItems(res.formulas || [])
        setCategories(res.categories || [])
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cat ? items.filter((f) => f.category === cat) : items

  async function open(f: ReferenceFormula) {
    setDetailLoading(true)
    try {
      const res = await getReferenceFormula(f.id)
      setDetail(res.formula || f)
    } catch (e) {
      setDetail(f)
    } finally {
      setDetailLoading(false)
    }
  }

  if (detail) {
    const inciList = (detail.inci || '')
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    return (
      <PageShell title={detail.name_zh} subtitle={detail.brand} showBack>
        <Card>
          <View className="bn-d-tags">
            <Badge tone="accent">{detail.category}</Badge>
            <Badge tone="neutral">{detail.year}</Badge>
            <Badge tone="neutral">{detail.price_tier}</Badge>
            <Badge tone="accent">{detail.actives_count} 活性</Badge>
          </View>
          {detail.notes_zh ? (
            <Text className="bn-note-text">{detail.notes_zh}</Text>
          ) : null}
          {detail.vehicle ? (
            <Text className="bn-note-text">基质: {detail.vehicle}</Text>
          ) : null}
          {detail.target_demo ? (
            <Text className="bn-note-text">目标人群: {detail.target_demo}</Text>
          ) : null}
        </Card>

        <SectionTitle title="INCI 全表" hint={`${inciList.length} 个`} />
        <Card>
          {inciList.map((inc, i) => (
            <View className="bn-cmp-row" key={`${inc}-${i}`}>
              <Text className="bn-cmp-idx mono">{String(i + 1).padStart(2, '0')}</Text>
              <Text className="bn-cmp-name mono">{inc}</Text>
            </View>
          ))}
        </Card>

        {detail.key_actives && detail.key_actives.length > 0 && (
          <>
            <SectionTitle title="关键活性" />
            <Card>
              <View className="bn-d-tags">
                {detail.key_actives.map((a) => (
                  <Badge tone="accent" key={a}>
                    {a}
                  </Badge>
                ))}
              </View>
            </Card>
          </>
        )}

        <View className="bn-actions">
          <View className="bn-chip-btn" onClick={() => setDetail(null)}>
            <Text className="bn-chip-btn-text">← 返回列表</Text>
          </View>
        </View>
      </PageShell>
    )
  }

  return (
    <PageShell title="参考配方库" subtitle="经典商业配方" showBack>
      {err ? <ErrorState message={err} /> : null}
      {loading ? <Skeleton rows={5} /> : null}

      {categories.length > 0 && (
        <View className="bn-filter-row">
          <HScroll>
            <Chip label="全部" active={cat === ''} onClick={() => setCat('')} />
            {categories.map((c) => (
              <Chip
                key={c}
                label={c}
                active={cat === c}
                onClick={() => setCat(c)}
              />
            ))}
          </HScroll>
        </View>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <EmptyState title="没有匹配的配方" />
        </Card>
      )}

      {filtered.length > 0 && (
        <Card>
          {filtered.map((f, i) => (
            <DataRow
              key={f.id}
              index={String(i + 1).padStart(2, '0')}
              name={f.name_zh}
              cn={f.brand}
              meta={
                <>
                  <Badge tone="neutral">{f.category}</Badge>
                  <Badge tone="neutral">{f.year}</Badge>
                  <Badge tone="accent">{f.actives_count} 活性</Badge>
                </>
              }
              onClick={() => open(f)}
            />
          ))}
        </Card>
      )}

      {detailLoading ? <Skeleton rows={2} /> : null}
    </PageShell>
  )
}
