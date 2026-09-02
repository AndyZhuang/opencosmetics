// /api/formula/analyze — Reverse-engineer a cosmetic formula from INCI list
// POST { ingredients: "text", context: { population, region }, lang: "zh"|"en" }
// Returns: full analysis JSON (formula type, top actives, risk, regulatory, price tier)

import { analyzeFormula } from "../../../../lib/formula_analyzer";
import { getLangFromCookies } from "../../../../lib/i18n";
import { cookies } from "next/headers";

export async function POST(request) {
  let body;
  let lang = await getLangFromCookies(cookies());
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  // body.lang overrides cookie/default
  if (body.lang && ["zh", "en"].includes(body.lang)) lang = body.lang;

  const { ingredients, context = {} } = body;
  if (!ingredients || typeof ingredients !== "string" || !ingredients.trim()) {
    return Response.json({
      error: "需要 ingredients 字段 (粘贴 INCI 文本)",
      usage_zh: 'POST { "ingredients": "AQUA, GLYCERIN, NIACINAMIDE, ...", "lang": "zh" }',
      usage_en: 'POST { "ingredients": "AQUA, GLYCERIN, NIACINAMIDE, ...", "lang": "en" }',
    }, { status: 400 });
  }

  try {
    const result = await analyzeFormula(ingredients, { context, lang });
    if (result.error) {
      return Response.json(result, { status: 400 });
    }
    return Response.json(result);
  } catch (e) {
    console.error("[formula/analyze] error:", e);
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

// GET for API discovery
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  return Response.json({
    name: "formula_analyze",
    name_zh: "配方反向工程",
    version: "0.1.0",
    description: lang === "en"
      ? "Reverse-engineer a cosmetic formula from INCI list. Returns formula type, top actives, vehicle, risk, regulatory, price tier, target demographic."
      : "从 INCI 列表反向分析配方。返回配方类型、Top 活性、基质、风险、法规、价位、目标人群。",
    method: "POST",
    input: {
      ingredients: "string (INCI list, comma/newline separated)",
      context: "{ population: 'adult|pregnant|child|sensitive', region: 'CN|EU|US|KR|JP|ASEAN' } (optional)",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    output: {
      type: "string[] — formula type candidates",
      type_zh: "string — formula type in Chinese",
      actives: "{ total_count, top3, categories[] }",
      vehicle: "{ primary, humectants[], emollients[], preservatives[] }",
      target_demographic: "{ primary, concern, region }",
      price_tier: "{ tier, price_range_cny, score }",
      risk_summary: "{ summary, block_count, warn_count, top_findings[] }",
      ingredients: "[{ position, inci_name, chinese_name, function, eu_status, cn_status, ... }]",
      suggestions: "[]",
    },
    example: {
      request: {
        ingredients: "AQUA, GLYCERIN, NIACINAMIDE, BIFIDA FERMENT LYSATE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL",
        lang: "zh",
        context: { population: "sensitive", region: "CN" },
      },
      request_curl: `curl -X POST http://localhost:3000/api/formula/analyze -H "Content-Type: application/json" -d '{"ingredients":"AQUA, GLYCERIN, NIACINAMIDE, BIFIDA FERMENT LYSATE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL","lang":"zh"}'`,
    },
    lang,
  });
}
