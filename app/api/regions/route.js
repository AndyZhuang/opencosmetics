// /api/regions — multi-region regulatory check
// GET /api/regions?ingredient=HYDROQUINONE
// GET /api/regions?ingredient=RETINOL&regions=CN,EU
// Bilingual: ?lang=zh|en|both
import { query, queryOne, loadRules } from "../../../lib/db";
import { t, getLangFromCookies } from "../../../lib/i18n";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ingredient = (searchParams.get("ingredient") || "").trim();
  const regionsParam = searchParams.get("regions") || "CN,EU,US,KR,JP,ASEAN";
  const regions = regionsParam.split(",").map(s => s.trim().toUpperCase());
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());

  if (!ingredient) {
    return Response.json({ error: t("api.error.ingredient_req", lang) }, { status: 400 });
  }

  const out = { ingredient, regions: {} };
  const rules = loadRules();
  const ingredientUpper = ingredient.toUpperCase();

  // Regulatory region rules
  for (const r of rules?.rule_categories?.regulatory_region?.rules || []) {
    if (!regions.includes(r.region)) continue;
    if (r.ingredient?.toUpperCase() === ingredientUpper) {
      out.regions[r.region] = {
        status: r.status,
        max_pct: r.max_pct,
        notes: r.status,
      };
    }
  }

  // Concentration
  for (const r of rules?.rule_categories?.concentration_limits?.rules || []) {
    if (r.ingredient?.toUpperCase() === ingredientUpper) {
      out.concentration = {
        leave_on_max_pct: r.leave_on_max_pct,
        rinse_off_max_pct: r.rinse_off_max_pct,
        max_pct: r.max_pct,
        source: r.source,
        note: r.note,
      };
    }
  }

  // CN IECIC check
  const cn = await queryOne(
    `SELECT seq, chinese_name, inci_name FROM cn_iecic_i WHERE chinese_name ILIKE ? OR inci_name ILIKE ? LIMIT 1`,
    [ingredient, ingredient]
  );
  if (cn) {
    out.cn_iecic = { status: lang === "en" ? "Listed (existing)" : "已使用 (收录)", seq: cn.seq, chinese_name: cn.chinese_name, inci_name: cn.inci_name };
  } else {
    out.cn_iecic = { status: lang === "en" ? "Not in IECIC I (may be banned/restricted/unfiled)" : "未在 IECIC I (可能禁用/限用/未申报)" };
  }

  // EU CosIng
  const eu = await queryOne(
    `SELECT inci_name, function FROM cosing WHERE inci_name ILIKE ? LIMIT 1`,
    [ingredient]
  );
  if (eu) {
    out.eu_cosing = { status: lang === "en" ? "Listed" : "已收录", inci_name: eu.inci_name, function: eu.function };
  }

  // EU Annex II check
  const euBanned = await queryOne(
    `SELECT "Reference Number" AS ref FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE LOWER(?) LIMIT 1`,
    [ingredient]
  );
  if (euBanned) {
    out.eu_annex_ii = { status: lang === "en" ? "Banned" : "禁用", ref: euBanned.ref };
  }

  out.lang = lang;
  return Response.json(out);
}
