// /api/risk/check — POST formula review
// Body: { ingredients: string[], context: { population?, region?, ph? }, lang?: string }
//
// Language behavior:
//   lang=zh → 接受中文成分名 (e.g. 视黄醇, 烟酰胺), 内部翻译为 INCI 再匹配规则
//   lang=en → 接受 INCI 名称 (e.g. RETINOL), 直接匹配规则
import { checkFormulaRisk, loadRules } from "../../../../lib/db";
import { t, getLangFromCookies } from "../../../../lib/i18n";
import { translateIngredients } from "../../../../lib/translate";
import { cookies } from "next/headers";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    const lang = await getLangFromCookies(cookies());
    return Response.json({ error: t("api.error.json", lang) }, { status: 400 });
  }

  const cookieLang = await getLangFromCookies(cookies());
  const lang = body.lang || body.context?.lang || cookieLang;
  const ingredients = body.ingredients || [];
  const context = body.context || {};

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Response.json({ error: t("api.error.ingredients", lang) }, { status: 400 });
  }

  // Make sure context.lang is set so checkFormulaRisk can use it
  if (!context.lang) context.lang = lang;
  // Translate Chinese → INCI for zh mode
  const { translated, unknown } = translateIngredients(ingredients, lang);
  context.original_ingredients = ingredients;
  context.translated_ingredients = translated;
  const result = checkFormulaRisk(translated, context);
  const rules = loadRules();

  return Response.json({
    ingredients: result.ingredients,
    context: result.context,
    summary: result.summary,
    block_count: result.block_count,
    warn_count: result.warn_count,
    findings: result.findings,
    rules_metadata: rules?.rule_stats,
    unknown_ingredients: unknown,
    timestamp: new Date().toISOString(),
    lang,
  });
}

export async function GET() {
  const lang = await getLangFromCookies(cookies());
  return Response.json({
    description: lang === "en" ? "POST formula review" : "POST 配方审查",
    body: lang === "en"
      ? { ingredients: ["RETINOL", "AHA", "VITAMIN_C"], context: { population: "adult", region: "CN" } }
      : { ingredients: ["视黄醇", "果酸", "维生素C"], context: { population: "adult", region: "CN" } },
    rules_metadata: loadRules()?.rule_stats,
    lang,
  });
}

