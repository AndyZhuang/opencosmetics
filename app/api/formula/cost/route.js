// /api/formula/cost — 配方成本估算
// POST { lines: [{ inci_name, pct }], model?: { batch_kg, net_content_g, gross_margin, ... } }

import { calculateCost, scaffoldFormula, DEFAULT_COST_MODEL } from "../../../../lib/cost_engine";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    return Response.json(
      { error: "需要 lines 数组", usage: 'POST { "lines": [{ "inci_name": "AQUA", "pct": 70 }] }' },
      { status: 400 }
    );
  }

  try {
    const cost = calculateCost(lines, body.model || {});
    return Response.json({ ok: true, ...cost, defaults: DEFAULT_COST_MODEL });
  } catch (e) {
    console.error("[formula/cost] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const incis = (searchParams.get("ingredients") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!incis.length) {
    return Response.json({ error: "需要 ?ingredients=AQUA,GLYCERIN", defaults: DEFAULT_COST_MODEL }, { status: 400 });
  }
  const cost = calculateCost(incis.map((n) => ({ inci_name: n, pct: 1 })), {});
  return Response.json({ ok: true, ...cost, defaults: DEFAULT_COST_MODEL });
}
