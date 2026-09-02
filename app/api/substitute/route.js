// /api/substitute — Find alternatives for a given INCI ingredient
// POST { inci, max_results: 5, lang: "zh"|"en" }
// Returns: { query, group, suggestions: [{ inci_name, tier, price_index, notes, regulatory, concentration }] }

import { findSubstitutes, listGroups } from "../../../lib/substitution";
import { getLangFromCookies } from "../../../lib/i18n";
import { cookies } from "next/headers";

export async function POST(request) {
  let body;
  let lang = await getLangFromCookies(cookies());
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.lang && ["zh", "en"].includes(body.lang)) lang = body.lang;

  const { inci, max_results = 5 } = body;
  if (!inci || typeof inci !== "string" || !inci.trim()) {
    return Response.json({
      error: "inci parameter required (e.g. 'RETINOL', 'NIACINAMIDE')",
      usage: { inci: "string (INCI name)", max_results: "number (default 5)", lang: "'zh' | 'en'" },
      groups: listGroups(),
    }, { status: 400 });
  }

  try {
    const result = await findSubstitutes(inci.trim(), { max_results, lang });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  return Response.json({
    name: "substitute",
    name_zh: "成分替代",
    description: lang === "en"
      ? "Find 3-5 alternative INCI ingredients with same function, regulatory status, and concentration limits."
      : "为给定 INCI 找 3-5 个同功能替代, 含法规 + 浓度信息。",
    method: "POST",
    input: { inci: "string (INCI name)", max_results: "number (default 5)", lang: "'zh' | 'en'" },
    output: {
      query: "echo of input",
      found: "boolean",
      group: "功能分类",
      suggestions: "[{ inci_name, tier, price_index, notes, regulatory: {cn_iecic, eu_banned, eu_restricted}, concentration: {max_pct, ...} }]",
    },
    groups: listGroups(),
    examples: [
      { inci: "RETINOL", lang: "zh" },
      { inci: "HYDROQUINONE", lang: "zh" },
      { inci: "MINERAL OIL", lang: "zh" },
    ],
  });
}
