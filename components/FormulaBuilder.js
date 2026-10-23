"use client";
// components/FormulaBuilder.js — 配方构建器 (Web 端)
// 逐行 INCI + 用量 + 相位 → 实时成本 / 法规状态 / 风险规则命中
import { useState, useEffect, useCallback, useRef } from "react";

const PHASES = ["A相 (水相)", "B相 (油相)", "C相 (乳化/分散)"];
const REGIONS = [
  { v: "CN", l: "中国 CN" },
  { v: "EU", l: "欧盟 EU" },
  { v: "US", l: "美国 US" },
  { v: "KR", l: "韩国 KR" },
  { v: "JP", l: "日本 JP" },
  { v: "ASEAN", l: "东盟 ASEAN" },
];

function deviceId() {
  if (typeof window === "undefined") return "anonymous";
  const k = "fl_device_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(k, v);
  }
  return v;
}

const emptyLine = () => ({ inci_name: "", pct: "", phase: "A相 (水相)" });

export default function FormulaBuilder({ initialLines = [], initialName = "" }) {
  const [lines, setLines] = useState(initialLines.length ? initialLines : [emptyLine(), emptyLine(), emptyLine()]);
  const [name, setName] = useState(initialName);
  const [productType, setProductType] = useState("");
  const [region, setRegion] = useState("CN");
  const [measuredPh, setMeasuredPh] = useState("");
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showCostModel, setShowCostModel] = useState(false);
  const [model, setModel] = useState({
    batch_kg: 100, net_content_g: 30, gross_margin: 0.55,
    distributor_markup: 0.35, packaging_per_unit: 2.2, processing_per_kg: 3.5,
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const timer = useRef(null);
  const seq = useRef(0);

  const totalPct = lines.reduce((s, l) => s + (parseFloat(l.pct) || 0), 0);

  const run = useCallback(async (payloadLines, ctxRegion, costModel, ph) => {
    const valid = payloadLines.filter((l) => l.inci_name.trim());
    if (!valid.length) { setAnalysis(null); return; }
    const my = ++seq.current;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/workbench/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: valid.map((l) => ({
            inci_name: l.inci_name.trim().toUpperCase(),
            pct: parseFloat(l.pct) || 0,
            phase: l.phase || undefined,
          })),
          context: { region: ctxRegion, pH: ph === "" ? undefined : Number(ph) },
          model: costModel,
        }),
      });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
      if (my === seq.current) setAnalysis(j);
    } catch (e) {
      if (my === seq.current) { setErr(e.message || "分析失败"); setAnalysis(null); }
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);

  // 600ms 防抖实时分析
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(lines, region, model, measuredPh), 600);
    return () => timer.current && clearTimeout(timer.current);
  }, [lines, region, model, measuredPh, run]);

  function setLine(i, patch) {
    setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }
  function addLine() { setLines((ls) => [...ls, emptyLine()]); }
  function delLine(i) { setLines((ls) => ls.filter((_, k) => k !== i)); }
  function clearAll() { setLines([emptyLine()]); setAnalysis(null); }

  function sortByPct() {
    setLines((ls) => [...ls].sort((a, b) => (parseFloat(b.pct) || 0) - (parseFloat(a.pct) || 0)));
  }

  function applyScaffold() {
    const sc = analysis?.structure?.scaffold;
    if (!sc || !sc.length) return;
    const map = new Map(sc.map((s) => [s.inci_name, s.pct]));
    setLines((ls) =>
      ls.map((l) => {
        const key = l.inci_name.trim().toUpperCase();
        const hit = sc.find((s) => s.inci_name === key);
        return hit ? { ...l, pct: hit.pct } : l;
      })
    );
  }

  function importText_() {
    const items = importText.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    setLines(items.map((n) => ({ inci_name: n, pct: "", phase: "A相 (水相)" })));
    setImportText("");
    setShowImport(false);
  }

  async function saveDraft() {
    const valid = lines.filter((l) => l.inci_name.trim());
    if (!valid.length) { setSaveMsg("没有可保存的成分"); return; }
    try {
      const r = await fetch("/api/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-device-id": deviceId() },
        body: JSON.stringify({
          name: name || "未命名配方",
          product_type: productType,
          region,
          model,
          lines: valid.map((l) => ({ inci_name: l.inci_name.trim().toUpperCase(), pct: parseFloat(l.pct) || 0, phase: l.phase })),
        }),
      });
      const j = await r.json();
      setSaveMsg(j.ok ? `已保存 · v${j.formula.version}` : `保存失败: ${j.error}`);
      setTimeout(() => setSaveMsg(""), 3500);
    } catch (e) {
      setSaveMsg(`保存失败: ${e.message}`);
      setTimeout(() => setSaveMsg(""), 3500);
    }
  }

  async function exportFormula(format) {
    const valid = lines.filter((l) => l.inci_name.trim());
    if (!valid.length) return;
    const r = await fetch("/api/formula/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format, name: name || "配方",
        lines: valid.map((l) => ({
          inci_name: l.inci_name.trim().toUpperCase(),
          chinese_name: analysis?.lines?.find((x) => x.inci_name === l.inci_name.trim().toUpperCase())?.chinese_name || "",
          role: analysis?.lines?.find((x) => x.inci_name === l.inci_name.trim().toUpperCase())?.role || "",
          pct: parseFloat(l.pct) || 0,
          phase: l.phase,
        })),
        cost: analysis?.cost,
      }),
    });
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name || "formula").replace(/[^\w\u4e00-\u9fa5-]+/g, "-")}.${format}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const risk = analysis?.risk;
  const riskClass = risk ? (risk.summary === "PASS" ? "pass" : risk.summary === "REVIEW" ? "review" : "reject") : "";
  const cost = analysis?.cost;

  return (
    <div className="bench">
      {/* ==================== 左栏: 配方编辑 ==================== */}
      <div className="bench-col">
        <div className="bench-card">
          <div className="bench-card-head">
            <h3>配方行</h3>
            <span className="meta">
              {lines.filter((l) => l.inci_name.trim()).length} 成分 · 合计{" "}
              <b style={{ color: Math.abs(totalPct - 100) > 5 && totalPct > 0 ? "var(--warn)" : "var(--ink)" }}>
                {totalPct.toFixed(1)}%
              </b>
            </span>
          </div>

          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr 120px 108px 86px", gap: 9 }}>
            <input className="oc-input" placeholder="配方名称 (如: 烟酰胺修护精华 v1)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="oc-input" placeholder="品类" value={productType} onChange={(e) => setProductType(e.target.value)} />
            <select className="oc-input" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
            <input
              className="oc-input" type="number" step="0.1" min="0" max="14"
              placeholder="实测 pH" value={measuredPh}
              onChange={(e) => setMeasuredPh(e.target.value)}
              title="填入实测 pH 后, pH 规则将按实测值判定 (未填则按配方估算, 只作提示)"
            />
          </div>

          <div className="bench-lines">
            {lines.map((l, i) => {
              const info = analysis?.lines?.find((x) => x.inci_name === l.inci_name.trim().toUpperCase());
              return (
                <div className="bench-line" key={i}>
                  <span className="bench-line-idx">{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ minWidth: 0 }}>
                    <input
                      className="bench-line-name"
                      placeholder="INCI 名称"
                      value={l.inci_name}
                      onChange={(e) => setLine(i, { inci_name: e.target.value })}
                    />
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                      {info?.role && <span className="bench-role" data-role={info.role}>{info.role}</span>}
                      {info?.chinese_name && <span className="bench-line-cn">{info.chinese_name}</span>}
                      {info?.eu_status === "banned" && <span className="bench-flag banned">EU禁用</span>}
                      {info?.eu_status === "restricted" && <span className="bench-flag restricted">EU限用</span>}
                      {info && !info.is_in_iecic && <span className="bench-flag notcn">未入IECIC</span>}
                    </div>
                  </div>
                  <input
                    className="bench-line-pct"
                    type="number" step="0.01" min="0" placeholder="%"
                    value={l.pct}
                    onChange={(e) => setLine(i, { pct: e.target.value })}
                  />
                  <select className="bench-line-phase" value={l.phase} onChange={(e) => setLine(i, { phase: e.target.value })}>
                    {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button className="bench-line-del" onClick={() => delLine(i)} title="删除" aria-label="删除该行">×</button>
                </div>
              );
            })}
            {!lines.length && <div className="bench-empty">还没有成分行, 点下方「加一行」开始</div>}
          </div>

          <div className="bench-foot">
            <div className="bench-total">
              合计 <b className={totalPct > 100 ? "over" : ""}>{totalPct.toFixed(2)}%</b>
              {totalPct > 0 && Math.abs(totalPct - 100) > 5 && (
                <span style={{ color: "var(--warn)", marginLeft: 8 }}>
                  {totalPct > 100 ? "超出 100%" : "未配平"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={addLine}>+ 加一行</button>
              <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={sortByPct}>按用量排序</button>
              {analysis?.structure?.scaffold && (
                <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={applyScaffold}>补齐典型用量</button>
              )}
              <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={() => setShowImport((v) => !v)}>
                {showImport ? "收起导入" : "批量导入"}
              </button>
            </div>
          </div>

          {showImport && (
            <div style={{ padding: 14, borderTop: "1px solid var(--line)", background: "var(--paper)" }}>
              <div className="wb-paste-label"><span>粘贴 INCI 列表</span><span>逗号 / 换行分隔</span></div>
              <textarea
                className="oc-input"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, minHeight: 84 }}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="AQUA, GLYCERIN, NIACINAMIDE, ..."
              />
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                <button className="oc-btn oc-btn-sm" onClick={importText_}>导入为配方行</button>
                <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={() => setImportText("")}>清空</button>
              </div>
            </div>
          )}
        </div>

        {/* 成本模型参数 */}
        <div className="bench-card">
          <div className="bench-card-head">
            <h3>成本模型参数</h3>
            <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={() => setShowCostModel((v) => !v)}>
              {showCostModel ? "收起" : "调整"}
            </button>
          </div>
          {showCostModel && (
            <div className="bench-card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 11 }}>
              {[
                ["batch_kg", "批量 (kg)"], ["net_content_g", "净含量 (g)"],
                ["gross_margin", "品牌毛利率"], ["distributor_markup", "渠道加价"],
                ["packaging_per_unit", "包材 (元/支)"], ["processing_per_kg", "加工 (元/kg)"],
              ].map(([k, label]) => (
                <label key={k} style={{ fontSize: 12, color: "var(--muted)" }}>
                  {label}
                  <input
                    className="oc-input" type="number" step="0.01" style={{ marginTop: 4, fontFamily: "var(--font-mono)" }}
                    value={model[k]} onChange={(e) => setModel((m) => ({ ...m, [k]: Number(e.target.value) }))}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==================== 右栏: 结论 ==================== */}
      <div className="bench-col">
        {err && (
          <div className="bench-card"><div className="bench-card-body" style={{ color: "var(--block)", fontSize: 13 }}>{err}</div></div>
        )}

        <div className="bench-card">
          <div className="bench-card-head">
            <h3>结论</h3>
            <span className="meta">{loading ? "计算中…" : analysis ? `v${analysis.timestamp?.slice(11, 19)}` : "待输入"}</span>
          </div>
          {!analysis && !loading && <div className="bench-empty">输入 INCI 后自动出结论</div>}
          {analysis && (
            <div className="bench-facts">
              <div className="bench-fact">
                <span className="k">风险判定</span>
                <span className={`bench-status ${riskClass}`}>
                  {risk.summary === "PASS" ? "PASS" : risk.summary === "REVIEW" ? "REVIEW" : "REJECT"}
                </span>
              </div>
              <div className="bench-fact"><span className="k">配方类型</span><span className="v">{analysis.formula.type_zh}</span></div>
              <div className="bench-fact"><span className="k">活性分类</span><span className="v">{analysis.formula.actives.categories?.length || 0} 类</span></div>
              <div className="bench-fact"><span className="k">目标人群</span><span className="v">{analysis.formula.target_demographic?.primary || "—"}</span></div>
              <div className="bench-fact">
                <span className="k">pH {analysis.risk.ph_report?.estimated ? "(估算)" : "(实测)"}</span>
                <span className="v">
                  {analysis.risk.ph_report?.ph ?? "需实测"}
                  <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
                    {analysis.risk.ph_report?.product_context_zh || ""}
                  </span>
                </span>
              </div>
              <div className="bench-fact"><span className="k">价位带</span><span className="v">{analysis.formula.price_tier?.tier_zh} · {analysis.formula.price_tier?.price_range_cny}</span></div>
              <div className="bench-fact"><span className="k">未入 IECIC</span><span className="v">{analysis.regulatory.cn_not_in_iecic_count} 个</span></div>
            </div>
          )}
        </div>

        {analysis && cost && (
          <div className="bench-card">
            <div className="bench-card-head">
              <h3>成本</h3>
              <span className="meta">价格覆盖 {cost.quality.coverage_pct}%</span>
            </div>
            <div className="bench-cost-grid">
              <div className="bench-cost-cell hero">
                <div className="l">单公斤成本</div>
                <div className="v">¥{cost.totals.total_per_kg}</div>
              </div>
              <div className="bench-cost-cell">
                <div className="l">单支成本 ({cost.totals.net_content_g}g)</div>
                <div className="v">¥{cost.totals.cost_per_unit}</div>
              </div>
              <div className="bench-cost-cell">
                <div className="l">出厂价</div>
                <div className="v">¥{cost.retail.ex_factory_price}</div>
              </div>
              <div className="bench-cost-cell">
                <div className="l">建议零售价</div>
                <div className="v">¥{cost.retail.suggested_price}</div>
              </div>
              <div className="bench-cost-cell">
                <div className="l">批次成本 ({cost.totals.batch_kg}kg)</div>
                <div className="v">¥{cost.totals.batch_cost}</div>
              </div>
            </div>
            {cost.top_drivers?.length > 0 && (
              <div className="bench-bars">
                {cost.top_drivers.map((d) => (
                  <div className="bench-bar-row" key={d.inci_name}>
                    <div>
                      <div className="bench-bar-label inci">{d.inci_name}</div>
                      <div className="bench-bar-track">
                        <div className="bench-bar-fill" style={{ width: `${Math.min(100, d.cost_share)}%` }} />
                      </div>
                    </div>
                    <div className="bench-bar-pct">{d.cost_share}%</div>
                  </div>
                ))}
              </div>
            )}
            {cost.estimated_from_typical_levels && (
              <div className="bench-note" style={{ borderTop: "1px solid var(--line-2)" }}>
                <span className="bench-note-dot info" />
                <span className="body">{cost.quality.note_zh}</span>
              </div>
            )}
          </div>
        )}

        {analysis && (risk?.top_findings?.length > 0 || analysis.formula.suggestions?.length > 0) && (
          <div className="bench-card">
            <div className="bench-card-head">
              <h3>规则命中与建议</h3>
              <span className="meta">
              {risk?.block_count || 0} 阻断 · {risk?.warn_count || 0} 警告 · {risk?.info_count || 0} 提示
            </span>
            </div>
            <div className="bench-notes">
              {(risk?.top_findings || []).map((f, i) => (
                <div className="bench-note" key={`f${i}`}>
                  <span className={`bench-note-dot ${f.severity === "block" ? "block" : "warn"}`} />
                  <span className="body">
                    <b style={{ color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{f.rule_id}</b>{" "}
                    {f.rationale}
                    {f.matched?.length ? <span className="inci" style={{ color: "var(--muted)" }}> · {f.matched.join(" + ")}</span> : null}
                  </span>
                </div>
              ))}
              {(analysis.formula.suggestions || []).map((s, i) => (
                <div className="bench-note" key={`s${i}`}>
                  <span className={`bench-note-dot ${s.severity === "block" ? "block" : s.severity === "warn" ? "warn" : s.severity === "good" ? "good" : "info"}`} />
                  <span className="body">{s.message_zh}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bench-card">
          <div className="bench-card-head">
            <h3>保存与导出</h3>
            {saveMsg && <span className="meta" style={{ color: "var(--accent)" }}>{saveMsg}</span>}
          </div>
          <div className="bench-card-body" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="oc-btn" onClick={saveDraft}>保存草稿</button>
            <button className="oc-btn oc-btn-ghost" onClick={() => exportFormula("csv")}>导出 CSV</button>
            <button className="oc-btn oc-btn-ghost" onClick={() => exportFormula("md")}>导出 Markdown</button>
            <button className="oc-btn oc-btn-ghost" onClick={() => exportFormula("html")}>导出 HTML</button>
          </div>
        </div>
      </div>
    </div>
  );
}
