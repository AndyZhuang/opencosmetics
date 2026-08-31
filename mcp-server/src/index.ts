#!/usr/bin/env node
/**
 * Open Cosmetics MCP server (stdio transport).
 *
 * Tools exposed:
 *   - ingredient_query(q: string)          CN/EU/INCI cross-reference
 *   - formula_review(ingredients[], ctx)    65-rule compatibility check
 *   - compliance_check(ingredient, regions) Multi-region regulatory
 *   - synbio_company(id?)                   4 listed synbio companies
 *
 * Usage with Claude Desktop:
 *   Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
 *   {
 *     "mcpServers": {
 *       "opencosmetics": {
 *         "command": "node",
 *         "args": ["/path/to/mcp-server/dist/index.js"]
 *       }
 *     }
 *   }
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DuckDBInstance } from "@duckdb/node-api";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ──── DuckDB singleton ──────────────────────────────────
let _conn: any = null;
async function db() {
  if (_conn) return _conn;
  const dbPath = path.resolve(__dirname, "..", "..", "data", "bebd.duckdb");
  if (!fs.existsSync(dbPath)) {
    throw new Error(`DuckDB not found at ${dbPath}`);
  }
  const inst = await DuckDBInstance.create(dbPath);
  _conn = await inst.connect();
  return _conn;
}

async function query(sql: string, params: any[] = []) {
  const conn = await db();
  const stmt = await conn.prepare(sql);
  try {
    if (params.length) await (stmt as any).bind(params);
    const reader = await (stmt as any).runAndReadAll();
    const rows = reader.getRows();
    const cols = reader.columnNames();
    return rows.map((r: any[]) => Object.fromEntries(cols.map((c: string, i: number) => [c, r[i]])));
  } finally {
    if (typeof (stmt as any).dispose === "function") await (stmt as any).dispose();
    else if (typeof (stmt as any).release === "function") await (stmt as any).release();
  }
}

// ──── Risk engine (matches lib/db.js checkFormulaRisk) ───
interface RuleSet {
  rule_categories: {
    compatibility: { rules: any[] };
    special_populations: { rules: any[] };
    concentration_limits: { rules: any[] };
    regulatory_region: { rules: any[] };
  };
}

let _rules: RuleSet | null = null;
function loadRules(): RuleSet | null {
  if (_rules) return _rules;
  const fp = path.resolve(__dirname, "..", "..", "data", "rules.json");
  if (!fs.existsSync(fp)) return null;
  _rules = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return _rules;
}

function checkFormulaRisk(ingredients: string[], context: any = {}) {
  const rules = loadRules();
  if (!rules) return { error: "rules.json not loaded" };
  const ingSet = new Set(ingredients.map((i) => (i || "").toUpperCase().trim()));
  const findings: any[] = [];
  for (const r of rules.rule_categories.compatibility.rules) {
    const overlap = r.ingredients.filter((i: string) => ingSet.has(i.toUpperCase()));
    if (overlap.length >= 2) {
      findings.push({ category: "compatibility", ...r, matched: overlap });
    }
  }
  const pop = context.population || "adult";
  for (const r of rules.rule_categories.special_populations.rules) {
    if (r.context && !r.context.includes(pop)) continue;
    const matched = r.ingredients ? r.ingredients.filter((i: string) => ingSet.has(i.toUpperCase())) : [];
    if (matched.length > 0) {
      findings.push({ category: "special_population", ...r, matched });
    }
  }
  for (const r of rules.rule_categories.concentration_limits.rules) {
    if (ingSet.has(r.ingredient.toUpperCase())) {
      findings.push({ category: "concentration", ...r, matched: [r.ingredient] });
    }
  }
  const block = findings.filter((f) => f.severity === "block").length;
  const warn = findings.filter((f) => f.severity === "warn").length;
  return {
    ingredients: [...ingSet],
    context,
    block_count: block,
    warn_count: warn,
    findings,
    summary: block > 0 ? "REJECT" : warn > 0 ? "REVIEW" : "PASS",
  };
}

let _companies: any = null;
function loadCompanies() {
  if (_companies) return _companies;
  const fp = path.resolve(__dirname, "..", "..", "data", "companies.json");
  if (!fs.existsSync(fp)) return null;
  _companies = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return _companies;
}

// ──── Tool implementations ──────────────────────────────
async function ingredientQuery(q: string) {
  const cnI = await query(
    `SELECT seq, chinese_name, inci_name, note FROM cn_iecic_i WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 10`,
    [`%${q}%`, `%${q}%`]
  );
  const cnII = await query(
    `SELECT seq, chinese_name, inci_name FROM cn_iecic_ii WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 10`,
    [`%${q}%`, `%${q}%`]
  );
  const euCosIng = await query(
    `SELECT inci_name, function FROM cosing WHERE inci_name ILIKE ? LIMIT 10`,
    [`%${q}%`]
  );
  const euBanned = await query(
    `SELECT "Chemical name / INN" AS name, "Reference Number" AS ref FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE LOWER(?) LIMIT 5`,
    [`%${q}%`]
  );
  return { query: q, cn_iecic_i: cnI, cn_iecic_ii: cnII, eu_cosing: euCosIng, eu_annex_ii: euBanned };
}

async function formulaReview(ingredients: string[], context: any) {
  return checkFormulaRisk(ingredients, context || {});
}

async function complianceCheck(ingredient: string, regions: string[]) {
  const rules = loadRules();
  const ingredientUpper = ingredient.toUpperCase();
  const out: any = { ingredient, regions: {}, concentration: null, cn_iecic: null, eu_cosing: null, eu_annex_ii: null };
  for (const r of rules?.rule_categories?.regulatory_region?.rules || []) {
    if (regions.includes(r.region) && r.ingredient?.toUpperCase() === ingredientUpper) {
      out.regions[r.region] = { status: r.status, max_pct: r.max_pct };
    }
  }
  for (const r of rules?.rule_categories?.concentration_limits?.rules || []) {
    if (r.ingredient?.toUpperCase() === ingredientUpper) {
      out.concentration = { max_pct: r.max_pct, leave_on_max_pct: r.leave_on_max_pct, rinse_off_max_pct: r.rinse_off_max_pct };
    }
  }
  const cn = await query(
    `SELECT seq, chinese_name, inci_name FROM cn_iecic_i WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 1`,
    [ingredient, ingredient]
  );
  out.cn_iecic = cn.length > 0 ? { status: "已使用 (收录)", ...cn[0] } : { status: "未在 IECIC I (可能禁用/限用/未申报)" };
  const eu = await query(
    `SELECT inci_name, function FROM cosing WHERE inci_name ILIKE ? LIMIT 1`,
    [ingredient]
  );
  out.eu_cosing = eu.length > 0 ? { status: "已收录", ...eu[0] } : null;
  const euBan = await query(
    `SELECT "Reference Number" AS ref FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE LOWER(?) LIMIT 1`,
    [ingredient]
  );
  out.eu_annex_ii = euBan.length > 0 ? { status: "禁用", ref: euBan[0].ref } : null;
  return out;
}

function synbioCompany(id?: string) {
  const data = loadCompanies();
  if (!data) return { error: "companies.json not loaded" };
  if (id) {
    return { company: data.companies.find((c: any) => c.id === id) };
  }
  return { count: data.companies.length, market: data.market_sizing, companies: data.companies };
}

// ──── MCP server setup ───────────────────────────────
const server = new Server(
  { name: "opencosmetics-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "ingredient_query",
      description: "Query ingredient across CN (IECIC) + EU (CosIng + Annex II) regulatory sources.",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Chinese name or INCI name" },
        },
        required: ["q"],
      },
    },
    {
      name: "formula_review",
      description: "Check a formula against 65 rules (compatibility/pH/concentration/special population).",
      inputSchema: {
        type: "object",
        properties: {
          ingredients: { type: "array", items: { type: "string" }, description: "INCI names" },
          context: {
            type: "object",
            properties: {
              population: { type: "string", enum: ["adult", "pregnant", "child", "sensitive"] },
              region: { type: "string", enum: ["CN", "EU", "US", "KR", "JP", "ASEAN"] },
            },
          },
        },
        required: ["ingredients"],
      },
    },
    {
      name: "compliance_check",
      description: "Multi-region regulatory check for a single ingredient.",
      inputSchema: {
        type: "object",
        properties: {
          ingredient: { type: "string" },
          regions: { type: "array", items: { type: "string" }, description: "Default: CN,EU,US,KR,JP,ASEAN" },
        },
        required: ["ingredient"],
      },
    },
    {
      name: "synbio_company",
      description: "Get synthetic-biology cosmetic company metadata (4 listed companies: 巨子/锦波/华熙/创健).",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", enum: ["juzi-bio", "jinbo-bio", "huaxi-bio", "chuangjian"] } },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let result: any;
    if (name === "ingredient_query") result = await ingredientQuery((args as any).q);
    else if (name === "formula_review") result = await formulaReview((args as any).ingredients, (args as any).context);
    else if (name === "compliance_check") result = await complianceCheck((args as any).ingredient, (args as any).regions || ["CN", "EU", "US", "KR", "JP", "ASEAN"]);
    else if (name === "synbio_company") result = synbioCompany((args as any)?.id);
    else return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e: any) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[opencosmetics-mcp] running on stdio");
}

main().catch((e) => {
  console.error("[opencosmetics-mcp] fatal:", e);
  process.exit(1);
});
