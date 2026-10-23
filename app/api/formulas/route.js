// /api/formulas — 配方草稿: 列表 / 保存
// 设备维度: header  x-device-id
// GET  -> 列表
// POST -> 保存 (body: { id?, name, lines, product_type, region, note, model })

import { listFormulas, saveFormula } from "../../../lib/formula_store";

function deviceId(request) {
  return request.headers.get("x-device-id") || "anonymous";
}

export async function GET(request) {
  try {
    return Response.json({ ok: true, formulas: listFormulas(deviceId(request)) });
  } catch (e) {
    console.error("[formulas] list error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.lines) || !body.lines.length) {
    return Response.json({ error: "需要 lines 数组 (至少一个成分)" }, { status: 400 });
  }
  try {
    const record = saveFormula(deviceId(request), body);
    return Response.json({ ok: true, formula: record });
  } catch (e) {
    console.error("[formulas] save error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
