import type { UserConfigExport } from '@tarojs/cli'

/** 开发环境配置 */
const config: UserConfigExport<'webpack5'> = {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {},
}

export default config
