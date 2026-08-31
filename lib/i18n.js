// i18n.js — Bilingual UI strings for open-cosmetics
// 3 modes: 'zh' (中文 only) | 'en' (English only) | 'both' (中+EN, default)

export const LANGUAGES = ["both", "zh", "en"];

export const LANG_LABELS = {
  both: { icon: "🌐", zh: "中+EN", en: "ZH+EN", short: "🌐" },
  zh:   { icon: "🇨🇳", zh: "中文",   en: "中文",   short: "中" },
  en:   { icon: "🇺🇸", zh: "EN",    en: "EN",    short: "EN" },
};

export const DICT = {
  // ───── Navigation ─────
  "nav.home":          { zh: "首页",                en: "Home" },
  "nav.ingredients":   { zh: "成分库 (50K)",         en: "Ingredients (50K)" },
  "nav.regulatory":    { zh: "EU 监管 (1,927)",      en: "EU Reg (1,927)" },
  "nav.fda":           { zh: "FDA (85K)",            en: "FDA (85K)" },
  "nav.china":         { zh: "🇨🇳 中国 (8.9K)",     en: "🇨🇳 China (8.9K)" },
  "nav.synbio":        { zh: "🧬 合成生物",         en: "🧬 Synbio" },
  "nav.risk":          { zh: "⚖️ 风险审查",         en: "⚖️ Risk Check" },
  "nav.mcp":           { zh: "🤖 MCP",              en: "🤖 MCP" },
  "nav.sources":       { zh: "数据源",               en: "Sources" },

  // ───── Site metadata ─────
  "site.title":        { zh: "Open Cosmetics — 开放美妆数据",  en: "Open Cosmetics — Public Cosmetics Data" },
  "site.description":  {
    zh: "B2B 化妆品数据 MCP + Next.js — 中国 + 欧盟 + 美国 + 合成生物, 8 维度原料数据库, 65 风险规则, Claude / GPT 可直接调用的 MCP server",
    en: "B2B cosmetics data MCP + Next.js — China + EU + US + synthetic biology, 8-dimensional ingredient DB, 65 risk rules, MCP server callable from Claude/GPT"
  },
  "site.snapshot":     { zh: "快照",                  en: "Snapshot" },
  "site.mcp_version":  { zh: "MCP",                  en: "MCP" },

  // ───── Home page ─────
  "home.title":        { zh: "🧪 开放美妆数据",         en: "🧪 Open Cosmetics Data" },
  "home.subtitle":     {
    zh: "5 个公开源拼起来",
    en: "5 public sources combined"
  },
  "home.tagline":      {
    zh: "零法律风险, robots.txt 全部允许, jsDelivr CDN 下载。与 BEBD 公开 schema 对比, 多 5000 倍数据 + 4 个 BEBD 完全缺失的维度。",
    en: "Zero legal risk, all robots.txt allowed, jsDelivr CDN download. vs BEBD public schema: 5000x more data + 4 dimensions BEBD lacks entirely."
  },
  "home.stats.cosing":           { zh: "统一 CosIng 成分",     en: "Unified CosIng" },
  "home.stats.beauteeru":        { zh: "含 PubChem CID",       en: "w/ PubChem CID" },
  "home.stats.obf":              { zh: "OBF 完整版",          en: "OBF Full" },
  "home.stats.prohibited":       { zh: "EU 禁用 (Annex II)",  en: "EU Banned (Annex II)" },
  "home.stats.restricted":       { zh: "EU 限用 (Annex III)", en: "EU Restricted (Annex III)" },
  "home.stats.preservatives":    { zh: "EU 防腐剂",           en: "EU Preservatives" },
  "home.stats.uv_filters":       { zh: "EU 防晒剂",           en: "EU UV Filters" },
  "home.stats.incidb":           { zh: "INCIDB 样本",         en: "INCIDB Sample" },
  "home.killer.title":           {
    zh: "🚨 Killer Finding: BEBD 公开 Top 10 成分中 3 个匹配 EU 禁用清单",
    en: "🚨 Killer Finding: 3 of BEBD public Top 10 ingredients match EU banned list"
  },
  "home.killer.note":            {
    zh: 'BEBD 公开 schema 看不出这层。搜 "GLYCERIN" 不会告诉你同名变体 Nitroglycerin 是心脏药 (Annex II #253)。',
    en: 'BEBD\'s public schema can\'t show this layer. Searching "GLYCERIN" won\'t tell you that the homograph Nitroglycerin is a heart drug (Annex II #253).'
  },
  "home.table.bebd":             { zh: "BEBD 公开成分",       en: "BEBD Public Ingredient" },
  "home.table.banned":           { zh: "EU 禁用变体 (Annex II)", en: "EU Banned Variant (Annex II)" },
  "home.table.ref":              { zh: "Ref",                 en: "Ref" },

  // ───── China page ─────
  "china.title":       { zh: "🇨🇳 中国化妆品法规数据",  en: "🇨🇳 China Cosmetics Regulatory Data" },
  "china.subtitle":    {
    zh: "NMPA 2025 年第 61 号公告 + STSC 2015 + GB 7916-2026",
    en: "NMPA 2025 #61 + STSC 2015 + GB 7916-2026"
  },
  "china.tagline":     {
    zh: "2025-06-23 NMPA 将 IECIC 拆分为 Ⅰ + Ⅱ 两个清单; 2026-08-06 GB 7916-2026 首个强制性国标发布 (2028-01-01 实施)。",
    en: "2025-06-23 NMPA split IECIC into I + II; 2026-08-06 GB 7916-2026 first mandatory standard published (effective 2028-01-01)."
  },
  "china.stat.iecic_i":          { zh: "IECIC Ⅰ (已使用)",   en: "IECIC I (Existing)" },
  "china.stat.iecic_ii":         { zh: "IECIC Ⅱ (新原料)",   en: "IECIC II (New)" },
  "china.stat.adjustments":      { zh: "调整说明 (2025-06-23)", en: "Adjustments (2025-06-23)" },
  "china.stat.cosing_compare":   { zh: "EU CosIng (跨地区比对)", en: "EU CosIng (Cross-region)" },
  "china.stat.eu_prohibited":    { zh: "EU 禁用 (Annex II)", en: "EU Banned (Annex II)" },
  "china.timeline.title":        { zh: "📅 2025-2026 中国化妆品法规大事记", en: "📅 2025-2026 China Regulatory Milestones" },
  "china.gb.title":              { zh: "⚠️ GB 7916-2026 严控 8 种有害物质", en: "⚠️ GB 7916-2026: 8 Restricted Harmful Substances" },
  "china.gb.subtitle":           { zh: "首个强制性国标, 2028-01-01 实施, 取代 1987 版 GB 7916。", en: "First mandatory national standard, effective 2028-01-01, replaces 1987 GB 7916." },
  "china.gb.substance":          { zh: "有害物质",            en: "Hazardous Substance" },
  "china.gb.limit":              { zh: "限量",                en: "Limit" },
  "china.gb.category":           { zh: "类别",                en: "Category" },
  "china.adjustments.title":     { zh: "🔄 2025-06-23 IECIC 调整说明 (前 6 段节选)", en: "🔄 2025-06-23 IECIC Adjustments (Top 6)" },
  "china.sample.title":          { zh: "📊 IECIC Ⅰ 随机 8 条 (示例)", en: "📊 IECIC I Random 8 (Sample)" },
  "china.sample.seq":            { zh: "序号",                en: "Seq" },
  "china.sample.zh":             { zh: "中文名称",            en: "Chinese Name" },
  "china.sample.inci":           { zh: "INCI 名称",           en: "INCI Name" },
  "china.sample.search":         { zh: "搜索",                en: "Search" },
  "china.regions.title":         { zh: "🔗 多地区法规对比",   en: "🔗 Multi-region Regulatory Comparison" },

  // ───── Synbio page ─────
  "synbio.title":      { zh: "🧬 合成生物美妆原料公司",  en: "🧬 Synthetic Biology Cosmetic Companies" },
  "synbio.subtitle":   {
    zh: "港/A/北交所 公开披露",
    en: "HK/A/BSE public disclosure"
  },
  "synbio.tagline":    {
    zh: "重组胶原蛋白 (锦波/巨子) + 透明质酸 (华熙) 是中国合成生物美妆的两大主线。2024 年市场 ¥185 亿, 2030 年预测 ¥2,193 亿, CAGR 42.4%。",
    en: "Recombinant collagen (Jinbo/Juzi) + hyaluronic acid (Huaxi) are the two main lanes of China synbio cosmetics. 2024 market ¥18.5B, 2030E ¥219.4B, CAGR 42.4%."
  },
  "synbio.stat.2022":  { zh: "2022 市场规模",         en: "2022 Market Size" },
  "synbio.stat.2025E": { zh: "2025E 规模",            en: "2025E Size" },
  "synbio.stat.2030E": { zh: "2030E 规模",            en: "2030E Size" },
  "synbio.stat.cagr":  { zh: "2022-30 CAGR",          en: "2022-30 CAGR" },
  "synbio.listed":      { zh: "上市",                  en: "Listed" },
  "synbio.hq":          { zh: "总部",                  en: "HQ" },
  "synbio.revenue":     { zh: "2024 营收",             en: "2024 Revenue" },
  "synbio.yoy":         { zh: "YoY 增长",              en: "YoY Growth" },
  "synbio.net_profit":  { zh: "净利润",                en: "Net Profit" },
  "synbio.gross_margin":{ zh: "毛利率",                en: "Gross Margin" },
  "synbio.brands":      { zh: "品牌",                  en: "Brands" },
  "synbio.regulatory":  { zh: "监管",                  en: "Regulatory" },
  "synbio.products":    { zh: "产品",                  en: "Products" },
  "synbio.history":     { zh: "营收历史",              en: "Revenue History" },
  "synbio.year":        { zh: "年",                    en: "Year" },
  "synbio.growth":      { zh: "YoY",                   en: "YoY" },
  "synbio.upstream":    { zh: "上下游",                en: "Upstream / Downstream" },
  "synbio.upstream.up": { zh: "上游 (B2B 原料商):",   en: "Upstream (B2B Suppliers):" },
  "synbio.upstream.market": { zh: "市场预测 (Frost & Sullivan):", en: "Market Forecast (Frost & Sullivan):" },
  "synbio.mcp.title":   { zh: "🤖 MCP 集成",           en: "🤖 MCP Integration" },
  "synbio.mcp.desc":    {
    zh: "把上面 4 家公司 + 65 规则 暴露为 MCP server, 配方师可以在 Claude / GPT 客户端里直接调用:",
    en: "Expose the 4 companies + 65 rules as MCP server, formulators can call directly from Claude / GPT client:"
  },

  // ───── Risk page ─────
  "risk.title":        { zh: "⚖️ 配方风险审查",        en: "⚖️ Formula Risk Review" },
  "risk.subtitle":     {
    zh: "65 规则 × 7 类 — MixMyRoutine + STSC 2015 + NIFDC",
    en: "65 rules × 7 categories — MixMyRoutine + STSC 2015 + NIFDC"
  },
  "risk.tagline":      {
    zh: "实时检查成分兼容性 / pH / 浓度 / 特殊人群 / 区域合规 — Claude / GPT 可通过 MCP 调用",
    en: "Real-time check: compatibility / pH / concentration / special population / region — Claude/GPT can call via MCP"
  },
  "risk.formula.ingredients": { zh: "成分列表 (逗号/换行分隔)", en: "Ingredients (comma/newline separated)" },
  "risk.formula.population":   { zh: "人群",                     en: "Population" },
  "risk.formula.region":       { zh: "地区",                     en: "Region" },
  "risk.formula.check":        { zh: "🔍 审查配方",              en: "🔍 Review Formula" },
  "risk.formula.checking":     { zh: "⏳ 审查中...",            en: "⏳ Reviewing..." },
  "risk.population.adult":     { zh: "成人",                     en: "Adult" },
  "risk.population.pregnant":  { zh: "孕妇",                     en: "Pregnant" },
  "risk.population.child":     { zh: "儿童 (0-12)",              en: "Child (0-12)" },
  "risk.population.sensitive": { zh: "敏感肌",                   en: "Sensitive Skin" },
  "risk.preset":               { zh: "预置配方:",               en: "Presets:" },
  "risk.result.title":         { zh: "📋 审查结果",              en: "📋 Review Result" },
  "risk.result.severity":      { zh: "严重度",                   en: "Severity" },
  "risk.result.category":      { zh: "类别",                     en: "Category" },
  "risk.result.rule":          { zh: "规则",                     en: "Rule" },
  "risk.result.matched":       { zh: "匹配",                     en: "Matched" },
  "risk.result.explanation":   { zh: "说明",                     en: "Explanation" },
  "risk.result.block":         { zh: "BLOCK",                    en: "BLOCK" },
  "risk.result.warn":          { zh: "WARN",                     en: "WARN" },
  "risk.result.info":          { zh: "INFO",                     en: "INFO" },
  "risk.result.total":         { zh: "总规则",                   en: "Total Rules" },
  "risk.result.pass":          { zh: "✅ 所有规则通过。无风险。", en: "✅ All rules passed. No risk." },
  "risk.coverage.title":       { zh: "📚 规则覆盖",              en: "📚 Rule Coverage" },
  "risk.coverage.compat":      { zh: "成分配伍, pH 冲突",        en: "Compatibility, pH conflict" },
  "risk.coverage.ph":          { zh: "驻留/淋洗/儿童/特殊部位", en: "Leave-on/rinse-off/child/special" },
  "risk.coverage.conc":        { zh: "STSC 2015 + EU + FDA",    en: "STSC 2015 + EU + FDA" },
  "risk.coverage.pop":         { zh: "孕妇/婴幼儿/敏感肌",       en: "Pregnant/infant/sensitive" },
  "risk.coverage.region":      { zh: "CN/EU/US/KR/JP/ASEAN",    en: "CN/EU/US/KR/JP/ASEAN" },
  "risk.coverage.synbio":      { zh: "重组胶原 / 透明质酸 / NMN", en: "Recombinant collagen / HA / NMN" },
  "risk.coverage.fda":         { zh: "openFDA 85,511 reports",   en: "openFDA 85,511 reports" },
  "risk.error":                { zh: "❌ 错误:",                en: "❌ Error:" },

  // ───── Preset formulas ─────
  "preset.孕妇美白":  { zh: "孕妇美白",  en: "Pregnant Whitening" },
  "preset.敏感肌抗老":{ zh: "敏感肌抗老",en: "Sensitive Anti-aging" },
  "preset.祛痘":     { zh: "祛痘",      en: "Acne Treatment" },
  "preset.儿童润肤": { zh: "儿童润肤",  en: "Baby Moisturizer" },
  "preset.防晒":     { zh: "防晒",      en: "Sunscreen" },
  "preset.安全基础": { zh: "安全基础",  en: "Safe Base" },

  // ───── API responses ─────
  "api.error.q_required":       { zh: "缺少 q 参数 (中文名或 INCI)", en: "q parameter required (Chinese name or INCI)" },
  "api.error.json":             { zh: "无效的 JSON 请求体",         en: "Invalid JSON body" },
  "api.error.ingredients":      { zh: "ingredients 必须是非空字符串数组", en: "ingredients must be non-empty string[]" },
  "api.error.tool_required":    { zh: "需要 tool 字段",            en: "tool required" },
  "api.error.unknown_tool":     { zh: "未知工具:",                en: "Unknown tool:" },
  "api.error.ingredient_req":   { zh: "需要 ingredient 参数",      en: "ingredient parameter required" },
  "api.error.company_not_found":{ zh: "公司",                     en: "Company" },
  "api.error.not_found":        { zh: "未找到",                   en: "not found" },
  "api.error.rules_missing":    { zh: "rules.json 未加载",         en: "rules.json not loaded" },
  "api.error.companies_missing":{ zh: "companies.json 未加载",     en: "companies.json not loaded" },

  // ───── MCP ─────
  "mcp.title":         { zh: "🤖 MCP Server",         en: "🤖 MCP Server" },
  "mcp.desc": {
    zh: "化妆品法规 + 合成生物 + 风险审查 MCP server",
    en: "Cosmetics regulatory + synbio + risk review MCP server"
  },
  "mcp.transport":     { zh: "HTTP POST (also available as stdio MCP)", en: "HTTP POST (also available as stdio MCP)" },
  "mcp.usage":         { zh: "POST { tool: 'list_tools' } 发现, 然后 POST { tool: '<name>', args: {...} }", en: "POST { tool: 'list_tools' } to discover, then POST { tool: '<name>', args: {...} }" },
  "mcp.tool.ingredient_query": { zh: "跨源查询 (CN + EU + INCI)", en: "Cross-source query (CN + EU + INCI)" },
  "mcp.tool.formula_review":   { zh: "65 规则审查 (兼容/pH/浓度/特殊人群)", en: "65-rule review (compat/pH/conc/population)" },
  "mcp.tool.compliance_check": { zh: "多地区合规扫描",             en: "Multi-region compliance scan" },
  "mcp.tool.synbio_company":   { zh: "4 上市公司元数据",           en: "4 listed companies metadata" },

  // ───── Common ─────
  "common.search":     { zh: "搜索",                   en: "Search" },
  "common.back":       { zh: "← 返回",                 en: "← Back" },
  "common.next":       { zh: "下一步 →",               en: "Next →" },
  "common.records":    { zh: "记录",                   en: "records" },
  "common.note":       { zh: "备注",                   en: "Note" },
  "common.source":     { zh: "数据源",                 en: "Source" },
  "common.updated":    { zh: "最后更新",               en: "Last Updated" },
  "common.year":       { zh: "年",                     en: "Year" },
  "common.revenue":    { zh: "营收",                   en: "Revenue" },
  "common.region.cn":  { zh: "🇨🇳 中国",              en: "🇨🇳 China" },
  "common.region.eu":  { zh: "🇪🇺 欧盟",              en: "🇪🇺 EU" },
  "common.region.us":  { zh: "🇺🇸 美国",              en: "🇺🇸 US" },
  "common.region.kr":  { zh: "🇰🇷 韩国",              en: "🇰🇷 Korea" },
  "common.region.jp":  { zh: "🇯🇵 日本",              en: "🇯🇵 Japan" },
  "common.region.asean":{ zh: "🇦🇸 东盟",             en: "🇦🇸 ASEAN" },
};

// ───── Translation helper ─────
export function t(key, lang = "zh") {
  const entry = DICT[key];
  if (!entry) return key;
  if (lang === "en") return entry.en;
  if (lang === "zh") return entry.zh;
  // "both" mode: show zh + en if they differ
  if (entry.zh === entry.en) return entry.zh;
  return `${entry.zh} / ${entry.en}`;
}

// Pick a field based on language
export function pickLang(zhValue, enValue, lang = "zh") {
  if (lang === "en") return enValue || zhValue;
  if (lang === "zh") return zhValue || enValue;
  if (!zhValue || zhValue === enValue) return enValue;
  if (!enValue) return zhValue;
  return `${zhValue} / ${enValue}`;
}

// Read lang from cookies (server side)
// Accepts: raw cookie header string, next/headers ReadonlyRequestCookies object, or Promise thereof
export async function getLangFromCookies(cookieInput) {
  // Await if it's a Promise (Next.js 15 cookies() is async)
  let cookieHeader = cookieInput;
  if (cookieInput && typeof cookieInput.then === "function") {
    cookieHeader = await cookieInput;
  }
  if (!cookieHeader) return "both";
  if (typeof cookieHeader === "string") {
    const match = cookieHeader.match(/opencosmetics_lang=([^;]+)/);
    return match ? match[1] : "both";
  }
  // next/headers ReadonlyRequestCookies object
  if (typeof cookieHeader.get === "function") {
    const v = cookieHeader.get("opencosmetics_lang")?.value;
    if (v && ["zh", "en", "both"].includes(v)) return v;
  }
  return "both";
}

// Get the default language for server components
export function getServerLang() {
  if (typeof document !== "undefined") {
    return localStorage.getItem("opencosmetics_lang") || "both";
  }
  return "both"; // SSR default
}
