// lib/formula_store.js — 配方草稿持久化 (file-backed JSON store)
// 设备维度命名空间:  header x-device-id
// 用途: 配方构建器的保存 / 列表 / 版本对比 / 导出

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { readJsonSafe } from "./json_io";

let _cache = null;
let _cacheMtime = 0;

function storeDir() {
  const candidates = [
    path.join(process.cwd(), "data", "saved_formulas"),
    path.join(process.cwd(), "..", "data", "saved_formulas"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const dir = candidates[0];
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileFor(deviceId) {
  const id = String(deviceId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "anonymous";
  return path.join(storeDir(), `${id}.json`);
}

function readStore(deviceId) {
  const fp = fileFor(deviceId);
  if (!fs.existsSync(fp)) return { formulas: [] };
  try {
    const stat = fs.statSync(fp);
    if (_cache && _cacheMtime === stat.mtimeMs && _cache.__file === fp) return _cache;
    const raw = readJsonSafe(fp) || { formulas: [] };
    const data = { ...raw, __file: fp };
    _cache = data;
    _cacheMtime = stat.mtimeMs;
    return data;
  } catch {
    return { formulas: [] };
  }
}

function writeStore(deviceId, data) {
  const fp = fileFor(deviceId);
  const payload = { updated_at: new Date().toISOString(), formulas: data.formulas || [] };
  fs.writeFileSync(fp, JSON.stringify(payload, null, 2), "utf-8");
  _cache = null;
  _cacheMtime = 0;
  return payload;
}

function newId() {
  return "f_" + crypto.randomBytes(8).toString("hex");
}

// ============================================================================
// CRUD
// ============================================================================
export function listFormulas(deviceId) {
  const store = readStore(deviceId);
  return (store.formulas || [])
    .map((f) => ({
      id: f.id,
      name: f.name,
      product_type: f.product_type || null,
      region: f.region || null,
      note: f.note || "",
      ingredient_count: (f.lines || []).length,
      total_pct: round((f.lines || []).reduce((s, l) => s + (Number(l.pct) || 0), 0), 3),
      created_at: f.created_at,
      updated_at: f.updated_at,
      version: f.version || 1,
    }))
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
}

export function getFormula(deviceId, id) {
  const store = readStore(deviceId);
  return (store.formulas || []).find((f) => f.id === id) || null;
}

export function saveFormula(deviceId, payload) {
  const store = readStore(deviceId);
  const formulas = [...(store.formulas || [])];
  const now = new Date().toISOString();
  const id = payload.id || newId();
  const idx = formulas.findIndex((f) => f.id === id);

  const record = {
    id,
    name: (payload.name || "未命名配方").slice(0, 80),
    product_type: payload.product_type || null,
    region: payload.region || null,
    target: payload.target || null,
    note: (payload.note || "").slice(0, 500),
    lines: Array.isArray(payload.lines) ? payload.lines : [],
    model: payload.model || null,
    version: idx >= 0 ? (formulas[idx].version || 1) + 1 : 1,
    created_at: idx >= 0 ? formulas[idx].created_at : now,
    updated_at: now,
  };

  if (idx >= 0) formulas[idx] = record;
  else formulas.unshift(record);

  writeStore(deviceId, { formulas });
  return record;
}

export function deleteFormula(deviceId, id) {
  const store = readStore(deviceId);
  const formulas = [...(store.formulas || [])];
  const idx = formulas.findIndex((f) => f.id === id);
  if (idx < 0) return false;
  formulas.splice(idx, 1);
  writeStore(deviceId, { formulas });
  return true;
}

const round = (n, d = 2) => {
  if (!Number.isFinite(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// ============================================================================
// 导出: CSV / Markdown / HTML
// ============================================================================
export function exportFormula(format, payload) {
  const lines = payload.lines || [];
  const name = payload.name || "Formula";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const head = "#,INCI,中文名,角色,用量(%),相,单价(CNY/kg),成本(CNY/kg)";
    const body = lines.map((l, i) => {
      const pct = Number(l.pct) || 0;
      const price = Number(l.price_cny_per_kg) || "";
      const cost = price !== "" ? round((pct / 100) * price, 4) : "";
      return [
        i + 1,
        csvCell(l.inci_name),
        csvCell(l.chinese_name || ""),
        csvCell(l.role || ""),
        pct,
        csvCell(l.phase || ""),
        price,
        cost,
      ].join(",");
    });
    return { contentType: "text/csv; charset=utf-8", body: `\uFEFF${[head, ...body].join("\n")}`, filename: `${slug(name)}-${stamp}.csv` };
  }

  if (format === "md") {
    const out = [
      `# ${name}`,
      "",
      `- 日期 / Date: ${stamp}`,
      payload.product_type ? `- 品类 / Type: ${payload.product_type}` : null,
      payload.region ? `- 市场 / Market: ${payload.region}` : null,
      payload.note ? `- 备注 / Note: ${payload.note}` : null,
      "",
      "| # | INCI | 中文 | 角色 | 用量 % | 相 | 单价 CNY/kg |",
      "|---|------|------|------|--------|----|-------------|",
      ...lines.map((l, i) =>
        `| ${i + 1} | ${l.inci_name} | ${l.chinese_name || ""} | ${l.role || ""} | ${Number(l.pct) || 0} | ${l.phase || ""} | ${l.price_cny_per_kg ?? ""} |`
      ),
    ].filter((x) => x !== null);
    if (payload.cost) {
      out.push("", `**单公斤成本 / Cost per kg: ¥${payload.cost.totals?.total_per_kg ?? "—"}**`);
      if (payload.cost.retail) out.push(`**建议零售价 / Suggested retail: ¥${payload.cost.retail.suggested_price}**`);
    }
    return { contentType: "text/markdown; charset=utf-8", body: out.join("\n"), filename: `${slug(name)}-${stamp}.md` };
  }

  // html
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(name)}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:40px;background:#0f1115;color:#e6e8ee}
h1{font-size:24px;margin:0 0 4px}.meta{color:#8b93a7;font-size:13px;margin-bottom:24px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 12px;border-bottom:1px solid #262b36;color:#8b93a7;font-weight:600}
td{padding:9px 12px;border-bottom:1px solid #1b1f28}
.num{text-align:right;font-variant-numeric:tabular-nums}
.total{margin-top:24px;padding:16px 20px;background:#161a22;border-radius:12px;font-size:14px}
.total b{font-size:20px}
.foot{margin-top:32px;font-size:11px;color:#5b6478}</style></head><body>
<h1>${esc(name)}</h1>
<div class="meta">${stamp}${payload.product_type ? " · " + esc(payload.product_type) : ""}${payload.region ? " · " + esc(payload.region) : ""}</div>
<table><thead><tr><th>#</th><th>INCI</th><th>中文名</th><th>角色</th><th class="num">用量 %</th><th class="num">单价 CNY/kg</th></tr></thead><tbody>
${lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.inci_name)}</td><td>${esc(l.chinese_name || "")}</td><td>${esc(l.role || "")}</td><td class="num">${Number(l.pct) || 0}</td><td class="num">${l.price_cny_per_kg ?? ""}</td></tr>`).join("\n")}
</tbody></table>
${payload.cost ? `<div class="total">单公斤成本 <b>¥${payload.cost.totals?.total_per_kg ?? "—"}</b> &nbsp;·&nbsp; 每支(${payload.cost.totals?.net_content_g ?? 30}g) <b>¥${payload.cost.totals?.cost_per_unit ?? "—"}</b> &nbsp;·&nbsp; 建议零售价 <b>¥${payload.cost.retail?.suggested_price ?? "—"}</b></div>` : ""}
<div class="foot">配方引擎 FormulaLab · 价格为估算参考值，须按供应商报价校准</div>
</body></html>`;
  return { contentType: "text/html; charset=utf-8", body: html, filename: `${slug(name)}-${stamp}.html` };
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function slug(s) {
  return String(s || "formula").replace(/[^\w\u4e00-\u9fa5-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "formula";
}
