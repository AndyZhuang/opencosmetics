"use client";
// components/QuickAnalyze.js — 首页「粘 INCI 即出结论」速查
import { useState } from "react";
import Link from "next/link";

const EXAMPLES = [
  "AQUA, GLYCERIN, NIACINAMIDE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL",
  "AQUA, RETINOL, TOCOPHEROL, SQUALANE, PEG-40 HYDROGENATED CASTOR OIL, PHENOXYETHANOL",
];

export default function QuickAnalyze() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState(null);

  async function run() {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    setErr("");
    setRes(null);
    try {
      const r = await fetch("/api/workbench/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: t, context: { region: "CN" } }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
      setRes(j);
    } catch (e) {
      setErr(e.message || "分析失败");
    } finally {
      setBusy(false);
    }
  }

  const riskClass = res ? (res.risk.summary === "PASS" ? "pass" : res.risk.summary === "REVIEW" ? "review" : "reject") : "";

  return (
    <div className="wb-paste">
      <div className="wb-paste-label">
        <span>粘贴 INCI 成分表</span>
        <span>{text ? `${text.split(/[,;\n]+/).filter(Boolean).length} 个成分` : "逗号或换行分隔"}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"AQUA, GLYCERIN, NIACINAMIDE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL"}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(); }}
      />
      <div className="wb-paste-actions">
        <button className="oc-btn" onClick={run} disabled={busy || !text.trim()}>
          {busy ? "分析中…" : "立即分析"}
        </button>
        <button className="oc-btn oc-btn-ghost" onClick={() => { setText(EXAMPLES[0]); }}>示例</button>
        <span className="wb-paste-hint">⌘/Ctrl + Enter 快捷提交</span>
      </div>

      {err && (
        <div className="bench-note" style={{ padding: "12px 0 0", borderBottom: 0 }}>
          <span className="bench-note-dot block" />
          <span className="body" style={{ color: "var(--block)" }}>{err}</span>
        </div>
      )}

      {res && (
        <div className="wb-qa-result">
          <div className="wb-qa-head">
            <span className={`bench-status ${riskClass}`}>
              {res.risk.summary === "PASS" ? "风险 通过" : res.risk.summary === "REVIEW" ? "风险 需复核" : "风险 阻断"}
            </span>
            <span className="inci" style={{ fontSize: 12, color: "var(--ink-2)" }}>{res.formula.type_zh}</span>
          </div>

          <div className="wb-qa-facts">
            <div><span>活性分类</span><b>{res.formula.actives.categories?.length || 0} 类</b></div>
            <div><span>单公斤成本</span><b className="num">¥{res.cost.totals.total_per_kg}</b></div>
            <div><span>单支({res.cost.totals.net_content_g}g)</span><b className="num">¥{res.cost.totals.cost_per_unit}</b></div>
            <div><span>建议零售价</span><b className="num">¥{res.cost.retail.suggested_price}</b></div>
          </div>

          {(res.regulatory.eu_banned.length > 0 || res.regulatory.cn_not_in_iecic_count > 0) && (
            <div className="wb-qa-alerts">
              {res.regulatory.eu_banned.length > 0 && (
                <div><span className="bench-flag banned">EU 禁用</span> {res.regulatory.eu_banned.map((x) => x.inci_name).join("、")}</div>
              )}
              {res.regulatory.cn_not_in_iecic_count > 0 && (
                <div><span className="bench-flag notcn">未入 IECIC</span> {res.regulatory.cn_not_in_iecic_count} 个成分未在中国现行目录</div>
              )}
            </div>
          )}

          <div className="wb-qa-cta">
            <Link className="oc-btn oc-btn-ghost oc-btn-sm" href="/bench">在构建器中打开 →</Link>
            <Link className="oc-btn oc-btn-ghost oc-btn-sm" href="/risk">跑 65 条风险规则 →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
