import Taro from '@tarojs/taro'

// ============================================================================
// API 客户端 —— 全 App 唯一的网络出口
// ----------------------------------------------------------------------------
// baseURL 优先级: 运行时覆盖 (Taro storage) > 构建期环境变量 > 下面的常量。
// 构建期环境变量来自项目根目录 .env 的 TARO_APP_API_BASE,
// 由 Taro 的 DefinePlugin 在编译时替换 process.env.TARO_APP_API_BASE。
// ============================================================================

/** 默认 API 根地址 —— 生产环境 */
export const DEFAULT_API_BASE = 'https://opencosmetics.top/api'

/** 本地开发地址 (上游 Next.js dev server, 3010 端口) */
export const LOCAL_API_BASE = 'http://localhost:3010/api'

const STORAGE_KEY_API_BASE = 'formulalab.apiBase'

function readEnvBaseUrl(): string {
  try {
    // 编译期: DefinePlugin 会把 process.env.TARO_APP_API_BASE 替换成字符串字面量
    // 运行期: 浏览器 / RN 里可能没有 process, 走 catch 兜底
    // @ts-ignore
    const v = process.env.TARO_APP_API_BASE
    return typeof v === 'string' ? v : ''
  } catch (e) {
    return ''
  }
}

function normalizeBase(v: string): string {
  const s = String(v || '').trim().replace(/\/+$/, '')
  return s || DEFAULT_API_BASE
}

let apiBase = normalizeBase(readEnvBaseUrl() || DEFAULT_API_BASE)
let deviceId = ''

/** 当前生效的 baseURL */
export function getApiBase(): string {
  return apiBase
}

/** 运行时覆盖 baseURL (真机联调时把 localhost 换成公网地址) */
export function setApiBase(v: string): string {
  apiBase = normalizeBase(v)
  try {
    Taro.setStorageSync(STORAGE_KEY_API_BASE, apiBase)
  } catch (e) {
    /* 存储失败不阻断 */
  }
  return apiBase
}

/** 读取持久化的 baseURL 覆盖值 */
export function loadPersistedApiBase(): string {
  try {
    const v = Taro.getStorageSync(STORAGE_KEY_API_BASE)
    if (typeof v === 'string' && v.trim()) {
      apiBase = normalizeBase(v)
    }
  } catch (e) {
    /* 存储不可用则忽略 */
  }
  return apiBase
}

/** 设备标识 —— 草稿按设备维度隔离, 通过 x-device-id header 传递 */
export function setDeviceId(id: string): void {
  deviceId = id
}

export function getDeviceId(): string {
  return deviceId
}

export class ApiError extends Error {
  readonly status: number
  readonly url: string

  constructor(message: string, status: number, url: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: unknown
  header?: Record<string, string>
  timeout?: number
}

function extractErrorMessage(data: unknown): string {
  if (!data) return ''
  if (typeof data === 'string') return data.slice(0, 200)
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const keys = ['error', 'message', 'message_zh', 'usage_zh']
    for (const k of keys) {
      const v = obj[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
  }
  return ''
}

/** 拼完整 URL —— 唯一允许拼接 baseURL 的地方 */
export function buildUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase}${p}`
}

function buildHeader(extra?: Record<string, string>): Record<string, string> {
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (deviceId) header['x-device-id'] = deviceId
  if (extra) Object.assign(header, extra)
  return header
}

async function send(path: string, options: RequestOptions) {
  const url = buildUrl(path)
  const method = options.method || 'GET'
  const header = buildHeader(options.header)

  let res: Taro.request.SuccessCallbackResult
  try {
    res = await Taro.request({
      url,
      method,
      data: options.data as Taro.request.Option['data'],
      header,
      timeout: options.timeout || 20000,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new ApiError(`网络请求失败: ${msg}`, 0, url)
  }

  const status = res.statusCode
  if (status < 200 || status >= 300) {
    const detail = extractErrorMessage(res.data)
    throw new ApiError(detail || `请求失败 (HTTP ${status})`, status, url)
  }
  return res
}

/** JSON 请求 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options)
  return res.data as T
}

/** 文本请求 (导出接口返回 text/csv | text/markdown | text/html) */
export async function requestText(path: string, options: RequestOptions = {}): Promise<string> {
  const res = await send(path, options)
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
}
