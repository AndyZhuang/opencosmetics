// /api/reference — Curated reference formulas library
// GET ?q=NIACINAMIDE&category=serum&price_tier=drugstore

import { listReferenceFormulas, getReferenceFormula, searchReferenceFormulas } from "../../../lib/reference_formulas";
import { getLangFromCookies } from "../../../lib/i18n";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  const q = searchParams.get("q");
  const id = searchParams.get("id");

  if (id) {
    const f = getReferenceFormula(id);
    if (!f) return Response.json({ error: "Not found", id }, { status: 404 });
    return Response.json({ formula: f, lang });
  }

  if (q) {
    const found = searchReferenceFormulas(q);
    return Response.json({ query: q, count: found.length, formulas: found, lang });
  }

  return Response.json({
    count: listReferenceFormulas().length,
    formulas: listReferenceFormulas(),
    categories: ["精华液 / Serum", "面霜 / Cream", "精华水 / Toner", "防晒霜 / Sunscreen", "卸妆水 / Micellar", "修护霜 / Repair Balm", "爽肤水 / Toning Solution"],
    price_tiers: ["drugstore", "mid", "premium", "luxury"],
    brands: ["The Ordinary", "CeraVe", "SK-II", "Skinceuticals", "La Roche-Posay", "Drunk Elephant", "Paula's Choice", "Sunday Riley", "Estée Lauder", "Bioderma", "Vichy", "La Mer"],
    description: lang === "en"
      ? "20 curated reference formulas from public INCI disclosures. For formulator learning: see what 'good' commercial products look like and use as starting points for similar new formulas."
      : "20 经典商业配方公开 INCI 数据库。为配方师学习: 看 '做得好' 的产品长什么样, 作为类似新配方的起点。",
    lang,
  });
}
