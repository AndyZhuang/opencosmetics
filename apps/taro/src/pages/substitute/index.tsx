import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  KeyValue,
  SectionTitle,
  Skeleton,
} from '../../components/ui'
import { findSubstitutes } from '../../api/endpoints'
import type { SubstituteResponse } from '../../api/types'
import './index.scss'

const EXAMPLES = ['RETINOL', 'NIACINAMIDE', 'HYDROQUINONE', 'SQUALANE', 'ASCORBIC ACID']

export default function SubstitutePage() {
  const [name, setName] = useState('')
  const [res, setRes] = useState<SubstituteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function run(inci?: string) {
    const target = (inci ?? name).trim().toUpperCase()
    if (!target) return
    setName(target)
    setLoading(true)
    setErr('')
    try {
      const r = await findSubstitutes(target, 6)
      setRes(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setRes(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell title="成分替代" subtitle="同功能位替换方案" showBack>
      <Card>
        <View className="bn-block">
          <Text className="bn-label">要替换的成分</Text>
          <Input
            className="bn-input mono"
            value={name}
            placeholder="RETINOL / NIACINAMIDE / ..."
            placeholderClass="bn-placeholder"
            onInput={(e) => setName(e.detail.value)}
            onConfirm={() => run()}
          />
        </View>
        <View className="bn-actions">
          <Button onClick={() => run()} disabled={!name.trim()}>
            {loading ? '查找中…' : '找替代'}
          </Button>
        </View>
        <View className="bn-filter-row">
          <Text className="bn-label" style={{ marginRight: '16px' }}>示例</Text>
          {EXAMPLES.map((e) => (
            <View className="bn-chip-btn" key={e} onClick={() => run(e)}>
              <Text className="bn-chip-btn-text mono">{e}</Text>
            </View>
          ))}
        </View>
      </Card>

      {err ? <ErrorState message={err} onRetry={() => run()} /> : null}
      {loading ? <Skeleton rows={4} /> : null}

      {res && !loading && (
        <View>
          {!res.found ? (
            <Card>
              <EmptyState
                title="没有找到替代方案"
                hint={res.message_zh || '该成分不在替代分组库中, 可在成分库里检索同功能原料'}
              />
            </Card>
          ) : (
            <View>
              <SectionTitle title={res.group} hint={`${res.candidates_count} 个候选`} />
              <Card>
                <Text className="bn-note-text">{res.group_function}</Text>
              </Card>

              <SectionTitle title="推荐替代" hint={`${res.suggestions.length} 个`} />
              {res.suggestions.map((s) => (
                <Card key={s.inci_name} className="bn-sub-card">
                  <View className="bn-sub-head">
                    <Text className="bn-sub-name mono">{s.inci_name}</Text>
                    <Badge tone="accent">{s.tier}</Badge>
                  </View>
                  {s.notes_zh ? (
                    <Text className="bn-note-text">{s.notes_zh}</Text>
                  ) : null}
                  <View className="bn-d-tags">
                    {s.concentration?.max_pct !== undefined ? (
                      <Badge tone="warn">上限 {s.concentration.max_pct}%</Badge>
                    ) : null}
                    {s.concentration?.note ? (
                      <Badge tone="neutral">{s.concentration.note}</Badge>
                    ) : null}
                    {s.regulatory?.cn_iecic ? (
                      <Badge tone="ok">IECIC 已收录</Badge>
                    ) : (
                      <Badge tone="neutral">未入 IECIC</Badge>
                    )}
                    {s.regulatory?.eu_banned ? (
                      <Badge tone="block">EU 禁用</Badge>
                    ) : null}
                    {s.regulatory?.eu_restricted ? (
                      <Badge tone="warn">EU 限用</Badge>
                    ) : null}
                    <Badge tone="neutral">价格指数 {s.price_index}</Badge>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}
    </PageShell>
  )
}
