// /api/claim — Suggest a starter formula from consumer claim
// POST { claim_id, concerns, population, price_tier, lang } OR GET ?q=...

import { suggestFormulaFromClaim, listClaims } from "../../../lib/claim_to_formula";
import { getLangFromCookies } from "../../../lib/i18n";
import { cookies } from "next/headers";

export async function POST(request) {
  let body;
  let lang = await getLangFromCookies(cookies());
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (body.lang && ["zh", "en"].includes(body.lang)) lang = body.lang;

  const { claim_id, concerns, population, price_tier } = body;
  if (!claim_id && !concerns) {
    return Response.json({
      error: "claim_id or concerns required",
      available_claims: listClaims(),
    }, { status: 400 });
  }

  const result = suggestFormulaFromClaim({ claim_id, concerns, population, price_tier, lang });
  if (!result.found) {
    return Response.json(result, { status: 404 });
  }
  return Response.json(result);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  const q = searchParams.get("q");
  if (q) {
    return POST(new Request(request.url, { method: "POST", body: JSON.stringify({ concerns: q, lang }), headers: { "Content-Type": "application/json" } }));
  }
  return Response.json({
    name: "claim_to_formula",
    name_zh: "目标反推配方",
    description: lang === "en"
      ? "Suggest a starter formula (5 actives + concentrations + vehicle) from consumer claim. For: 'sensitive + repair + ¥300' -> full ingredient brief."
      : "从消费者目标反推配方 (5 个活性 + 浓度 + 基质)。例: '敏感肌修护 ¥300' → 完整配方 brief。",
    method: "POST",
    input: {
      claim_id: "string (one of available_claims.id)",
      concerns: "string (Chinese or English keyword, e.g. '美白', 'whitening')",
      population: "adult|pregnant|child|sensitive",
      price_tier: "drugstore|mid|premium|luxury",
      lang: "'zh' | 'en' (default: from cookie)",
    },
    output: {
      claim: "{ id, name, target_demo }",
      actives: "[{ inci, pct, role_zh }]",
      avoid: "[string] - ingredients to avoid",
      vehicle: "string - recommended vehicle/base",
      notes: "string - formulation notes",
      population_note: "string - special population warnings",
    },
    available_claims: listClaims(),
  });
}
