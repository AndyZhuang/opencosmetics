// /api/risk/check — POST formula review
// Body: { ingredients: string[], context: { population?, region?, ph? }, lang?: string }
import { checkFormulaRisk, loadRules } from "../../../../lib/db";
import { t, getLangFromCookies } from "../../../../lib/i18n";
import { cookies } from "next/headers";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    const lang = await getLangFromCookies(cookies());
    return Response.json({ error: t("api.error.json", lang) }, { status: 400 });
  }

  const lang = body.lang || await getLangFromCookies(cookies());
  const ingredients = body.ingredients || [];
  const context = body.context || {};

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Response.json({ error: t("api.error.ingredients", lang) }, { status: 400 });
  }

  const result = checkFormulaRisk(ingredients, context);
  const rules = loadRules();

  return Response.json({
    ingredients: result.ingredients,
    context: result.context,
    summary: result.summary,
    block_count: result.block_count,
    warn_count: result.warn_count,
    findings: result.findings,
    rules_metadata: rules?.rule_stats,
    timestamp: new Date().toISOString(),
    lang,
  });
}

export async function GET() {
  const lang = await getLangFromCookies(cookies());
  return Response.json({
    description: lang === "en" ? "POST formula review" : "POST 配方审查",
    body: { ingredients: ["RETINOL", "AHA", "VITAMIN_C"], context: { population: "adult", region: "CN" } },
    rules_metadata: loadRules()?.rule_stats,
    lang,
  });
}
