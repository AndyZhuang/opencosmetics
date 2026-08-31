// /api/mcp — MCP-style tool dispatcher
// Routes:
//   POST /api/mcp { tool: "ingredient_query", args: {...}, lang?: "zh"|"en"|"both" }
//   POST /api/mcp { tool: "formula_review", args: {...} }
//   POST /api/mcp { tool: "compliance_check", args: {...} }
//   POST /api/mcp { tool: "synbio_company", args: {...} }
import { query, queryOne, checkFormulaRisk, loadCompanies, loadRules } from "../../../lib/db";
import { cookies } from "next/headers";
import { getLangFromCookies, t } from "../../../lib/i18n";

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
      { tool: "compliance_check", args: { ingredient: "HYDROQUINONE", regions: ["CN", "EU", "US", "JP"] } },
      { tool: "synbio_company", args: { id: "jinbo-bio" } },
    ],
    lang,
  });
}
