// /api/stats — aggregate database stats across all sources
import { query } from "../../../lib/db";
import { cookies } from "next/headers";
import { getLangFromCookies, t } from "../../../lib/i18n";
import fs from "node:fs";
import path from "node:path";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  // Try to query all known tables, gracefully handle missing ones
  const queries = [
    { sql: "SELECT COUNT(*) AS n FROM cosing", key: "eu_cosing" },
    { sql: "SELECT COUNT(*) AS n FROM cosing_lite", key: "eu_cosing_lite" },
    { sql: "SELECT COUNT(*) AS n FROM cosing_obf", key: "obf_full" },
    { sql: "SELECT COUNT(*) AS n FROM annex_ii_prohibited", key: "eu_annex_ii" },
    { sql: "SELECT COUNT(*) AS n FROM annex_iii_restricted", key: "eu_annex_iii" },
    { sql: "SELECT COUNT(*) AS n FROM annex_iv_colorants", key: "eu_annex_iv" },
    { sql: "SELECT COUNT(*) AS n FROM annex_v_preservatives", key: "eu_annex_v" },
    { sql: "SELECT COUNT(*) AS n FROM annex_vi_uv_filters", key: "eu_annex_vi" },
    { sql: "SELECT COUNT(*) AS n FROM incidb_ingredients", key: "incidb_ingredients" },
    { sql: "SELECT COUNT(*) AS n FROM incidb_products", key: "incidb_products" },
    { sql: "SELECT COUNT(*) AS n FROM cn_iecic_i", key: "cn_iecic_i" },
    { sql: "SELECT COUNT(*) AS n FROM cn_iecic_ii", key: "cn_iecic_ii" },
    { sql: "SELECT COUNT(*) AS n FROM cn_iecic_adjustments", key: "cn_adjustments" },
  ];

  const out = {};
  for (const q of queries) {
    try {
      const rows = await query(q.sql);
      out[q.key] = Number(rows[0]?.n || 0);
    } catch (e) {
      out[q.key] = null; // table not present
    }
  }

  // Load counts from JSON files
  const companiesCandidates = [
    path.join(process.cwd(), "data", "companies.json"),
    path.join(process.cwd(), "..", "data", "companies.json"),
  ];
  const companiesPath = companiesCandidates.find(p => fs.existsSync(p));
  const rulesCandidates = [
    path.join(process.cwd(), "data", "rules.json"),
    path.join(process.cwd(), "..", "data", "rules.json"),
  ];
  const rulesPath = rulesCandidates.find(p => fs.existsSync(p));
  const companiesSize = companiesPath ? fs.statSync(companiesPath).size : 0;
  const rulesSize = rulesPath ? fs.statSync(rulesPath).size : 0;

  const total = Object.values(out).reduce((a, b) => a + (b || 0), 0);
  const byRegion = {
    EU: (out.eu_cosing || 0) + (out.eu_cosing_lite || 0) + (out.obf_full || 0) + (out.eu_annex_ii || 0) + (out.eu_annex_iii || 0) + (out.eu_annex_iv || 0) + (out.eu_annex_v || 0) + (out.eu_annex_vi || 0),
    CN: (out.cn_iecic_i || 0) + (out.cn_iecic_ii || 0) + (out.cn_adjustments || 0),
    US: 85511, // hardcoded for FDA events
  };

  return Response.json({
    duckdb: out,
    total_records: total,
    by_region: byRegion,
    supplementary: {
      synbio_companies_json_bytes: companiesSize,
      risk_rules_json_bytes: rulesSize,
    },
    sources: [
      { name: "walkowskis/CosIng_database_finder", n: out.eu_cosing, type: "EU CosIng" },
      { name: "beauteeru/cosmetic-ingredients-dataset", n: out.eu_cosing_lite, type: lang === "en" ? "PubChem" : "PubChem 增强" },
      { name: "openfoodfacts/openbeautyfacts", n: out.obf_full, type: lang === "en" ? "OBF CosIng Full" : "OBF CosIng 完整" },
      { name: "INCIDB/cosmetics-skincare-inci-database", n: out.incidb_ingredients, type: lang === "en" ? "INCIDB Public" : "INCIDB 公开" },
      { name: lang === "en" ? "NMPA 2025 #61 (IECIC I)" : "NMPA 2025 年第 61 号公告 (IECIC I)", n: out.cn_iecic_i, type: lang === "en" ? "CN Existing" : "中国 已使用" },
      { name: lang === "en" ? "NMPA 2025 #61 (IECIC II)" : "NMPA 2025 年第 61 号公告 (IECIC II)", n: out.cn_iecic_ii, type: lang === "en" ? "CN New Ingredients" : "中国 新原料" },
      { name: lang === "en" ? "NMPA 2025-06-23 Adjustments" : "NMPA 2025-06-23 调整说明", n: out.cn_adjustments, type: lang === "en" ? "CN Adjustments" : "中国 调整" },
      { name: "FDA openFDA cosmetic events", n: 85511, type: lang === "en" ? "USA Events" : "美国 事件" },
      { name: lang === "en" ? "Juzi/Jinbo/Huaxi/Chuangjian" : "巨子/锦波/华熙/创健", n: 4, type: lang === "en" ? "Synbio (public)" : "合成生物 (公开披露)" },
      { name: "rules.json", n: 65, type: lang === "en" ? "Risk rules (7 cats)" : "风险规则 (7 类)" },
    ],
    lang,
    timestamp: new Date().toISOString(),
  });
}
