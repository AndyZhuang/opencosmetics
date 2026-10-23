import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Textarea } from '@tarojs/components'

import { PageShell } from '../../components/PageShell'
import {
  Badge,
  BarRow,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  HScroll,
  KeyValue,
  Mono,
  SectionTitle,
  Segmented,
  Skeleton,
  Stat,
} from '../../components/ui'
import { analyzeFormula, saveFormula } from '../../api/endpoints'
import type {
  FormulaLineInput,
  RegionCode,
  WorkbenchAnalysis,
} from '../../api/types'
import { money, num, pct } from '../../utils/format'
import { RISK_CATEGORY_ZH, roleZh } from '../../utils/inci'
import { debounce } from '../../utils'
import './index.scss'

const REGIONS: { value: RegionCode; label: string }[] = [
  { value: 'CN', label: '中国' },
  { value: 'EU', label: '欧盟' },
  { value: 'US', label: '美国' },
  { value: 'KR', label: '韩国' },
  { value: 'JP', label: '日本' },
  { value: 'ASEAN', label: '东盟' },
]

const PHASE_OPTIONS = ['A相 (水相)', 'B相 (油相)', 'C相 (乳化/分散)']

interface Row extends FormulaLineInput {
  key: string
}

let rowSeq = 0
function newRow(inci_name = '', pctValue = ''): Row {
  rowSeq += 1
  return {
    key: `r${rowSeq}`,
    inci_name,
    pct: pctValue === '' ? undefined : Number(pctValue),
    phase: 'A相 (水相)',
  }
}

type TabKey = 'formula' | 'analysis' | 'cost' | 'rules'

export default function BenchPage() {
  const [rows, setRows] = useState<Row[]>([newRow(), newRow(), newRow()])
  const [name, setName] = useState('')
  const [productType, setProductType] = useState('')
  const [region, setRegion] = useState<RegionCode>('CN')
  const [tab, setTab] = useState<TabKey>('formula')

  const [analysis, setAnalysis] = useState<WorkbenchAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')

  const seq = useRef(0)

  const validRows = useMemo(
    () => rows.filter((r) => r.inci_name.trim().length > 0),
    [rows],
  )
  const totalPct = useMemo(
    () => rows.reduce((s, r) => s + (typeof r.pct === 'number' ? r.pct : 0), 0),
    [rows],
  )

  const run = useMemo(
    () =>
      debounce((payload: Row[], reg: RegionCode) => {
        const list = payload
          .filter((r) => r.inci_name.trim())
          .map((r) => ({
            inci_name: r.inci_name.trim().toUpperCase(),
            pct: typeof r.pct === 'number' ? r.pct : 0,
            phase: r.phase,
          }))
        if (!list.length) {
          setAnalysis(null)
          setLoading(false)
          return
        }
        const token = ++seq.current
        setLoading(true)
        setErr('')
        analyzeFormula({ lines: list, context: { region: reg } })
          .then((res) => {
            if (token === seq.current) setAnalysis(res)
          })
          .catch((e) => {
            if (token === seq.current) {
              setErr(e instanceof Error ? e.message : String(e))
              setAnalysis(null)
            }
          })
          .finally(() => {
            if (token === seq.current) setLoading(false)
          })
      }, 600),
    [],
  )

  useEffect(() => {
    run(rows, region)
  }, [rows, region, run])

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev))
  }

  function sortByPct() {
    setRows((prev) =>
      [...prev].sort((a, b) => (b.pct || 0) - (a.pct || 0)),
    )
  }

  function applyScaffold() {
    const sc = analysis?.structure?.scaffold
    if (!sc || !sc.length) return
    setRows((prev) =>
      prev.map((r) => {
        const key = r.inci_name.trim().toUpperCase()
        const hit = sc.find((s) => s.inci_name === key)
        return hit ? { ...r, pct: hit.pct } : r
      }),
    )
    showToast('已按典型用量补齐')
  }

  function doImport() {
    const items = importText
      .split(/[,;\n\r\t。]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!items.length) return
    setRows(items.map((n) => newRow(n)))
    setImportText('')
    setImporting(false)
    showToast(`已导入 ${items.length} 个成分`)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  async function save() {
    if (!validRows.length) {
      showToast('没有可保存的成分')
      return
    }
    try {
      const res = await saveFormula({
        name: name.trim() || '未命名配方',
        product_type: productType.trim(),
        region,
        lines: validRows.map((r) => ({
          inci_name: r.inci_name.trim().toUpperCase(),
          pct: typeof r.pct === 'number' ? r.pct : 0,
          phase: r.phase,
        })),
      })
      showToast(`已保存 v${res.formula.version}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存失败')
    }
  }

  const risk = analysis?.risk
  const cost = analysis?.cost
  const riskTone = risk
    ? risk.summary === 'PASS'
      ? 'ok'
      : risk.summary === 'REVIEW'
        ? 'warn'
        : 'block'
    : 'neutral'

  return (
    <PageShell title="配方构建器" subtitle="边建边算 · 成本 / 法规 / 风险" tab>
      {/* 配方头 */}
      <Card>
        <Field
          label="配方名称"
          value={name}
          onInput={setName}
          placeholder="如 烟酰胺修护精华 v1"
        />
        <View className="bn-grid-2">
          <Field
            label="品类"
            value={productType}
            onInput={setProductType}
            placeholder="精华液"
          />
          <Field
            label="实测 pH"
            value=""
            onInput={() => {}}
            placeholder="选填"
            type="digit"
          />
        </View>
        <View className="bn-block">
          <Text className="bn-label">目标市场</Text>
          <HScroll>
            {REGIONS.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                active={region === r.value}
                onClick={() => setRegion(r.value)}
              />
            ))}
          </HScroll>
        </View>
      </Card>

      {/* 分段切换 */}
      <View className="bn-tabs">
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as TabKey)}
          options={[
            { value: 'formula', label: '配方' },
            { value: 'analysis', label: '结论' },
            { value: 'cost', label: '成本' },
            { value: 'rules', label: '规则' },
          ]}
        />
      </View>

      {/* ---------- 配方 ---------- */}
      {tab === 'formula' && (
        <View>
          <SectionTitle
            title="成分行"
            hint={`${validRows.length} 成分 · 合计 ${totalPct.toFixed(1)}%`}
          />
          {rows.map((r, i) => (
            <View className="bn-row" key={r.key}>
              <View className="bn-row-head">
                <Text className="bn-row-idx mono">{String(i + 1).padStart(2, '0')}</Text>
                <Text className="bn-row-name mono">{r.inci_name || '未命名'}</Text>
                {r.pct !== undefined ? (
                  <Text className="bn-row-pct mono">{r.pct}%</Text>
                ) : null}
                <View className="bn-row-del" onClick={() => removeRow(r.key)}>
                  <Text className="mono">×</Text>
                </View>
              </View>
              <View className="bn-row-inputs">
                <Input
                  className="bn-input mono"
                  value={r.inci_name}
                  placeholder="INCI 名称"
                  placeholderClass="bn-placeholder"
                  onInput={(e) => updateRow(r.key, { inci_name: e.detail.value })}
                />
                <Input
                  className="bn-input bn-input-pct mono"
                  type="digit"
                  value={r.pct === undefined ? '' : String(r.pct)}
                  placeholder="%"
                  placeholderClass="bn-placeholder"
                  onInput={(e) =>
                    updateRow(r.key, {
                      pct: e.detail.value === '' ? undefined : Number(e.detail.value),
                    })
                  }
                />
              </View>
              <HScroll>
                {PHASE_OPTIONS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={r.phase === p}
                    onClick={() => updateRow(r.key, { phase: p })}
                  />
                ))}
              </HScroll>
            </View>
          ))}

          <View className="bn-actions">
            <Button size="sm" onClick={() => setRows((p) => [...p, newRow()])}>
              + 加一行
            </Button>
            <Button size="sm" variant="ghost" onClick={sortByPct}>
              按用量排序
            </Button>
            {analysis?.structure?.scaffold?.length ? (
              <Button size="sm" variant="ghost" onClick={applyScaffold}>
                补齐典型用量
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setImporting((v) => !v)}
            >
              批量导入
            </Button>
          </View>

          {importing && (
            <Card>
              <View className="bn-block">
                <Text className="bn-label">粘贴 INCI 列表 (逗号或换行分隔)</Text>
                <Textarea
                  className="bn-textarea mono"
                  value={importText}
                  placeholder="AQUA, GLYCERIN, NIACINAMIDE, ..."
                  placeholderClass="bn-placeholder"
                  onInput={(e) => setImportText(e.detail.value)}
                />
              </View>
              <View className="bn-actions">
                <Button size="sm" onClick={doImport}>
                  导入为配方行
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setImportText('')}>
                  清空
                </Button>
              </View>
            </Card>
          )}

          <View className="bn-actions bn-actions-sticky">
            <Button onClick={save}>保存草稿</Button>
          </View>
        </View>
      )}

      {/* ---------- 结论 ---------- */}
      {tab === 'analysis' && (
        <View>
          {err ? <ErrorState message={err} /> : null}
          {loading && !analysis ? <Skeleton rows={4} /> : null}
          {!analysis && !loading && !err ? (
            <EmptyState title="还没有分析结果" hint="在「配方」页填入 INCI 后自动计算" />
          ) : null}
          {analysis && (
            <View>
              <Card>
                <View className="bn-risk-head">
                  <Badge tone={riskTone} solid>
                    {risk?.summary === 'PASS'
                      ? '风险 通过'
                      : risk?.summary === 'REVIEW'
                        ? '风险 需复核'
                        : '风险 阻断'}
                  </Badge>
                  <Text className="bn-risk-count mono">
                    {risk?.block_count || 0} 阻断 · {risk?.warn_count || 0} 警告
                  </Text>
                </View>
                <KeyValue label="配方类型" value={analysis.formula.type_zh} />
                <KeyValue
                  label="活性分类"
                  value={`${analysis.formula.actives.categories.length} 类`}
                />
                <KeyValue
                  label="目标人群"
                  value={analysis.formula.target_demographic?.primary || '—'}
                />
                <KeyValue
                  label="价位带"
                  value={`${analysis.formula.price_tier?.tier_zh} · ${analysis.formula.price_tier?.price_range_cny}`}
                />
                <KeyValue
                  label="未入 IECIC"
                  value={`${analysis.regulatory.cn_not_in_iecic_count} 个`}
                />
              </Card>

              <SectionTitle title="角色分布" />
              <Card>
                {Object.keys(analysis.structure.role_breakdown).length === 0 ? (
                  <EmptyState title="暂无" />
                ) : (
                  Object.keys(analysis.structure.role_breakdown).map((role) => (
                    <View className="bn-role-row" key={role}>
                      <Text className="bn-role-name">{roleZh(role)}</Text>
                      <Badge tone="accent">{role}</Badge>
                      <Text className="bn-role-count mono">
                        {analysis.structure.role_breakdown[role]}
                      </Text>
                    </View>
                  ))
                )}
              </Card>

              {analysis.regulatory.eu_banned.length > 0 && (
                <>
                  <SectionTitle title="EU 禁用" />
                  <Card>
                    {analysis.regulatory.eu_banned.map((b) => (
                      <View className="bn-alert" key={b.inci_name}>
                        <Badge tone="block">禁用</Badge>
                        <Text className="mono bn-alert-name">{b.inci_name}</Text>
                        {b.chinese_name ? (
                          <Text className="bn-alert-cn">{b.chinese_name}</Text>
                        ) : null}
                      </View>
                    ))}
                  </Card>
                </>
              )}
            </View>
          )}
        </View>
      )}

      {/* ---------- 成本 ---------- */}
      {tab === 'cost' && (
        <View>
          {!cost ? (
            <EmptyState title="还没有成本结果" hint="在「配方」页填入用量后计算" />
          ) : (
            <View>
              <Card>
                <Stat
                  label="单公斤成本"
                  value={num(cost.totals.total_per_kg)}
                  unit="CNY/kg"
                  tone="accent"
                />
                <View className="bn-stat-row">
                  <Stat
                    label={`单支 (${cost.totals.net_content_g}g)`}
                    value={money(cost.totals.cost_per_unit)}
                  />
                  <Stat label="出厂价" value={money(cost.retail.ex_factory_price)} />
                </View>
                <View className="bn-stat-row">
                  <Stat
                    label="建议零售价"
                    value={money(cost.retail.suggested_price)}
                    tone="accent"
                  />
                  <Stat
                    label={`批次 (${cost.totals.batch_kg}kg)`}
                    value={money(cost.totals.batch_cost, 0)}
                  />
                </View>
              </Card>

              <SectionTitle
                title="成本构成"
                hint={`价格覆盖 ${cost.quality.coverage_pct}%`}
              />
              <Card>
                {cost.top_drivers.length === 0 ? (
                  <EmptyState title="暂无成本数据" />
                ) : (
                  cost.top_drivers.map((d) => (
                    <BarRow
                      key={d.inci_name}
                      label={d.inci_name}
                      sub={d.chinese_name || undefined}
                      value={d.cost_share || 0}
                      max={100}
                      display={pct(d.cost_share)}
                    />
                  ))
                )}
              </Card>

              {cost.quality.unknown_count > 0 && (
                <Card>
                  <View className="bn-note">
                    <Text className="bn-note-text">
                      {cost.quality.note_zh}
                    </Text>
                  </View>
                </Card>
              )}
            </View>
          )}
        </View>
      )}

      {/* ---------- 规则 ---------- */}
      {tab === 'rules' && (
        <View>
          {!analysis ? (
            <EmptyState title="还没有规则结果" hint="在「配方」页填入 INCI 后自动扫描" />
          ) : (
            <View>
              <SectionTitle
                title="规则命中"
                hint={`${risk?.block_count || 0} 阻断 · ${risk?.warn_count || 0} 警告`}
              />
              {(risk?.top_findings || []).length === 0 ? (
                <Card>
                  <EmptyState title="没有命中任何规则" hint="该配方在当前规则集下未发现明显问题" />
                </Card>
              ) : (
                <Card>
                  {(risk?.top_findings || []).map((f, i) => (
                    <View className="bn-rule" key={`${f.rule_id}-${i}`}>
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
                        <Text className="bn-rule-id mono">{f.rule_id}</Text>
                        <Text className="bn-rule-cat">
                          {RISK_CATEGORY_ZH[f.category] || f.category}
                        </Text>
                      </View>
                      <Text className="bn-rule-text">{f.rationale}</Text>
                      {f.matched && f.matched.length > 0 ? (
                        <Text className="bn-rule-matched mono">
                          {f.matched.join(' + ')}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </Card>
              )}

              {analysis.formula.suggestions.length > 0 && (
                <>
                  <SectionTitle title="配方建议" />
                  <Card>
                    {analysis.formula.suggestions.map((s, i) => (
                      <View className="bn-note" key={i}>
                        <Text className="bn-note-text">{s.message_zh}</Text>
                      </View>
                    ))}
                  </Card>
                </>
              )}
            </View>
          )}
        </View>
      )}

      {toast ? (
        <View className="bn-toast">
          <Text className="bn-toast-text">{toast}</Text>
        </View>
      ) : null}
    </PageShell>
  )
}
