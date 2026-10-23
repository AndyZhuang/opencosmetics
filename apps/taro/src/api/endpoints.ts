import { request, requestText } from './client'
import type {
  AnalyzeContext,
  ChinaIngredientResponse,
  ClaimResponse,
  CompareResponse,
  CostModel,
  CostResult,
  FormulaLineInput,
  FormulaListResponse,
  FormulaRecord,
  FormulaSummary,
  IngredientItem,
  IngredientSearchResponse,
  RegionCheckResponse,
  ReferenceDetailResponse,
  ReferenceListResponse,
  RiskCheckResponse,
  StatsResponse,
  SubstituteResponse,
  TrendsResponse,
  WorkbenchAnalysis,
} from './types'

// ============================================================================
// 端点封装 —— 页面只调这里, 不直接拼 URL
// ============================================================================

/** POST /workbench/analyze —— 配方全量分析 (结构 + 成本 + 法规 + 风险) */
export function analyzeFormula(params: {
  ingredients?: string
  lines?: FormulaLineInput[]
  context?: AnalyzeContext
  model?: Partial<CostModel>
}): Promise<WorkbenchAnalysis> {
  return request<WorkbenchAnalysis>('/workbench/analyze', {
    method: 'POST',
    data: params,
  })
}

/** GET /ingredients/search —— 成分检索 (服务端已按 精确 > 前缀 > 词中 排序) */
export function searchIngredients(params: {
  q?: string
  limit?: number
  offset?: number
  role?: string
  only?: 'cn' | 'priced' | 'banned'
}): Promise<IngredientSearchResponse> {
  const query: string[] = []
  if (params.q) query.push(`q=${encodeURIComponent(params.q)}`)
  if (params.limit) query.push(`limit=${params.limit}`)
  if (params.offset) query.push(`offset=${params.offset}`)
  if (params.role) query.push(`role=${encodeURIComponent(params.role)}`)
  if (params.only) query.push(`only=${params.only}`)
  const qs = query.length ? `?${query.join('&')}` : ''
  return request<IngredientSearchResponse>(`/ingredients/search${qs}`)
}

/** POST /formula/cost —— 单算成本 */
export function calculateCost(params: {
  lines: FormulaLineInput[]
  model?: Partial<CostModel>
}): Promise<CostResult & { ok: boolean; defaults: CostModel }> {
  return request<CostResult & { ok: boolean; defaults: CostModel }>('/formula/cost', {
    method: 'POST',
    data: params,
  })
}

// ---- 草稿 CRUD (设备维度, x-device-id) ---------------------------------

export function listFormulas(): Promise<FormulaListResponse> {
  return request<FormulaListResponse>('/formulas')
}

export function getFormula(id: string): Promise<{ ok: boolean; formula: FormulaRecord }> {
  return request<{ ok: boolean; formula: FormulaRecord }>(`/formulas/${encodeURIComponent(id)}`)
}

export function saveFormula(payload: {
  id?: string
  name: string
  lines: FormulaLineInput[]
  product_type?: string | null
  region?: string | null
  note?: string
  model?: Partial<CostModel> | null
}): Promise<{ ok: boolean; formula: FormulaRecord }> {
  return request<{ ok: boolean; formula: FormulaRecord }>('/formulas', {
    method: 'POST',
    data: payload,
  })
}

export function updateFormula(
  id: string,
  payload: Partial<{
    name: string
    lines: FormulaLineInput[]
    product_type: string | null
    region: string | null
    note: string
    model: Partial<CostModel> | null
  }>,
): Promise<{ ok: boolean; formula: FormulaRecord }> {
  return request<{ ok: boolean; formula: FormulaRecord }>(`/formulas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    data: payload,
  })
}

export function deleteFormula(id: string): Promise<{ ok: boolean; deleted: boolean }> {
  return request<{ ok: boolean; deleted: boolean }>(`/formulas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

// ---- 对比 ----------------------------------------------------------------

export function compareFormulas(params: {
  a: { lines: FormulaLineInput[] }
  b: { lines: FormulaLineInput[] }
}): Promise<CompareResponse> {
  return request<CompareResponse>('/formula/compare', {
    method: 'POST',
    data: params,
  })
}

// ---- 导出 (返回文件文本) -------------------------------------------------

export type ExportFormat = 'csv' | 'md' | 'html'

export function exportFormula(params: {
  format: ExportFormat
  name: string
  lines: FormulaLineInput[]
  product_type?: string | null
  region?: string | null
  note?: string
  cost?: unknown
}): Promise<string> {
  return requestText('/formula/export', {
    method: 'POST',
    data: params,
    header: { Accept: 'text/plain, */*' },
  })
}

// ---- 其它 ----------------------------------------------------------------

export function checkRisk(params: {
  ingredients: string[]
  context?: Record<string, unknown>
}): Promise<RiskCheckResponse> {
  return request<RiskCheckResponse>('/risk/check', {
    method: 'POST',
    data: { lang: 'zh', ...params },
  })
}

export function findSubstitutes(inci: string, maxResults = 5): Promise<SubstituteResponse> {
  return request<SubstituteResponse>('/substitute', {
    method: 'POST',
    data: { inci, max_results: maxResults, lang: 'zh' },
  })
}

export function suggestFromClaim(params: {
  claim_id?: string
  concerns?: string
  population?: string
  price_tier?: string
}): Promise<ClaimResponse> {
  return request<ClaimResponse>('/claim', {
    method: 'POST',
    data: { lang: 'zh', ...params },
  })
}

export function listReferenceFormulas(q?: string): Promise<ReferenceListResponse> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  return request<ReferenceListResponse>(`/reference${qs}`)
}

export function getReferenceFormula(id: string): Promise<ReferenceDetailResponse> {
  return request<ReferenceDetailResponse>(`/reference?id=${encodeURIComponent(id)}`)
}

export function listTrends(): Promise<TrendsResponse> {
  return request<TrendsResponse>('/trends')
}

export function checkRegions(ingredient: string): Promise<RegionCheckResponse> {
  return request<RegionCheckResponse>(`/regions?ingredient=${encodeURIComponent(ingredient)}`)
}

export function searchChinaIngredient(q: string): Promise<ChinaIngredientResponse> {
  return request<ChinaIngredientResponse>(`/china/ingredient?q=${encodeURIComponent(q)}`)
}

export function getStats(): Promise<StatsResponse> {
  return request<StatsResponse>('/stats')
}

export type { IngredientItem, FormulaSummary }
