// /api/mcp — MCP-style tool dispatcher
// Routes:
//   POST /api/mcp { tool: "ingredient_query", args: {...}, lang?: "zh"|"en"|"both" }
//   POST /api/mcp { tool: "formula_review", args: {...} }
//   POST /api/mcp { tool: "compliance_check", args: {...} }
//   POST /api/mcp { tool: "synbio_company", args: {...} }
import { query, queryOne, checkFormulaRisk, loadCompanies, loadRules } from "../../../lib/db";
import { cookies } from "next/headers";
import { getLangFromCookies, t } from "../../../lib/i18n";
import { analyzeFormula } from "../../../lib/formula_analyzer";
import { findSubstitutes, listGroups } from "../../../lib/substitution";
import { suggestFormulaFromClaim, listClaims } from "../../../lib/claim_to_formula";
import { listReferenceFormulas, getReferenceFormula, searchReferenceFormulas } from "../../../lib/reference_formulas";

const TOOLS = {
  ingredient_query: {
    description: "Query ingredient regulatory status across regions (CN/EU/US/INCI)",
    description_zh: "跨源查询成分监管状态 (中国 NMPA IECIC + EU CosIng + EU Annex II 禁用)",
    args_schema: { q: "string (Chinese name or INCI)", source: "iecic_i|cosing|all (default: all)" },
    handler: async ({ q, source = "all" }) => {
      const results = {};
      if (source === "all" || source === "iecic_i") {
        results.cn_iecic_i = await query(
          `SELECT seq, chinese_name, inci_name, note FROM cn_iecic_i WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 10`,
          [`%${q}%`, `%${q}%`]
        );
        results.cn_iecic_ii = await query(
          `SELECT seq, chinese_name, inci_name FROM cn_iecic_ii WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 10`,
          [`%${q}%`, `%${q}%`]
        );
      }
      if (source === "all" || source === "cosing") {
        results.eu_cosing = await query(
          `SELECT inci_name, function, inn_name AS inn FROM cosing WHERE inci_name ILIKE ? LIMIT 10`,
          [`%${q}%`]
        );
        results.eu_prohibited = await query(
          `SELECT "Chemical name / INN" AS name, "Reference Number" AS ref FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE LOWER(?) LIMIT 5`,
          [`%${q}%`]
        );
      }
      return { query: q, ...results };
    },
  },
  formula_review: {
    description: "Check formula against 65 rules (compatibility/pH/concentration/special population)",
    description_zh: "65 规则审查 (兼容性 / pH / 浓度 / 特殊人群)",
    args_schema: { ingredients: "string[]", context: { population: "adult|pregnant|child|sensitive", region: "CN|EU|US|KR|JP|ASEAN" } },
    handler: async ({ ingredients, context = {} }) => {
      return checkFormulaRisk(ingredients, context);
    },
  },
  formula_analyze: {
    description: "Reverse-engineer a cosmetic formula from INCI text. Returns formula type, top 3 actives, vehicle, 65-rule risk scan, EU/CN regulatory status, price tier, target demographic, and improvement suggestions. Optimized for LLM agent consumption (structured JSON).",
    description_zh: "从 INCI 文本反向分析配方。返回配方类型、Top 3 活性物、基质、65 规则风险扫描、EU/CN 法规状态、价位、目标人群、改进建议。结构化 JSON, 适合 LLM agent 调用。",
    args_schema: {
      ingredients: "string — INCI list, comma/newline separated (e.g. 'AQUA, GLYCERIN, NIACINAMIDE, SQUALANE')",
      context: "{ population: 'adult|pregnant|child|sensitive', region: 'CN|EU|US|KR|JP|ASEAN' } (optional)",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    handler: async ({ ingredients, context = {}, lang = "zh" }) => {
      return await analyzeFormula(ingredients, { context, lang });
    },
  },
  substitute_ingredient: {
    description: "Find 3-5 alternative INCI ingredients with same function. Returns regulatory status (CN IECIC + EU Annex II/III), concentration limits, price tier, and notes for each alternative. Use when a key active is banned, too expensive, or unavailable for target market.",
    description_zh: "为给定 INCI 找 3-5 个同功能替代, 含法规 + 浓度信息。用于: 某成分被禁/太贵/不可用, 需要替代方案。",
    args_schema: {
      inci: "string (INCI name, e.g. 'RETINOL', 'HYDROQUINONE', 'NIACINAMIDE')",
      max_results: "number (default 5)",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    handler: async ({ inci, max_results = 5, lang = "zh" }) => {
      return await findSubstitutes(inci, { max_results, lang });
    },
  },
  claim_to_formula: {
    description: "Suggest a starter formula (5 actives + concentrations + vehicle) from consumer claim. Use when brief is 'I want to make a [sensitive/whitening/anti-aging] [product type] for [demographic] at [price tier]'. Returns ready-to-formulate ingredient brief.",
    description_zh: "从消费者目标反推配方 (5 个活性 + 浓度 + 基质)。brief 例子: '我想做一个敏感肌修护 ¥300 的精华' → 完整可调配方 brief。",
    args_schema: {
      claim_id: "string (one of available_claims.id, e.g. 'sensitive_repair', 'whitening_brightening')",
      concerns: "string (Chinese/English keyword, alternative to claim_id)",
      population: "adult|pregnant|child|sensitive",
      price_tier: "drugstore|mid|premium|luxury",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    handler: async ({ claim_id, concerns, population, price_tier, lang = "zh" }) => {
      return suggestFormulaFromClaim({ claim_id, concerns, population, price_tier, lang });
    },
  },
  reference_formulas: {
    description: "Search 20 curated classic commercial formulas by INCI/brand/category. Use for: 'show me niacinamide serums under $20' or 'The Ordinary formulas' or 'best ceramide creams'. Returns INCI + key actives + notes for each.",
    description_zh: "搜索 20 经典商业配方 (按 INCI/品牌/类别)。例: '找含烟酰胺的精华' / 'The Ordinary 配方' / '最好的神经酰胺面霜'。返回 INCI + 关键活性 + 配方要点。",
    args_schema: {
      q: "string (search keyword: INCI/brand/category, e.g. 'NIACINAMIDE', 'The Ordinary', 'ceramide', 'serum')",
      id: "string (specific formula id, e.g. 'the_ordinary_niacinamide_10_zinc_1')",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    handler: async ({ q, id, lang = "zh" }) => {
      if (id) return getReferenceFormula(id);
      const found = searchReferenceFormulas(q);
      return { count: found.length, formulas: found };
    },
  },
  compliance_check: {
    description: "Multi-region regulatory check for a single ingredient (CN/EU/US/KR/JP/ASEAN)",
    description_zh: "多地区合规扫描 (中国/欧盟/美国/韩国/日本/东盟)",
    args_schema: { ingredient: "string (INCI or Chinese name)", regions: "string[]" },
    handler: async ({ ingredient, regions = ["CN", "EU", "US", "KR", "JP", "ASEAN"] }) => {
      const rules = loadRules();
      const out = { ingredient, regions: {} };
      for (const r of rules?.rule_categories?.regulatory_region?.rules || []) {
        if (regions.includes(r.region) && r.ingredient === ingredient) {
          out.regions[r.region] = r.status;
        }
      }
      for (const r of rules?.rule_categories?.concentration_limits?.rules || []) {
        if (r.ingredient === ingredient) {
          out.concentration = { max_pct: r.max_pct, leave_on_max_pct: r.leave_on_max_pct, rinse_off_max_pct: r.rinse_off_max_pct };
        }
      }
      const cnMatch = await queryOne(
        `SELECT 'iecic_i' AS source, chinese_name, inci_name FROM cn_iecic_i WHERE chinese_name = ? OR inci_name = ? LIMIT 1`,
        [ingredient, ingredient]
      );
      out.cn_status = cnMatch ? `IECIC I 收录 (#${cnMatch.seq})` : "未在 IECIC I (可能为禁用/限用/未申报)";
      return out;
    },
  },
  synbio_company: {
    description: "Get synbio cosmetic company metadata + financials (4 listed companies: 巨子/锦波/华熙/创健)",
    description_zh: "4 合成生物美妆原料上市公司 (巨子/锦波/华熙/创健) 财务+技术+产品+监管",
    args_schema: { id: "string (juzi-bio|jinbo-bio|huaxi-bio|chuangjian)" },
    handler: async ({ id }) => {
      const data = loadCompanies();
      if (!data) return { error: "companies.json not loaded" };
      if (id) {
        return { company: data.companies.find(c => c.id === id) };
      }
      return { count: data.companies.length, companies: data.companies, market: data.market_sizing };
    },
  },
  list_tools: {
    description: "List all available MCP tools",
    description_zh: "列出所有 MCP 工具",
    handler: async () => {
      return {
        tools: Object.entries(TOOLS).map(([name, def]) => ({
          name,
          description: def.description,
          description_zh: def.description_zh,
          args: def.args_schema,
        })),
      };
    },
  },
};

export async function POST(request) {
  let body;
  let lang = await getLangFromCookies(cookies());
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: t("api.error.json", lang) }, { status: 400 });
  }
  // body.lang overrides cookie/default
  if (body.lang && ["zh", "en", "both"].includes(body.lang)) lang = body.lang;
  const { tool, args = {} } = body;
  if (!tool) {
    return Response.json({
      error: t("api.error.tool_required", lang),
      available_tools: Object.keys(TOOLS),
    }, { status: 400 });
  }
  const def = TOOLS[tool];
  if (!def) {
    return Response.json({
      error: `${t("api.error.unknown_tool", lang)} ${tool}`,
      available_tools: Object.keys(TOOLS),
    }, { status: 404 });
  }
  try {
    const result = await def.handler(args);
    return Response.json({ tool, args, result, lang, timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ tool, error: e.message, lang }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  return Response.json({
    name: "open-cosmetics MCP server",
    name_zh: "开放美妆数据 MCP server",
    version: "0.2.0",
    description: t("mcp.desc", lang),
    transport: t("mcp.transport", lang),
    usage: t("mcp.usage", lang),
    lang_support: ["zh", "en", "both"],
    tools: Object.entries(TOOLS).map(([name, def]) => ({
      name,
      description: lang === "en" ? def.description : (def.description_zh || def.description),
      args: def.args_schema,
    })),
    examples: [
      { tool: "ingredient_query", args: { q: "RETINOL" } },
      { tool: "formula_review", args: { ingredients: ["RETINOL", "AHA", "VITAMIN_C"], context: { population: "pregnant", region: "CN" } } },
      { tool: "formula_analyze", args: { ingredients: "AQUA, GLYCERIN, NIACINAMIDE, BIFIDA FERMENT LYSATE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL", lang: "zh" } },
      { tool: "substitute_ingredient", args: { inci: "RETINOL", lang: "zh" } },
      { tool: "claim_to_formula", args: { concerns: "敏感肌修护", price_tier: "mid", lang: "zh" } },
      { tool: "compliance_check", args: { ingredient: "HYDROQUINONE", regions: ["CN", "EU", "US", "JP"] } },
      { tool: "synbio_company", args: { id: "jinbo-bio" } },
    ],
    lang,
  });
}
