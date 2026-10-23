// ============================================================================
// 格式化工具 —— 所有数字统一走这里, 保证等宽字体下的对齐
// ============================================================================

/** 保留 n 位小数, null/NaN → '—' */
export function num(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return v.toFixed(digits)
}

/** 整数 */
export function int(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return String(Math.round(v))
}

/** 金额 (元) */
export function money(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return `¥${v.toFixed(digits)}`
}

/** 百分比 */
export function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  return `${v.toFixed(digits)}%`
}

/** 带符号的差值 */
export function delta(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  const s = v > 0 ? '+' : ''
  return `${s}${v.toFixed(digits)}`
}

/** 用量区间 */
export function range(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—'
  if (min !== null && max !== null) return `${min}–${max}%`
  if (min !== null) return `≥${min}%`
  return `≤${max}%`
}

/** 价格区间 (CNY/kg) */
export function priceRange(lo: number | null, hi: number | null): string {
  if (lo === null && hi === null) return '—'
  if (lo !== null && hi !== null) return `¥${lo}–${hi}/kg`
  if (lo !== null) return `≥¥${lo}/kg`
  return `≤¥${hi}/kg`
}

/** 相对时间 */
export function fromNow(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return '—'
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return new Date(t).toISOString().slice(0, 10)
}

/** 日期 (YYYY-MM-DD) */
export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return '—'
  const t = new Date(iso)
  if (!Number.isFinite(t.getTime())) return '—'
  return t.toISOString().slice(0, 10)
}
