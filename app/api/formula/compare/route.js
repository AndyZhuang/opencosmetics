// /api/formula/compare — 两版配方对比 (成分差异 + 成本差异)
// POST { a: { lines, model? }, b: { lines, model? } }

import { compareFormulas } from "../../../../lib/cost_engine";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  const a = body.a || {};
  const b = body.b || {};
  if (!Array.isArray(a.lines) || !Array.isArray(b.lines)) {
    return Response.json({ error: "需要 a.lines 与 b.lines 数组" }, { status: 400 });
  }
  try {
    return Response.json({ ok: true, ...compareFormulas(a, b) });
  } catch (e) {
    console.error("[formula/compare] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
