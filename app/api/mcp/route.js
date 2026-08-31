// /api/mcp — MCP-style tool dispatcher
// Routes:
//   POST /api/mcp { tool: "ingredient_query", args: {...} }
//   POST /api/mcp { tool: "formula_review", args: {...} }
//   POST /api/mcp { tool: "compliance_check", args: {...} }
//   POST /api/mcp { tool: "synbio_company", args: {...} }
import { query, queryOne, checkFormulaRisk, loadCompanies, loadRules } from "../../../lib/db";

const TOOLS = {
  ingredient_query: {
    description: "Query ingredient regulatory status across regions (CN/EU/US/INCI)",
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
        // Check EU prohibited
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
    args_schema: { ingredients: "string[]", context: { population: "adult|pregnant|child|sensitive", region: "CN|EU|US|KR|JP|ASEAN" } },
    handler: async ({ ingredients, context = {} }) => {
      return checkFormulaRisk(ingredients, context);
    },
  },
  compliance_check: {
    description: "Multi-region regulatory check for a single ingredient",
    args_schema: { ingredient: "string (INCI or Chinese name)", regions: "string[]" },
    handler: async ({ ingredient, regions = ["CN", "EU", "US", "KR", "JP", "ASEAN"] }) => {
      const rules = loadRules();
      const out = { ingredient, regions: {} };
      for (const r of rules?.rule_categories?.regulatory_region?.rules || []) {
        if (regions.includes(r.region) && r.ingredient === ingredient) {
          out.regions[r.region] = r.status;
        }
      }
      // Also check concentration
      for (const r of rules?.rule_categories?.concentration_limits?.rules || []) {
        if (r.ingredient === ingredient) {
          out.concentration = { max_pct: r.max_pct, leave_on_max_pct: r.leave_on_max_pct, rinse_off_max_pct: r.rinse_off_max_pct };
        }
      }
      // CN IECIC check
      const cnMatch = await queryOne(
        `SELECT 'iecic_i' AS source, chinese_name, inci_name FROM cn_iecic_i WHERE chinese_name = ? OR inci_name = ? LIMIT 1`,
        [ingredient, ingredient]
      );
      out.cn_status = cnMatch ? `IECIC I 收录 (#${cnMatch.seq})` : "未在 IECIC I (可能为禁用/限用/未申报)";
      return out;
    },
  },
  synbio_company: {
    description: "Get synbio cosmetic company metadata + financials (4 listed companies)",
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
    handler: async () => {
      return {
        tools: Object.entries(TOOLS).map(([name, def]) => ({
          name,
          description: def.description,
          args: def.args_schema,
        })),
      };
    },
  },
};

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { tool, args = {} } = body;
  if (!tool) {
    return Response.json({
      error: "tool required",
      available_tools: Object.keys(TOOLS),
    }, { status: 400 });
  }
  const def = TOOLS[tool];
  if (!def) {
    return Response.json({ error: `unknown tool: ${tool}`, available_tools: Object.keys(TOOLS) }, { status: 404 });
  }
  try {
    const result = await def.handler(args);
    return Response.json({ tool, args, result, timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ tool, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    name: "open-cosmetics MCP server",
    version: "0.1.0",
    description: "化妆品法规 + 合成生物 + 风险审查 MCP server",
    transport: "HTTP POST (also available as stdio MCP)",
    usage: "POST { tool: 'list_tools' } to discover, then POST { tool: '<name>', args: {...} }",
    tools: Object.entries(TOOLS).map(([name, def]) => ({
      name,
      description: def.description,
      args: def.args_schema,
    })),
    examples: [
      { tool: "ingredient_query", args: { q: "RETINOL" } },
      { tool: "formula_review", args: { ingredients: ["RETINOL", "AHA", "VITAMIN_C"], context: { population: "pregnant", region: "CN" } } },
      { tool: "compliance_check", args: { ingredient: "HYDROQUINONE", regions: ["CN", "EU", "US", "JP"] } },
      { tool: "synbio_company", args: { id: "jinbo-bio" } },
    ],
  });
}
