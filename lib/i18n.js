// i18n.js — Bilingual UI strings for open-cosmetics
// 2 modes: 'zh' (中文 only) | 'en' (English only)

export const LANGUAGES = ["zh", "en"];

export const LANG_LABELS = {
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
  "nav.formula":       { zh: "🔬 配方分析",         en: "🔬 Formula" },
  "nav.substitute":    { zh: "🔁 成分替代",         en: "🔁 Substitute" },
  "nav.mcp":           { zh: "🤖 MCP",              en: "🤖 MCP" },
  "nav.sources":       { zh: "数据源",               en: "Sources" },

  // ───── Site metadata ─────
  "site.title":        { zh: "Open Cosmetics — 开放美妆数据",  en: "Open Cosmetics — Public Cosmetics Data" },
  "site.brand":        { zh: "🧪 开放美妆数据",        en: "🧪 Open Cosmetics" },
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
    zh: "🚨 重要发现: BEBD 公开热门 10 成分中 3 个匹配 EU 禁用清单",
    en: "🚨 Killer Finding: 3 of BEBD public Top 10 ingredients match EU banned list"
  },
  "home.killer.note":            {
    zh: 'BEBD 公开 schema 看不出这层。搜 "甘油" 不会告诉你同名变体硝酸甘油是心脏药 (Annex II #253)。',
    en: 'BEBD\'s public schema can\'t show this layer. Searching "GLYCERIN" won\'t tell you that the homograph Nitroglycerin is a heart drug (Annex II #253).'
  },
  "home.table.bebd":             { zh: "BEBD 公开成分",       en: "BEBD Public Ingredient" },
  "home.table.banned":           { zh: "EU 禁用变体 (Annex II)", en: "EU Banned Variant (Annex II)" },
  "home.table.ref":              { zh: "参考号",                 en: "Ref" },
  "home.table.top5":             { zh: "热门 5",                 en: "Top 5" },

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
  "common.empty":      { zh: "无匹配",                 en: "No matches" },
  "common.all":        { zh: "全部",                   en: "All" },
  "common.detail":     { zh: "详情",                   en: "Detail" },
  "common.view":       { zh: "查看",                   en: "View" },
  "common.download":   { zh: "下载",                   en: "Download" },
  "common.regulation": { zh: "监管",                   en: "Regulation" },
  "common.field":      { zh: "字段",                   en: "Field" },
  "common.count":      { zh: "数量",                   en: "Count" },
  "common.bar":        { zh: "柱",                     en: "Bar" },
  "common.range":      { zh: "区间",                   en: "Range" },
  "common.background": { zh: "背景",                   en: "Background" },
  "common.top":        { zh: "热门",                   en: "Top" },
  "common.date":       { zh: "日期",                   en: "Date" },
  "common.patient":    { zh: "患者",                   en: "Patient" },
  "common.products":   { zh: "产品",                   en: "Products" },
  "common.reactions":  { zh: "不良反应",               en: "Reactions" },
  "common.report_no":  { zh: "报告号",                 en: "Report #" },
  "common.chemical":   { zh: "化学名 / INCI",          en: "Chemical Name / INCI" },
  "common.ec":         { zh: "EC 编号",                en: "EC" },
  "common.cas":        { zh: "CAS 编号",               en: "CAS" },
  "common.ref":        { zh: "参考号",                 en: "Ref" },
  "common.year_short": { zh: "岁",                     en: "y" },
  "common.none_suspect":{zh: "(无 — 仅为伴用产品)",   en: "(none — only concomitant)" },
  "common.products_suspect":{ zh: "产品(疑似)",        en: "Products (Suspect)" },
  "common.ingredients_zh":{ zh: "成分",                en: "ingredients" },
  "common.ing_label":  { zh: "成分名",                 en: "Ingredient Name" },
  "common.brand":      { zh: "来源",                   en: "Brand" },
  "common.fields_short":{ zh: "INCI + CAS + EC + 功能 + 限用 + INN + 欧洲药典", en: "INCI + CAS + EC + Function + Restriction + INN + PhEur" },
  "common.fields_cid": { zh: "INCI + CAS + EC + PubChem CID", en: "INCI + CAS + EC + PubChem CID" },
  "common.regulation_label":{ zh: "监管",              en: "Regulatory" },
  "common.brand_inci_pubchem":{ zh: "INCI + 17 源 join + 致痘 + FDA 警告", en: "INCI + 17 source join + comedogenic + FDA warning" },
  "common.in_pubchem": { zh: "PubChem CID 链接",       en: "PubChem CID link" },
  "common.in_fda":     { zh: "FDA 数据库",             en: "FDA database" },
  "common.in_eu":      { zh: "EU 数据库",              en: "EU database" },
  "common.in_cn":      { zh: "中国数据库",             en: "CN database" },
  "common.function_label":{ zh: "功能",                en: "Function" },
  "common.match_count":{ zh: "{n} 条匹配",            en: "{n} matches" },
  "common.source_link":{ zh: "数据源",                 en: "Source" },
  "common.fda_link":   { zh: "openFDA 化妆品事件报告",  en: "openFDA Cosmetic Event Reports" },
  "common.ingredients_count_n": { zh: "成分: {n} 条",   en: "{n} ingredients" },
  "common.label":      { zh: "标签",                   en: "Label" },

  // ───── Home page (more) ─────
  "home.function.top": { zh: "📊 CosIng 成分功能 热门 5",       en: "📊 CosIng Function Top 5" },
  "home.sources.title":{ zh: "🗺️ 数据源",                       en: "🗺️ Data Sources" },
  "home.sources.ingested":{ zh: "🟢 已落库 (5 源)",            en: "🟢 Ingested (5 sources)" },
  "home.sources.pending":{ zh: "🟡 待办",                       en: "🟡 Pending" },
  "home.sources.li1":  { zh: "<b>walkowskis</b> — EU CosIng 26K, Function/Restriction", en: "<b>walkowskis</b> — EU CosIng 26K, Function/Restriction" },
  "home.sources.li2":  { zh: "<b>beauteeru</b> — EU CosIng 28K, PubChem CID", en: "<b>beauteeru</b> — EU CosIng 28K, PubChem CID" },
  "home.sources.li3":  { zh: "<b>OBF Annexes</b> — EU 监管 1,927 条", en: "<b>OBF Annexes</b> — EU regulatory 1,927" },
  "home.sources.li4":  { zh: "<b>OBF CosIng full</b> — EU CosIng 24K, 多源 join", en: "<b>OBF CosIng full</b> — EU CosIng 24K, multi-source join" },
  "home.sources.li5":  { zh: "<b>INCIDB sample</b> — 130 成分 + 10 商品 + 191 配方", en: "<b>INCIDB sample</b> — 130 ingredients + 10 products + 191 formulas" },
  "home.sources.li6":  { zh: "<b>INCIDB 全量</b> — 43K 成分, 公开仅 130, 余下在付费墙后", en: "<b>INCIDB full</b> — 43K ingredients, public only 130, rest behind paywall" },
  "home.sources.li7":  { zh: "<b>NMPA 备案</b> — 4M+ 中国数据, 这台机器 DNS 拦", en: "<b>NMPA filing</b> — 4M+ China data, this machine DNS-blocked" },
  "home.sources.li8":  { zh: "<b>FDA VCRP</b> — 2M 美国商品", en: "<b>FDA VCRP</b> — 2M US products" },
  "home.sources.li9":  { zh: "<b>Wikidata SPARQL</b> — 跨语言结构化标签", en: "<b>Wikidata SPARQL</b> — cross-language structured labels" },

  // ───── FDA page ─────
  "fda.title":         { zh: "🇺🇸 FDA 化妆品事件",        en: "🇺🇸 FDA Cosmetic Events" },
  "fda.subtitle":      { zh: "85,511 报告 · 4 维度聚合",  en: "85,511 reports · 4-dim aggregation" },
  "fda.source":        { zh: "来源",                      en: "Source" },
  "fda.fetched":       { zh: "本地快照",                  en: "Local snapshot" },
  "fda.kpi.events":    { zh: "化妆品事件",                en: "Cosmetic Events" },
  "fda.kpi.female":    { zh: "女性 (95.7%)",              en: "Female (95.7%)" },
  "fda.kpi.male":      { zh: "男性 (4.3%)",                en: "Male (4.3%)" },
  "fda.kpi.ovarian":   { zh: "卵巢癌反应",                  en: "Ovarian Cancer reaction" },
  "fda.kpi.years":     { zh: "24 年",                     en: "24 years" },
  "fda.signals.title": { zh: "🚨 关键安全信号 (4 个)",     en: "🚨 Key Safety Signals (4)" },
  "fda.products.title":{ zh: "📦 Top 20 被报告产品",        en: "📦 Top 20 Reported Products" },
  "fda.products.note": { zh: "注: 这些是用户上报的名字, 同一产品多个变体, 例如 J&J 婴儿爽身粉在 5 个不同写法下总共 84K+ 报告", en: "Note: user-reported names with variants. E.g. J&J Baby Powder across 5 different spellings = 84K+ reports" },
  "fda.products.col.product":{ zh: "产品名",                 en: "Product" },
  "fda.products.col.count":{ zh: "事件数",                  en: "Event Count" },
  "fda.reactions.title":{ zh: "⚠️ 热门 20 不良反应",        en: "⚠️ Top 20 Adverse Reactions" },
  "fda.reactions.col.reaction":{ zh: "反应",                en: "Reaction" },
  "fda.reactions.col.count":{ zh: "次数",                    en: "Count" },
  "fda.time.title":    { zh: "📅 按时间分布 (估算)",        en: "📅 Time Distribution (estimated)" },
  "fda.time.note":     { zh: "早期记录少 (1990s MoCRA 实施前), 2018 后开始指数增长 (WEN/DevaCurl 诉讼 + J&J 滑石粉系列宣判)", en: "Sparse pre-1990s (before MoCRA), exponential growth after 2018 (WEN/DevaCurl lawsuits + J&J talc rulings)" },
  "fda.time.col.range":{ zh: "区间",                      en: "Range" },
  "fda.time.col.events":{ zh: "事件估算",                 en: "Estimated Events" },
  "fda.time.col.bg":   { zh: "背景",                       en: "Background" },
  "fda.time.2019_2020":{ zh: "J&J talc 判决 + WEN 集体诉讼", en: "J&J talc ruling + WEN class action" },
  "fda.time.2021_2023":{ zh: "DevaCurl 诉讼激增",          en: "DevaCurl lawsuits surge" },
  "fda.time.2024_2025":{ zh: "MoCRA 2023 实施后, 报告要求强化", en: "Post MoCRA 2023, reporting requirements tightened" },
  "fda.time.2016_2018":{ zh: "J&J 系列诉讼进入联邦法院",   en: "J&J lawsuits enter federal court" },
  "fda.time.2001_2010":{ zh: "FDA 自愿报告, 极少数",       en: "FDA voluntary reporting, very few" },
  "fda.samples.title": { zh: "📋 样本事件 (3 条)",          en: "📋 Sample Events (3)" },
  "fda.linkage.title": { zh: "🔗 与 BEBD / CosIng 的关联",  en: "🔗 BEBD / CosIng Linkage" },
  "fda.linkage.l1":    { zh: "BEBD 公开 Top 8 成分均**未出现在 FDA 不良反应 Top 20** (美修指数榜 ≠ 安全榜)", en: "BEBD public Top 8 ingredients are all **absent from FDA Top 20 reactions** (美修 index ≠ safety)" },
  "fda.linkage.l2":    { zh: "BEBD \"美修指数 99.82\" 全部相同的 Top 10 成分也**没有 1 个在 FDA Top 反应里**", en: "BEBD's 10 ingredients with all 99.82 美修 index are also **not in FDA Top reactions**" },
  "fda.linkage.l3":    { zh: "FDA 的真实信号是 <b>产品名</b> (J&J, WEN, DevaCurl) 而非 <b>成分</b> — BEBD schema 完全看不到产品名层", en: "FDA's real signal is <b>product name</b> (J&J, WEN, DevaCurl) not <b>ingredient</b> — BEBD schema doesn't see product layer" },
  "fda.linkage.l4":    { zh: "我们 v3 数据加上 openFDA 后, 真正能跑 \"成分 × 安全信号\" 跨源 join", en: "v3 + openFDA enables true \"ingredient × safety signal\" cross-source join" },
  "fda.back":         { zh: "← 回首页",                    en: "← Home" },

  // ───── Ingredients page ─────
  "ingredients.title":  { zh: "🧬 成分库",                  en: "🧬 Ingredients" },
  "ingredients.search.placeholder": { zh: "搜中文名 / INCI / CAS...", en: "Search INCI / CAS / function..." },
  "ingredients.col.inci":{ zh: "INCI 名称",                 en: "INCI Name" },
  "ingredients.pagination":{ zh: "第 {from}-{to} / {total} 条 · 第 {page} / {pages} 页", en: "{from}-{to} of {total} · page {page}/{pages}" },
  "ingredients.prev":   { zh: "← 上一页",                   en: "← Prev" },
  "ingredients.next":   { zh: "下一页 →",                  en: "Next →" },
  "ingredients.back":   { zh: "← 全部成分",                en: "← All Ingredients" },
  "ingredients.basic":  { zh: "🧪 基本信息",                en: "🧪 Basic Info" },
  "ingredients.eu.title":{ zh: "⚖️ EU 监管状态",            en: "⚖️ EU Regulatory Status" },
  "ingredients.eu.prohibited":{ zh: "PROHIBITED (禁用)",    en: "PROHIBITED" },
  "ingredients.eu.restricted":{ zh: "RESTRICTED (限用)",    en: "RESTRICTED" },
  "ingredients.eu.preservative":{ zh: "PRESERVATIVE (防腐剂)", en: "PRESERVATIVE" },
  "ingredients.eu.uvfilter":{ zh: "UV FILTER (防晒剂)",     en: "UV FILTER" },
  "ingredients.eu.none":{ zh: "✓ 在 EU 监管 5 个 Annex 中均无对应条目 (按名称匹配)", en: "✓ No match in any of the 5 EU Annexes (by name)" },
  "ingredients.chem":   { zh: "📖 化学描述",                en: "📖 Chemistry" },
  "ingredients.fn":     { zh: "功能",                       en: "Function" },
  "ingredients.restrictions":{ zh: "限制",                   en: "Restrictions" },
  "ingredients.cas":    { zh: "CAS 号",                     en: "CAS No." },
  "ingredients.chem_name":{ zh: "化学名",                    en: "Chemical Name" },
  "ingredients.description":{ zh: "描述",                    en: "Description" },
  "ingredients.found_in":{ zh: "收录于",                    en: "Found in" },
  "ingredients.inci":   { zh: "INCI 名称",                  en: "INCI Name" },
  "ingredients.max_concentration":{ zh: "最大浓度",          en: "Max Concentration" },
  "ingredients.leave_on_max":{ zh: "驻留类最大",             en: "Leave-on Max" },
  "ingredients.rinse_off_max":{ zh: "淋洗类最大",            en: "Rinse-off Max" },
  "ingredients.conditions":{ zh: "使用条件",                en: "Conditions" },
  "ingredients.label":  { zh: "标签",                       en: "Label" },

  // ───── Regulatory page ─────
  "regulatory.title":   { zh: "⚖️ EU 化妆品监管",          en: "⚖️ EU Cosmetics Regulation" },
  "regulatory.subtitle":{ zh: "EU Cosmetics Regulation 1223/2009 的 5 个 Annex. 任何成分查这个数据库,能直接告诉你在 EU 是不是允许用。", en: "5 Annexes of EU Regulation 1223/2009. Query any ingredient to instantly know if EU allows it." },
  "regulatory.annex.ii.name":{ zh: "Annex II — Prohibited (禁用)", en: "Annex II — Prohibited" },
  "regulatory.annex.ii.desc":{ zh: "化妆品中完全禁止使用的成分清单", en: "List of substances prohibited in cosmetic products" },
  "regulatory.annex.iii.name":{ zh: "Annex III — Restricted (限用)", en: "Annex III — Restricted" },
  "regulatory.annex.iii.desc":{ zh: "在特定浓度/部位/条件下才允许使用", en: "Allowed only under specific concentration/body/conditions" },
  "regulatory.annex.iv.name":{ zh: "Annex IV — Colorants (着色剂)", en: "Annex IV — Colorants" },
  "regulatory.annex.iv.desc":{ zh: "允许使用的着色剂清单",  en: "List of allowed colorants" },
  "regulatory.annex.v.name":{ zh: "Annex V — Preservatives (防腐剂)", en: "Annex V — Preservatives" },
  "regulatory.annex.v.desc":{ zh: "允许使用的防腐剂清单",  en: "List of allowed preservatives" },
  "regulatory.annex.vi.name":{ zh: "Annex VI — UV Filters (防晒剂)", en: "Annex VI — UV Filters" },
  "regulatory.annex.vi.desc":{ zh: "允许使用的防晒剂清单",  en: "List of allowed UV filters" },
  "regulatory.showing": { zh: "显示前 20 / {n} 条",         en: "Showing top 20 of {n}" },
  "regulatory.col.substance":{ zh: "成分 / 物质",           en: "Substance" },
  "regulatory.col.ref":  { zh: "Ref",                       en: "Ref" },
  "regulatory.col.cas":  { zh: "CAS",                       en: "CAS" },

  // ───── Sources page ─────
  "sources.title":     { zh: "🗺️ 数据源",                  en: "🗺️ Data Sources" },
  "sources.subtitle":  { zh: "所有 5 个数据源都是公开/robots.txt 允许/jsDelivr 镜像,零法律风险", en: "All 5 sources are public, robots.txt-allowed, jsDelivr mirrored. Zero legal risk." },
  "sources.ingested":  { zh: "🟢 已落库 (5 源, 80K+ records)", en: "🟢 Ingested (5 sources, 80K+ records)" },
  "sources.col.source":{ zh: "源",                         en: "Source" },
  "sources.col.table": { zh: "表",                         en: "Table" },
  "sources.col.records":{ zh: "记录数",                    en: "Records" },
  "sources.col.fields":{ zh: "字段",                       en: "Fields" },
  "sources.pending":   { zh: "🟡 待办",                    en: "🟡 Pending" },
  "sources.col.expected":{ zh: "期望",                      en: "Expected" },
  "sources.col.blocker":{ zh: "阻塞原因",                  en: "Blocker" },
  "sources.pending.incidb.expected":{ zh: "43K 成分 + 19K 商品 + 320K 映射", en: "43K ingredients + 19K products + 320K mappings" },
  "sources.pending.incidb.blocker":{ zh: "公开仅 130, 余下在付费墙后", en: "Public only 130, rest behind paywall" },
  "sources.pending.nmpa.expected":{ zh: "4M+ 中国数据",     en: "4M+ China data" },
  "sources.pending.nmpa.blocker":{ zh: "DNS 拦, 需 Playwright + IP 轮换", en: "DNS blocked, needs Playwright + IP rotation" },
  "sources.pending.fda.expected":{ zh: "2M 美国商品",       en: "2M US products" },
  "sources.pending.fda.blocker":{ zh: "未启动",              en: "Not started" },
  "sources.pending.wikidata.expected":{ zh: "结构化标签 + 跨语言", en: "Structured labels + cross-language" },
  "sources.pending.wikidata.blocker":{ zh: "SSL 拦截",       en: "SSL intercept" },
  "sources.legal":     { zh: "🛡️ 法律边界",                en: "🛡️ Legal Boundaries" },
  "sources.legal.intro":{ zh: "所有数据源:",               en: "All data sources:" },
  "sources.legal.li1": { zh: "EU CosIng: 欧盟公开数据库 (Regulation 1223/2009)", en: "EU CosIng: EU public DB (Regulation 1223/2009)" },
  "sources.legal.li2": { zh: "OBF Annexes: Open Beauty Facts (ODbL)", en: "OBF Annexes: Open Beauty Facts (ODbL)" },
  "sources.legal.li3": { zh: "INCIDB sample: GitHub 公开仓库 (CC-BY 4.0)", en: "INCIDB sample: GitHub public repo (CC-BY 4.0)" },
  "sources.legal.li4": { zh: "BEBD sitemap: bebd.bevol.com/sitemap.xml (公开)", en: "BEBD sitemap: bebd.bevol.com/sitemap.xml (public)" },
  "sources.legal.li5": { zh: "openFDA: 公共领域 (公开 API, 无需 auth)", en: "openFDA: Public domain (public API, no auth)" },
  "sources.legal.note":{ zh: "所有源都允许 robots.txt, 0 个抓取需 auth, 0 个私有 API 调用", en: "All sources allow robots.txt, 0 require auth, 0 private API calls" },

  // ───── Heavy metals / GB 7916 ─────
  "heavy_metal.lead":     { zh: "铅 Pb", en: "Lead (Pb)" },
  "heavy_metal.arsenic":  { zh: "砷 As", en: "Arsenic (As)" },
  "heavy_metal.mercury":  { zh: "汞 Hg", en: "Mercury (Hg)" },
  "heavy_metal.cadmium":  { zh: "镉 Cd", en: "Cadmium (Cd)" },
  "heavy_metal.methanol": { zh: "甲醇 (残留)", en: "Methanol (residual)" },
  "heavy_metal.dioxane":  { zh: "二噁烷", en: "Dioxane" },
  "heavy_metal.asbestos": { zh: "石棉", en: "Asbestos" },
  "heavy_metal.benzene":  { zh: "苯", en: "Benzene" },
  "heavy_metal.cat.heavy_metal":{ zh: "重金属总量", en: "Total heavy metal" },
  "heavy_metal.cat.trace":{ zh: "微量元素", en: "Trace element" },
  "heavy_metal.cat.specific":{ zh: "特定原料风险", en: "Specific ingredient risk" },
  "heavy_metal.cat.talc":{ zh: "滑石粉风险", en: "Talc powder risk" },
  "heavy_metal.cat.process":{ zh: "卡波姆工艺残留", en: "Carbomer process residual" },
  "heavy_metal.banned":   { zh: "禁用", en: "Banned" },
  "heavy_metal.monitor":  { zh: "按需监测", en: "On-demand monitoring" },

  // ───── China milestones ─────
  "china.m.2025_61":  { zh: "NMPA 2025 年第 61 号公告: IECIC 拆分为 Ⅰ (8,985) + Ⅱ (动态纳入新原料)", en: "NMPA 2025 #61: IECIC split into I (8,985) + II (dynamic new ingredients)" },
  "china.m.gb_2026":  { zh: "GB 7916-2026《化妆品 安全通用要求》发布, 2028-01-01 实施 (首个强制性国标)", en: "GB 7916-2026《General Safety Requirements for Cosmetics》 published, effective 2028-01-01 (first mandatory national standard)" },
  "china.m.first":    { zh: "首项检测: 眼周/口唇/儿童菌落总数限量比普通产品严 10×", en: "First test: eye/lip area + children colony limit 10x stricter than regular products" },
  "china.m.adj5":     { zh: "IECIC 第 5 次动态调整 (月桂酰丙氨酸等 3 个新原料 → IECIC Ⅱ)", en: "IECIC 5th dynamic adjustment (3 new ingredients like Lauroyl Alanine → IECIC II)" },
  "china.m.snow":     { zh: "NMPA 批准雪莲花愈伤组织粉 (大连普瑞康) 列入 IECIC Ⅱ", en: "NMPA approved Saussurea involucrata callus powder (Dalian Purecare) into IECIC II" },
  "china.region.cn":  { zh: "NMPA + NIFDC + 中检院 (STSC 2015 + GB 7916-2026) — 8,985 原料 + 1,393 禁用 + 47 限用 + 4 类准用", en: "NMPA + NIFDC (STSC 2015 + GB 7916-2026) — 8,985 ingredients + 1,393 banned + 47 restricted + 4 allowed" },
  "china.region.eu":  { zh: "CosIng + 5 Annex — 50,169 成分 + 1,927 监管 (开放)", en: "CosIng + 5 Annex — 50,169 ingredients + 1,927 regulatory (open)" },
  "china.region.us":  { zh: "FDA + CIR — 11 禁用 + MoCRA 2022 (现代法案)", en: "FDA + CIR — 11 banned + MoCRA 2022 (Modernization Act)" },
  "china.region.kr":  { zh: "KCID 20,530 成分 (KFDA)", en: "KCID 20,530 ingredients (KFDA)" },
  "china.region.jp":  { zh: "JCIA 16,152 成分 (PMDL)", en: "JCIA 16,152 ingredients (PMDL)" },
  "china.region.asean":{ zh: "Annex II 1,870 禁用",     en: "Annex II 1,870 banned" },
  "china.region.ingredients":{ zh: "成分",                en: "ingredients" },
  "china.region.kg_heavy_metal":{ zh: "重金属总量",       en: "Total heavy metal" },

  // ───── MCP tools descriptions (bilingual) ─────
  "mcp.tool.ingredient_query.desc": { zh: "跨源查询成分监管状态 (中国 NMPA IECIC + EU CosIng + EU Annex II 禁用)", en: "Cross-source ingredient query (CN NMPA IECIC + EU CosIng + EU Annex II banned)" },
  "mcp.tool.formula_review.desc":   { zh: "65 规则审查 (兼容性 / pH / 浓度 / 特殊人群)", en: "65-rule review (compat / pH / concentration / special population)" },
  "mcp.tool.compliance_check.desc": { zh: "多地区合规扫描 (中国/欧盟/美国/韩国/日本/东盟)", en: "Multi-region compliance scan (CN/EU/US/KR/JP/ASEAN)" },
  "mcp.tool.synbio_company.desc":   { zh: "4 合成生物美妆原料上市公司 (巨子/锦波/华熙/创健) 财务+技术+产品+监管", en: "4 listed synthetic biology cosmetic companies (Juzi/Jinbo/Huaxi/Chuangjian) financials+tech+products+regulatory" },
  "mcp.tool.ingredient_query.args": { zh: "中文名或 INCI 名", en: "Chinese name or INCI name" },
  "mcp.tool.formula_review.ingredients.args": { zh: "INCI 名称", en: "INCI names" },
};

// ───── Translation helper ─────
// Supports placeholder interpolation: t("key", lang, { from, to, total, page, pages })
// lang must be "zh" or "en" (default: "zh")
export function t(key, lang = "zh", params = {}) {
  const entry = DICT[key];
  if (!entry) return key;
  let zh = entry.zh;
  let en = entry.en;
  // Apply placeholder substitution
  for (const [k, v] of Object.entries(params)) {
    const re = new RegExp(`\\{${k}\\}`, "g");
    zh = zh.replace(re, v);
    en = en.replace(re, v);
  }
  if (lang === "en") return en;
  // Default and explicit zh: return Chinese only
  return zh;
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
// Default: "zh"
export async function getLangFromCookies(cookieInput) {
  // Await if it's a Promise (Next.js 15 cookies() is async)
  let cookieHeader = cookieInput;
  if (cookieInput && typeof cookieInput.then === "function") {
    cookieHeader = await cookieInput;
  }
  if (!cookieHeader) return "zh";
  if (typeof cookieHeader === "string") {
    const match = cookieHeader.match(/opencosmetics_lang=([^;]+)/);
    if (match && ["zh", "en"].includes(match[1])) return match[1];
    return "zh";
  }
  // next/headers ReadonlyRequestCookies object
  if (typeof cookieHeader.get === "function") {
    const v = cookieHeader.get("opencosmetics_lang")?.value;
    if (v && ["zh", "en"].includes(v)) return v;
  }
  return "zh";
}

// Get the default language for server components
export function getServerLang() {
  if (typeof document !== "undefined") {
    return localStorage.getItem("opencosmetics_lang") || "both";
  }
  return "both"; // SSR default
}
