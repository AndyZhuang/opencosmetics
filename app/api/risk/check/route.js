// /api/risk/check — POST formula review
// Body: { ingredients: string[], context: { population?, region?, ph? } }
import { checkFormulaRisk, loadRules } from "../../../../lib/db";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const ingredients = body.ingredients || [];
  const context = body.context || {};

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return Response.json({ error: "ingredients: non-empty string[] required" }, { status: 400 });
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
  });
}

export async function GET() {
  return Response.json({
    description: "POST formula review",
    body: { ingredients: ["RETINOL", "AHA", "VITAMIN_C"], context: { population: "adult", region: "CN" } },
    rules_metadata: loadRules()?.rule_stats,
  });
}
