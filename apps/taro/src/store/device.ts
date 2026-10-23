import Taro from '@tarojs/taro'

// ============================================================================
// 设备标识 —— 草稿在服务端按 x-device-id 分设备存储
// ============================================================================

const KEY_DEVICE_ID = 'formulalab.deviceId'

function randomHex(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += Math.floor(Math.random() * 16).toString(16)
  }
  return out
}

/** 读取本机 device id, 首次启动生成一个并持久化 */
export function ensureDeviceId(): string {
  try {
    const existing = Taro.getStorageSync(KEY_DEVICE_ID)
    if (typeof existing === 'string' && existing.trim()) return existing
  } catch (e) {
    /* 存储不可用时退化为会话级 id */
  }
  const id = `dev_${Date.now().toString(36)}${randomHex(8)}`
  try {
    Taro.setStorageSync(KEY_DEVICE_ID, id)
  } catch (e) {
    /* ignore */
  }
  return id
}
