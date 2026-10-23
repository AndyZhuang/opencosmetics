// app/robots.js — /robots.txt
const BASE = "https://opencosmetics.top";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API 与 MCP 接口对爬虫没有意义, 排除掉省带宽
        disallow: ["/api/"],
      },
      // AI 爬虫: 允许抓取公开内容 (站内有 llms.txt 指引)
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot",
          "Bytespider",
          "CCBot",
        ],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
