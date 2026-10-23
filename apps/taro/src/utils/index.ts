// ============================================================================
// 通用小工具
// ============================================================================

/** 防抖 —— 用于「停止输入 600ms 后触发分析」 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  const wrapped = (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  return wrapped
}

/** 把 Promise 包装成「可取消」的竞态守卫 */
export function createRequestGuard() {
  let seq = 0
  return {
    next(): number {
      seq += 1
      return seq
    },
    isLatest(token: number): boolean {
      return token === seq
    },
  }
}

/** 深拷贝 (仅纯 JSON 结构) */
export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

/** 数组移动 */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice()
  if (from < 0 || from >= next.length) return next
  const target = Math.max(0, Math.min(next.length - 1, to))
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item)
  return next
}
