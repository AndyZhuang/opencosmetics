/** @type {import('next').NextConfig} */
module.exports = {
  serverExternalPackages: ["@duckdb/node-api", "duckdb"],

  // -------------------------------------------------------------------------
  // API 的 CORS
  // -------------------------------------------------------------------------
  // 为什么需要: 移动端三端里, **H5 版跑在浏览器里**, 而它调的是
  // https://opencosmetics.top/api —— 跨域。
  // 客户端会带两个非简单头 (Content-Type: application/json 与 x-device-id),
  // 浏览器必然先发 OPTIONS 预检, 预检不过就直接把响应拦掉。
  //
  // 为什么用 '*': 这套 API 是公开的化妆品法规 / 成本 / 成分画像数据,
  // 只读语义; /api/formulas 的草稿按设备 UUID 隔离 (x-device-id),
  // UUID 不可猜, 所以开放跨域不构成越权风险。
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, x-device-id' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};
