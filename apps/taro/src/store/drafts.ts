import Taro from '@tarojs/taro'
import type { FormulaLineInput } from '../api/types'

// ============================================================================
// 本地草稿 —— 构建器内容自动存本地, 避免误退丢失
// ============================================================================

const KEY_DRAFT = 'formulalab.localDraft'

export interface LocalDraft {
  name: string
  lines: FormulaLineInput[]
  product_type: string
  region: string
  note: string
  updated_at: string
}

export function saveLocalDraft(draft: Omit<LocalDraft, 'updated_at'>): void {
  try {
    Taro.setStorageSync(
      KEY_DRAFT,
      JSON.stringify({ ...draft, updated_at: new Date().toISOString() }),
    )
  } catch (e) {
    /* 存储失败不阻断编辑 */
  }
}

export function loadLocalDraft(): LocalDraft | null {
  try {
    const raw = Taro.getStorageSync(KEY_DRAFT)
    if (!raw) return null
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || !Array.isArray(parsed.lines)) return null
    return parsed as LocalDraft
  } catch (e) {
    return null
  }
}

export function clearLocalDraft(): void {
  try {
    Taro.removeStorageSync(KEY_DRAFT)
  } catch (e) {
    /* ignore */
  }
}
