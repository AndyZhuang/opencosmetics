import { useMemo, useState } from 'react'
import { View, Text, Textarea } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SectionTitle,
  Segmented,
  Skeleton,
} from '../../components/ui'
import { checkRisk } from '../../api/endpoints'
import type { RiskCheckFinding, RiskCheckResponse } from '../../api/types'
import { RISK_CATEGORY_ZH } from '../../utils/inci'
import './index.scss'

type Filter = 'all' | 'block' | 'warn' | 'info'

const CATEGORY_ORDER = [
  'compatibility',
  'ph_safety',
  'concentration',
  'special_population',
  'regulatory',
  'synbio',
  'fda_event',
]

export default function RiskPage() {
  const [text, setText] = useState('')
  const [res, setRes] = useState<RiskCheckResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const ingredients = useMemo(
    () =>
      text
        .split(/[,;\n\r\t。]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    [text],
  )

  async function run() {
    if (!ingredients.length) return
    setLoading(true)
    setErr('')
    try {
      const r = await checkRisk({ ingredients, context: { region: 'CN' } })
      setRes(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setRes(null)
    } finally {
      setLoading(false)
    }
  }

  const findings: RiskCheckFinding[] = res?.findings || []
  const filtered = findings.filter((f) => {
    if (filter === 'all') return true
    const sev = f.severity || 'info'
    return sev === filter
  })
  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: filtered.filter((f) => f.category === cat) }))
    .filter((g) => g.items.length > 0)

  function findingText(f: RiskCheckFinding): string {
    const v =
      f.rationale ||
      f.status ||
      f.label_requirement ||
      f.note ||
      (f.leave_on_max_pct !== undefined
        ? `驻留上限 ${f.leave_on_max_pct}% / 淋洗上限 ${f.rinse_off_max_pct ?? '—'}%`
        : '')
    return typeof v === 'string' ? v : ''
  }

  return (
    <PageShell title="风险审查" subtitle="7 类 65 条规则" showBack>
      <Card>
        <View className="bn-block">
          <Text className="bn-label">粘贴 INCI 成分表</Text>
          <Textarea
            className="bn-textarea mono"
            value={text}
            placeholder="AQUA, RETINOL, ASCORBIC ACID, ..."
            placeholderClass="bn-placeholder"
            onInput={(e) => setText(e.detail.value)}
          />
        </View>
        <View className="bn-actions">
          <Button onClick={run} disabled={!ingredients.length}>
            {loading ? '扫描中…' : '扫描配方'}
          </Button>
          <Text className="bn-count mono">{ingredients.length} 个成分</Text>
        </View>
      </Card>

      {err ? <ErrorState message={err} onRetry={run} /> : null}
      {loading ? <Skeleton rows={4} /> : null}

      {res && !loading && (
        <View>
          <Card>
            <View className="bn-risk-head">
              <Badge
                tone={
                  res.summary === 'PASS'
                    ? 'ok'
                    : res.summary === 'REVIEW'
                      ? 'warn'
                      : 'block'
                }
                solid
              >
                {res.summary}
              </Badge>
              <Text className="bn-risk-count mono">
                {res.block_count} 阻断 · {res.warn_count} 警告 · {findings.length} 条命中
              </Text>
            </View>
            {res.rules_metadata ? (
              <Text className="bn-note-text">
                规则集共 {res.rules_metadata.total_rules} 条,覆盖{' '}
                {Object.keys(res.rules_metadata.by_category || {}).length} 个类别
              </Text>
            ) : null}
          </Card>

          {findings.length === 0 ? (
            <Card>
              <EmptyState
                title="没有命中任何规则"
                hint="该配方在当前规则集下未发现明显问题"
              />
            </Card>
          ) : (
            <View>
              <View className="bn-tabs">
                <Segmented
                  value={filter}
                  onChange={(v) => setFilter(v as Filter)}
                  options={[
                    { value: 'all', label: `全部 ${findings.length}` },
                    { value: 'block', label: `阻断 ${res.block_count}` },
                    { value: 'warn', label: `警告 ${res.warn_count}` },
                    { value: 'info', label: '提示' },
                  ]}
                />
              </View>

              {grouped.map((g) => (
                <View key={g.cat}>
                  <SectionTitle
                    title={RISK_CATEGORY_ZH[g.cat] || g.cat}
                    hint={`${g.items.length} 条`}
                  />
                  <Card>
                    {g.items.map((f, i) => (
                      <View className="bn-rule" key={`${f.id || g.cat}-${i}`}>
                        <View className="bn-rule-head">
                          <Badge
                            tone={
                              f.severity === 'block'
                                ? 'block'
                                : f.severity === 'warn'
                                  ? 'warn'
                                  : 'neutral'
                            }
                          >
                            {f.severity === 'block'
                              ? '阻断'
                              : f.severity === 'warn'
                                ? '警告'
                                : '提示'}
                          </Badge>
                          <Text className="bn-rule-id mono">{f.id || ''}</Text>
                        </View>
                        <Text className="bn-rule-text">{findingText(f)}</Text>
                        {f.matched && f.matched.length > 0 ? (
                          <Text className="bn-rule-matched mono">
                            {f.matched.join(' + ')}
                          </Text>
                        ) : null}
                        {f.alternatives && f.alternatives.length > 0 ? (
                          <Text className="bn-rule-matched">
                            替代: {f.alternatives.join('、')}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </Card>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </PageShell>
  )
}
