// /api/formula/export — 配方导出 (csv / md / html)
// POST { format: "csv"|"md"|"html", name, lines, cost? }

import { exportFormula } from "../../../../lib/formula_store";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  const format = String(body.format || "csv").toLowerCase();
  if (!["csv", "md", "html"].includes(format)) {
    return Response.json({ error: "format 必须是 csv | md | html" }, { status: 400 });
  }
  if (!Array.isArray(body.lines) || !body.lines.length) {
    return Response.json({ error: "需要 lines 数组" }, { status: 400 });
  }
  try {
    const out = exportFormula(format, body);
    return new Response(out.body, {
      headers: {
        "Content-Type": out.contentType,
        "Content-Disposition": `attachment; filename="${out.filename}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("[formula/export] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
