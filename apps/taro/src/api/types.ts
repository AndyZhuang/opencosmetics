// ============================================================================
// 上游 API 数据结构 (opencosmetics.top/api)
// 字段与后端 lib/ + app/api/ 的实际返回保持一致, 只声明本 App 真正用到的字段。
// ============================================================================

export type RegionCode = 'CN' | 'EU' | 'US' | 'KR' | 'JP' | 'ASEAN'
export type Population = 'adult' | 'sensitive' | 'pregnant' | 'child'
export type RiskSummary = 'PASS' | 'REVIEW' | 'REJECT'
export type Severity = 'block' | 'warn' | 'info'
export type SuggestionType = 'critical' | 'warning' | 'info' | 'good'

/** 成本模型 —— 可在构建器里调整 */
export interface CostModel {
  batch_kg: number
  net_content_g: number
  gross_margin: number
  distributor_markup: number
  oem_markup: number
  packaging_per_unit: number
  processing_per_kg: number
  loss_rate: number
}

export interface AnalyzeContext {
  population?: Population
  region?: RegionCode
}

/** 构建器里的一行成分 */
export interface FormulaLineInput {
  inci_name: string
  pct?: number
  phase?: string
}

/** /workbench/analyze 里的 rows[].lines[] */
export interface AnalyzedLine {
  index: number
  inci_name: string
  chinese_name: string | null
  role: string
  role_is_estimated: boolean
  pct: number | null
  use_min: number | null
  use_max: number | null
  phase: string
  phase_is_estimated: boolean
  price_lo: number | null
  price_hi: number | null
  eu_status: 'allowed' | 'restricted' | 'banned' | 'unknown'
  cn_status: 'iecic_i_included' | 'iecic_ii_included' | 'not_in_iecic' | 'unknown'
  function: string | null
  function_translated: string | null
  is_banned_eu: boolean
  is_restricted_eu: boolean
  is_in_iecic: boolean
  tags: string[]
}

export interface ActiveTop3 {
  category: string
  category_name_zh: string
  ingredient: string
  position: number
}

export interface FormulaSuggestion {
  type: SuggestionType
  severity: 'block' | 'warn' | 'info'
  message_zh: string
  message_en: string
}

export interface FormulaProfile {
  type: string[]
  type_zh: string
  type_en: string
  actives: {
    total_count: number
    top3: ActiveTop3[]
    categories: string[]
  }
  vehicle: {
    primary: string
    humectants: string[]
    emollients: string[]
    preservatives: string[]
  }
  target_demographic: {
    primary: string
    concern: string
    region: string
  }
  price_tier: {
    tier: string
    tier_zh: string
    price_range_cny: string
    score: number
  }
  suggestions: FormulaSuggestion[]
  stats: {
    total_ingredients: number
    recognized_in_cosng: number
    recognized_in_iecic: number
    eu_banned: number
    eu_restricted: number
    risk_blocks: number
    risk_warns: number
  }
}

export interface ScaffoldEntry {
  inci_name: string
  chinese_name: string | null
  role: string
  pct: number
}

export interface CostLine {
  inci_name: string
  chinese_name: string | null
  role: string
  pct: number
  price_cny_per_kg: number | null
  price_low: number | null
  price_high: number | null
  price_source: 'profile' | 'role_estimate'
  cost_per_kg: number | null
  cost_share: number | null
  cost_impact_10pct: number | null
  impact_pct_of_total: number | null
}

export interface CostTotals {
  raw_material_per_kg: number | null
  processing_per_kg: number | null
  total_per_kg: number | null
  batch_kg: number | null
  batch_cost: number | null
  units_per_batch: number | null
  net_content_g: number | null
  cost_per_unit_raw: number | null
  packaging_per_unit: number | null
  cost_per_unit: number | null
}

export interface CostRetail {
  gross_margin: number
  distributor_markup: number
  oem_markup: number
  ex_factory_price: number | null
  suggested_price: number | null
  suggested_price_method: string
  price_range_low: number | null
  price_range_high: number | null
  note_zh: string
}

export interface CostQuality {
  priced_count: number
  unknown_count: number
  coverage_pct: number
  total_pct_declared: number
  balanced: boolean
  note_zh: string
  note_en: string
}

export interface CostDriver {
  inci_name: string
  chinese_name: string | null
  pct: number
  price_cny_per_kg: number | null
  cost_per_kg: number | null
  cost_share: number | null
}

export interface CostResult {
  lines: CostLine[]
  totals: CostTotals
  retail: CostRetail
  quality: CostQuality
  top_drivers: CostDriver[]
  estimated_from_typical_levels: boolean
  model: CostModel
}

export interface RiskFinding {
  severity: Severity
  category: string
  rule_id: string
  rationale: string
  matched: string[]
}

export interface WorkbenchAnalysis {
  ok: boolean
  lang: string
  formula: FormulaProfile
  lines: AnalyzedLine[]
  structure: {
    role_breakdown: Record<string, number>
    phase_breakdown: Record<string, number>
    total_pct_declared: number
    scaffold: ScaffoldEntry[] | null
  }
  cost: CostResult
  regulatory: {
    eu_banned: { inci_name: string; chinese_name: string | null }[]
    eu_restricted: { inci_name: string; chinese_name: string | null }[]
    cn_not_in_iecic: { inci_name: string; chinese_name: string | null }[]
    cn_not_in_iecic_count: number
  }
  risk: {
    summary: RiskSummary
    block_count: number
    warn_count: number
    top_findings: RiskFinding[]
  }
  timestamp: string
}

// ---- 成分检索 -----------------------------------------------------------

export interface IngredientItem {
  inci_name: string
  chinese_name: string | null
  function: string | null
  cas_no: string | null
  ec_no: string | null
  inn_name: string | null
  restriction: string | null
  role: string
  role_is_estimated: boolean
  use_min: number | null
  use_max: number | null
  price_lo: number | null
  price_hi: number | null
  cn_status: string
  eu_status: string
  sources: string[]
}

export interface IngredientSearchResponse {
  ok: boolean
  query: string
  total: number
  total_in_db: number
  total_all_sources: number
  offset: number
  limit: number
  items: IngredientItem[]
}

// ---- 草稿 CRUD ----------------------------------------------------------

export interface FormulaSummary {
  id: string
  name: string
  product_type: string | null
  region: string | null
  note: string
  ingredient_count: number
  total_pct: number
  created_at: string
  updated_at: string
  version: number
}

export interface FormulaRecord extends FormulaSummary {
  lines: (FormulaLineInput & { chinese_name?: string | null; role?: string })[]
  model?: CostModel | null
  target?: string | null
}

export interface FormulaListResponse {
  ok: boolean
  formulas: FormulaSummary[]
}

// ---- 对比 ---------------------------------------------------------------

export interface FormulaDiff {
  inci_name: string
  chinese_name: string | null
  a_pct: number | null
  b_pct: number | null
  delta_pct: number
  status: 'added' | 'removed' | 'changed'
}

export interface CompareResponse {
  ok: boolean
  diffs: FormulaDiff[]
  added: number
  removed: number
  changed: number
  cost: {
    a: CostTotals
    b: CostTotals
    delta_per_kg: number | null
    delta_pct: number | null
  }
}

// ---- 风险审查 (/risk/check) ---------------------------------------------

export interface RiskCheckFinding {
  category: string
  id?: string
  severity?: Severity
  ingredient?: string
  matched?: string[]
  rationale?: string
  alternatives?: string[]
  context?: string
  region?: string
  status?: string
  note?: string
  label_requirement?: string
  source?: string
  max_pct?: number
  leave_on_max_pct?: number
  rinse_off_max_pct?: number
  event_count_2024?: number
  ingredients?: string[]
  [key: string]: unknown
}

export interface RiskCheckResponse {
  ingredients: string[]
  context: Record<string, unknown>
  summary: RiskSummary
  block_count: number
  warn_count: number
  findings: RiskCheckFinding[]
  rules_metadata: {
    total_rules: number
    block_severity: number
    warn_severity: number
    info_severity: number
    by_category: Record<string, number>
  } | null
  unknown_ingredients: string[]
  timestamp: string
  lang: string
}

// ---- 成分替代 -----------------------------------------------------------

export interface SubstituteSuggestion {
  inci_name: string
  tier: string
  price_index: number
  notes_zh: string
  notes_en: string
  regulatory: {
    cn_iecic: string | null
    eu_banned: boolean
    eu_restricted: boolean
  }
  concentration: { max_pct?: number; note?: string } | null
}

export interface SubstituteResponse {
  query: string
  found: boolean
  group: string
  group_en: string
  group_function: string
  candidates_count: number
  suggestions: SubstituteSuggestion[]
  message_zh?: string
}

// ---- 目标反推 -----------------------------------------------------------

export interface ClaimActive {
  inci: string
  pct: string
  role_zh: string
  role_en: string
}

export interface ClaimResponse {
  found: boolean
  claim: {
    id: string
    name?: string
    name_en: string
    icon: string
    target_demo: string
  }
  actives: ClaimActive[]
  avoid: string[]
  vehicle: string
  notes: string
  price_tiers_available: { tier: string; label: string }[]
  message_zh?: string
  available_claims?: {
    id: string
    name?: string
    name_en: string
    icon: string
    target_demo?: string
    actives_count?: number
  }[]
}

// ---- 参考配方 -----------------------------------------------------------

export interface ReferenceFormula {
  id: string
  name_zh: string
  name_en: string
  brand: string
  year: string
  category: string
  category_en: string
  tag: string
  price_tier: string
  actives_count: number
  notes?: string
  /** 详情接口补充 */
  inci?: string
  key_actives?: string[]
  vehicle?: string
  target_demo?: string
  notes_zh?: string
  notes_en?: string
}

export interface ReferenceListResponse {
  count: number
  formulas: ReferenceFormula[]
  categories: string[]
  price_tiers: string[]
  brands: string[]
}

export interface ReferenceDetailResponse {
  formula: ReferenceFormula
  lang: string
}

// ---- 行业趋势 -----------------------------------------------------------

export interface TrendEntry {
  id: string
  title_zh: string
  title_en: string
  category: string
  active_ingredients: { inci: string; growth: string; note_zh: string }[]
  region_focus: string[]
  source_signals: string[]
  summary_zh: string
  summary_en: string
}

export interface TrendsResponse {
  count: number
  trends: TrendEntry[]
}

// ---- 法规地图 (/regions) ------------------------------------------------

export interface RegionStatus {
  status: string
  max_pct?: number
  notes?: string
}

export interface RegionCheckResponse {
  ingredient: string
  regions: Record<string, RegionStatus>
  concentration?: {
    leave_on_max_pct?: number
    rinse_off_max_pct?: number
    max_pct?: number
    source?: string
    note?: string
  }
  cn_iecic?: { status: string; seq?: number; chinese_name?: string; inci_name?: string }
  eu_cosing?: { status: string; inci_name?: string; function?: string }
  eu_annex_ii?: { status: string; ref?: string }
  lang: string
}

// ---- 中国 IECIC ---------------------------------------------------------

export interface IecicRow {
  source: 'IECIC-I' | 'IECIC-II'
  seq: number | string
  chinese_name: string
  inci_name: string
  note: string | null
}

export interface ChinaIngredientResponse {
  query: string
  total: number
  iecic_i: IecicRow[]
  iecic_ii: IecicRow[]
  source_meta: Record<string, string>
  lang: string
}

// ---- 全站统计 -----------------------------------------------------------

export interface StatsResponse {
  duckdb: Record<string, number | null>
  total_records: number
  by_region: Record<string, number>
  supplementary: Record<string, number>
  sources: { name: string; n: number | null; type: string }[]
  timestamp: string
}
