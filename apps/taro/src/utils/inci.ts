import type { FormulaLineInput } from '../api/types'

// ============================================================================
// INCI 文本处理
// ============================================================================

/** 常见分隔符: 逗号 / 分号 / 顿号 / 换行 / 制表符 */
const SPLIT_RE = /[,;、\n\r\t]+/

/**
 * 把粘贴的 INCI 文本拆成行。
 * "AQUA, GLYCERIN\nNIACINAMIDE" -> [{ inci_name: 'AQUA' }, ...]
 */
export function parseInciText(text: string): FormulaLineInput[] {
  if (!text) return []
  return text
    .split(SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ inci_name: s.toUpperCase() }))
}

/** 是否像是一个 INCI 名 (全大写字母数字与常见符号) */
export function looksLikeInci(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  return /^[A-Z0-9][A-Z0-9\s\-\.\(\)'\/%,]*$/.test(t.toUpperCase())
}

/** 角色中文名 */
export const ROLE_ZH: Record<string, string> = {
  solvent: '溶剂',
  humectant: '保湿',
  emollient: '润肤',
  preservative: '防腐',
  antioxidant: '抗氧',
  active: '活性',
  chelator: '螯合',
  ph_adjuster: 'pH 调节',
  emollient_occlusive: '封闭',
  uv_filter: '紫外线吸收',
  colorant: '着色',
  optical: '光学',
  film_former: '成膜',
  emulsifier: '乳化',
  surfactant: '表活',
  thickener: '增稠',
  conditioner: '调理',
  fragrance: '香精',
  extract: '提取物',
  colorant_preservative: '着色/防腐',
}

/** 相位中文名 */
export const PHASES = ['A相 (水相)', 'B相 (油相)', 'C相 (乳化/分散)']

export function phaseShort(phase: string | null | undefined): string {
  if (!phase) return '—'
  if (phase.indexOf('A相') === 0) return 'A相'
  if (phase.indexOf('B相') === 0) return 'B相'
  if (phase.indexOf('C相') === 0) return 'C相'
  return phase
}

export function roleZh(role: string | null | undefined): string {
  if (!role) return '—'
  return ROLE_ZH[role] || role
}

/** EU 状态中文 */
export function euStatusZh(status: string | null | undefined): string {
  switch (status) {
    case 'allowed':
      return '欧盟允许'
    case 'restricted':
      return '欧盟限用'
    case 'banned':
      return '欧盟禁用'
    default:
      return '状态未知'
  }
}

/** 中国 IECIC 状态中文 */
export function cnStatusZh(status: string | null | undefined): string {
  switch (status) {
    case 'iecic_i_included':
      return 'IECIC I 已使用'
    case 'iecic_ii_included':
      return 'IECIC II 新原料'
    case 'not_in_iecic':
      return '未收录 IECIC'
    default:
      return '状态未知'
  }
}

/** 风险分类中文 */
export const RISK_CATEGORY_ZH: Record<string, string> = {
  compatibility: '配伍禁忌',
  ph_safety: 'pH 安全',
  concentration: '浓度上限',
  special_population: '特殊人群',
  regulatory: '法规限制',
  synbio: '合成生物标注',
  fda_event: 'FDA 事件',
}
