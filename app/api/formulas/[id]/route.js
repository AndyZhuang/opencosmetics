// /api/formulas/[id] — 单个配方: 读取 / 更新 / 删除
import { getFormula, saveFormula, deleteFormula } from "../../../../lib/formula_store";

function deviceId(request) {
  return request.headers.get("x-device-id") || "anonymous";
}

export async function GET(request, { params }) {
  const { id } = await params;
  const f = getFormula(deviceId(request), id);
  if (!f) return Response.json({ error: "配方不存在 / Formula not found" }, { status: 404 });
  return Response.json({ ok: true, formula: f });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  const existing = getFormula(deviceId(request), id);
  if (!existing) return Response.json({ error: "配方不存在 / Formula not found" }, { status: 404 });
  const record = saveFormula(deviceId(request), { ...existing, ...body, id });
  return Response.json({ ok: true, formula: record });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const ok = deleteFormula(deviceId(request), id);
  if (!ok) return Response.json({ error: "配方不存在 / Formula not found" }, { status: 404 });
  return Response.json({ ok: true, deleted: id });
}
