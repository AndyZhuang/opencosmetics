// app/sitemap.js — /sitemap.xml
//
// 配方引擎 FormulaLab 的站点地图。
// 静态页面 + 原料详情页 (来自 data/ingredient_profiles.json 的 247 条画像)。
//
// 注意: 原料详情路由是 /ingredients/[name], 后端按 INCI 名大小写不敏感匹配,
// 所以这里用画像表里的规范 INCI 名 (如 NIACINAMIDE) 做 URL, 需 encodeURIComponent。
import profiles from "../data/ingredient_profiles.json";

const BASE = "https://opencosmetics.top";

// 静态页面: [路径, 优先级, 更新频率]
const STATIC_PAGES = [
  ["/", 1.0, "daily"],
  ["/bench", 0.9, "weekly"],
  ["/ingredients", 0.9, "weekly"],
  ["/risk", 0.8, "weekly"],
  ["/regulatory", 0.8, "monthly"],
  ["/formula", 0.8, "weekly"],
  ["/formulas", 0.7, "weekly"],
  ["/substitute", 0.7, "monthly"],
  ["/claim", 0.7, "monthly"],
  ["/reference", 0.6, "monthly"],
  ["/scan", 0.6, "weekly"],
  ["/fda", 0.6, "weekly"],
  ["/china", 0.6, "monthly"],
  ["/trends", 0.5, "daily"],
  ["/sources", 0.4, "monthly"],
];

export default function sitemap() {
  const lastModified = new Date(profiles._meta.last_updated + "T00:00:00Z");

  const staticEntries = STATIC_PAGES.map(([path, priority, changeFrequency]) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  // 原料详情页 —— 只有画像表里有的 247 个原料才有完整的用量/价格/角色画像
  const ingredientEntries = profiles.rows.map((row) => ({
    url: `${BASE}/ingredients/${encodeURIComponent(row[0])}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...ingredientEntries];
}
