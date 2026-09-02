// app/formula/page.js — Formula Workbench (mobile + desktop responsive)
// Paste any product's INCI list, get full reverse-engineering analysis
"use client";
import { useState, useEffect } from "react";

const PRESETS = {
  zh: [
    {
      name: "美白精华 (The Ordinary 风格)",
      inci: "AQUA, NIACINAMIDE, GLYCERIN, ZINC PCA, TRANEXAMIC ACID, ALOE BARBADENSIS LEAF JUICE, PANTHENOL, ALLANTOIN, XANTHAN GUM, PHENOXYETHANOL, ETHYLHEXYLGLYCERIN",
    },
    {
      name: "敏感肌修护面霜 (薇诺娜风格)",
      inci: "AQUA, GLYCERIN, SQUALANE, BUTYROSPERMUM PARKII BUTTER, CERAMIDE NP, CENTELLA ASIATICA EXTRACT, MADECASSOSIDE, ALLANTOIN, PANTHENOL, BISABOLOL, TOCOPHEROL, CETEARYL ALCOHOL, GLYCERYL STEARATE, PHENOXYETHANOL",
    },
    {
      name: "抗老精华 (含 Retinol)",
      inci: "AQUA, GLYCERIN, RETINOL, SQUALANE, TOCOPHEROL, FERULIC ACID, NIACINAMIDE, HYALURONIC ACID, BISABOLOL, BHT, PHENOXYETHANOL",
    },
    {
      name: "化学防晒霜",
      inci: "AQUA, OCTINOXATE, AVOBENZONE, OCTOCRYLENE, HOMOSALATE, GLYCERIN, BUTYLENE GLYCOL, TOCOPHEROL, ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER, PHENOXYETHANOL",
    },
  ],
  en: [
    {
      name: "Whitening serum (The Ordinary style)",
      inci: "AQUA, NIACINAMIDE, GLYCERIN, ZINC PCA, TRANEXAMIC ACID, ALOE BARBADENSIS LEAF JUICE, PANTHENOL, ALLANTOIN, XANTHAN GUM, PHENOXYETHANOL, ETHYLHEXYLGLYCERIN",
    },
    {
      name: "Sensitive repair cream",
      inci: "AQUA, GLYCERIN, SQUALANE, BUTYROSPERMUM PARKII BUTTER, CERAMIDE NP, CENTELLA ASIATICA EXTRACT, MADECASSOSIDE, ALLANTOIN, PANTHENOL, BISABOLOL, TOCOPHEROL, CETEARYL ALCOHOL, GLYCERYL STEARATE, PHENOXYETHANOL",
    },
    {
      name: "Anti-aging serum (Retinol)",
      inci: "AQUA, GLYCERIN, RETINOL, SQUALANE, TOCOPHEROL, FERULIC ACID, NIACINAMIDE, HYALURONIC ACID, BISABOLOL, BHT, PHENOXYETHANOL",
    },
    {
      name: "Chemical sunscreen",
      inci: "AQUA, OCTINOXATE, AVOBENZONE, OCTOCRYLENE, HOMOSALATE, GLYCERIN, BUTYLENE GLYCOL, TOCOPHEROL, ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER, PHENOXYETHANOL",
    },
  ],
};

const LABELS = {
  zh: {
    title: "🔬 配方反向工程",
    subtitle: "粘贴任何产品的 INCI 表, 5 秒出分析",
    tagline: "为配方师设计: 自动识别类型、Top 活性、基质、风险、法规、价位。Web + 移动端 + LLM API 三端可用。",
    input_label: "粘贴 INCI 列表 (逗号或换行分隔)",
    input_placeholder: "例如:\nAQUA, GLYCERIN, NIACINAMIDE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL",
    population_label: "目标人群",
    region_label: "目标市场",
    analyze_btn: "🔬 分析配方",
    analyzing: "⏳ 分析中...",
    presets: "📦 预置配方 (点击加载):",
    pop_adult: "成人", pop_pregnant: "孕妇", pop_child: "儿童", pop_sensitive: "敏感肌",
    reg_cn: "🇨🇳 中国", reg_eu: "🇪🇺 欧盟", reg_us: "🇺🇸 美国", reg_kr: "🇰🇷 韩国", reg_jp: "🇯🇵 日本", reg_asean: "🇦🇸 东盟",
    result_type: "📦 配方类型",
    result_actives: "🎯 Top 活性物",
    result_vehicle: "🧪 基质构成",
    result_demo: "👤 目标人群",
    result_price: "💰 价位推测",
    result_risk: "⚠️ 风险扫描",
    result_suggestions: "💡 改进建议",
    result_ingredients: "📋 成分明细 (按 INCI 顺序)",
    no_actives: "未检测到常见活性物",
    banned_in_eu: "EU 禁用",
    restricted_in_eu: "EU 限用",
    in_iecic: "IECIC 收录",
    not_in_iecic: "未在 IECIC",
    api_link: "🤖 API/MCP",
    try_examples: "💡 试试看",
  },
  en: {
    title: "🔬 Formula Reverse-Engineering",
    subtitle: "Paste any product's INCI list, get analysis in 5 seconds",
    tagline: "For formulators: auto-detect type, top actives, vehicle, risk, regulatory, price tier. Web + mobile + LLM API.",
    input_label: "Paste INCI list (comma or newline separated)",
    input_placeholder: "e.g.\nAQUA, GLYCERIN, NIACINAMIDE, SQUALANE, TOCOPHEROL, PHENOXYETHANOL",
    population_label: "Target population",
    region_label: "Target market",
    analyze_btn: "🔬 Analyze Formula",
    analyzing: "⏳ Analyzing...",
    presets: "📦 Preset formulas (click to load):",
    pop_adult: "Adult", pop_pregnant: "Pregnant", pop_child: "Child", pop_sensitive: "Sensitive",
    reg_cn: "🇨🇳 China", reg_eu: "🇪🇺 EU", reg_us: "🇺🇸 USA", reg_kr: "🇰🇷 Korea", reg_jp: "🇯🇵 Japan", reg_asean: "🇦🇸 ASEAN",
    result_type: "📦 Formula Type",
    result_actives: "🎯 Top Actives",
    result_vehicle: "🧪 Vehicle Composition",
    result_demo: "👤 Target Demographic",
    result_price: "💰 Price Tier",
    result_risk: "⚠️ Risk Scan",
    result_suggestions: "💡 Suggestions",
    result_ingredients: "📋 Ingredient Detail (INCI order)",
    no_actives: "No common actives detected",
    banned_in_eu: "EU banned",
    restricted_in_eu: "EU restricted",
    in_iecic: "In IECIC",
    not_in_iecic: "Not in IECIC",
    api_link: "🤖 API/MCP",
    try_examples: "💡 Try these",
  },
};

export default function FormulaPage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState(PRESETS.zh[0].inci);
  const [population, setPopulation] = useState("adult");
  const [region, setRegion] = useState("CN");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("opencosmetics_lang") || "zh";
      setLang(stored);
      setInput(PRESETS[stored]?.[0]?.inci || PRESETS.zh[0].inci);
    }
  }, []);

  const isEn = lang === "en";
  const L = isEn ? LABELS.en : LABELS.zh;
  const presets = isEn ? PRESETS.en : PRESETS.zh;

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/formula/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: input, context: { population, region }, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(p) {
    setInput(p.inci);
  }

  return (
    <div style={{ maxWidth: "100%" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .formula-grid { grid-template-columns: 1fr !important; }
          .formula-presets { flex-direction: column !important; align-items: stretch !important; }
          .formula-preset-btn { width: 100% !important; text-align: left !important; }
          .result-stats { grid-template-columns: 1fr 1fr !important; }
          .ingredient-row { flex-wrap: wrap !important; }
          .ingredient-name { min-width: 0 !important; word-break: break-word !important; }
        }
        .formula-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          min-height: 120px;
          resize: vertical;
          width: 100%;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
        }
        .formula-input:focus { outline: 2px solid var(--blue); }
        .preset-btn {
          padding: 6px 12px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text);
        }
        .preset-btn:hover { background: var(--panel); }
        .analyze-btn {
          width: 100%;
          padding: 14px 20px;
          background: var(--blue);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
        }
        .analyze-btn:disabled { opacity: 0.5; cursor: wait; }
        .analyze-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          margin: 0 0 10px 0;
        }
        .pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-right: 6px;
          margin-bottom: 4px;
        }
        .pill-active { background: rgba(46,204,113,0.2); color: #2ecc71; }
        .pill-warn { background: rgba(241,196,15,0.2); color: #f1c40f; }
        .pill-block { background: rgba(231,76,60,0.2); color: #e74c3c; }
        .pill-info { background: rgba(52,152,219,0.2); color: #3498db; }
        .pill-eu-bad { background: rgba(231,76,60,0.15); color: #e74c3c; border: 1px solid #e74c3c; }
        .pill-cn-ok { background: rgba(46,204,113,0.15); color: #2ecc71; }
        .pill-cn-no { background: rgba(149,165,166,0.15); color: #95a5a6; }
        .code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 11px;
          color: var(--muted);
        }
      `}} />

      <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 8px 0" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      {/* Input section */}
      <div className="card">
        <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>{L.input_label}</label>
        <textarea
          className="formula-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={L.input_placeholder}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }} className="formula-grid">
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{L.population_label}</label>
            <select value={population} onChange={(e) => setPopulation(e.target.value)} style={{ width: "100%", padding: "10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}>
              <option value="adult">{L.pop_adult}</option>
              <option value="pregnant">{L.pop_pregnant}</option>
              <option value="child">{L.pop_child}</option>
              <option value="sensitive">{L.pop_sensitive}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{L.region_label}</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: "100%", padding: "10px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "14px" }}>
              <option value="CN">{L.reg_cn}</option>
              <option value="EU">{L.reg_eu}</option>
              <option value="US">{L.reg_us}</option>
              <option value="KR">{L.reg_kr}</option>
              <option value="JP">{L.reg_jp}</option>
              <option value="ASEAN">{L.reg_asean}</option>
            </select>
          </div>
        </div>
        <button onClick={analyze} disabled={loading || !input.trim()} className="analyze-btn" style={{ marginTop: "16px" }}>
          {loading ? L.analyzing : L.analyze_btn}
        </button>
      </div>

      {/* Presets */}
      <div style={{ margin: "16px 0" }}>
        <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>{L.presets}</div>
        <div className="formula-presets" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {presets.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p)} className="preset-btn formula-preset-btn">{p.name}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
          <p style={{ color: "#e74c3c", margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && <ResultView result={result} L={L} lang={lang} />}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        {L.api_link}: <a href="/api/mcp" style={{ color: "var(--blue)" }}>MCP server</a> · <a href="/api/formula/analyze" style={{ color: "var(--blue)" }}>REST API</a>
      </p>
    </div>
  );
}

function ResultView({ result, L, lang }) {
  const isEn = lang === "en";
  const r = result;

  return (
    <div style={{ marginTop: "24px" }}>
      {/* Stats grid */}
      <div className="result-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
        <StatBox num={r.stats.total_ingredients} label={isEn ? "Total" : "总成分"} />
        <StatBox num={r.stats.recognized_in_cosng} label={isEn ? "In EU CosIng" : "CosIng 收录"} color="var(--green)" />
        <StatBox num={r.stats.recognized_in_iecic} label="IECIC 收录" color="var(--green)" />
        <StatBox num={r.stats.eu_banned} label={isEn ? "EU banned" : "EU 禁用"} color="var(--red)" />
        <StatBox num={r.stats.risk_blocks} label="BLOCK" color="var(--red)" />
        <StatBox num={r.stats.risk_warns} label="WARN" color="var(--orange)" />
      </div>

      {/* Formula type + price tier + demo */}
      <div className="card" style={{ marginTop: "16px" }}>
        <h3 className="card-title">{L.result_type} · {L.result_price} · {L.result_demo}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{L.result_type}</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent)" }}>{r.type_zh}</div>
            {r.type.length > 1 && <div style={{ fontSize: "12px", color: "var(--muted)" }}>或 {r.type.slice(1).map(t => t.split(" / ")[0]).join(" / ")}</div>}
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{L.result_price}</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--orange)" }}>{r.price_tier_zh}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{r.price_tier.price_range_cny}</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "12px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>{L.result_demo}</div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--blue)" }}>{r.target_demographic_zh}</div>
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{r.target_demographic.concern}</div>
          </div>
        </div>
      </div>

      {/* Top actives */}
      <div className="card">
        <h3 className="card-title">{L.result_actives} ({r.actives.total_count} {isEn ? "found" : "检出"})</h3>
        {r.actives.top3.length > 0 ? (
          <ol style={{ paddingLeft: "20px", margin: 0 }}>
            {r.actives.top3.map((a, i) => (
              <li key={i} style={{ marginBottom: "6px" }}>
                <strong style={{ color: "var(--orange)" }}>{a.ingredient}</strong>
                {a.category_name_zh && <span style={{ color: "var(--muted)", fontSize: "12px" }}> — {a.category_name_zh}</span>}
                <span style={{ color: "var(--muted)", fontSize: "11px", marginLeft: "8px" }}>INCI #{a.position}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: "var(--muted)" }}>{L.no_actives}</p>
        )}
        {r.actives.categories.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            {r.actives.categories.map(c => (
              <span key={c} className="pill pill-active">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle */}
      <div className="card">
        <h3 className="card-title">{L.result_vehicle}</h3>
        <div style={{ marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{isEn ? "Primary" : "主体"}: </span>
          <strong>{r.vehicle.primary}</strong>
        </div>
        {r.vehicle.humectants.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{isEn ? "Humectants" : "保湿剂"}: </span>
            {r.vehicle.humectants.map(h => <span key={h} className="pill pill-info">{h}</span>)}
          </div>
        )}
        {r.vehicle.emollients.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{isEn ? "Emollients" : "润肤剂"}: </span>
            {r.vehicle.emollients.map(e => <span key={e} className="pill pill-info">{e}</span>)}
          </div>
        )}
        {r.vehicle.preservatives.length > 0 && (
          <div>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>{isEn ? "Preservatives" : "防腐剂"}: </span>
            {r.vehicle.preservatives.map(p => <span key={p} className="pill pill-info">{p}</span>)}
          </div>
        )}
      </div>

      {/* Risk scan */}
      {r.risk_summary.top_findings.length > 0 && (
        <div className="card" style={{ background: r.risk_summary.summary === "REJECT" ? "rgba(231,76,60,0.05)" : "rgba(241,196,15,0.05)" }}>
          <h3 className="card-title">{L.result_risk} · <span style={{ color: r.risk_summary.summary === "REJECT" ? "var(--red)" : "var(--orange)" }}>{r.risk_summary.summary}</span></h3>
          {r.risk_summary.top_findings.map((f, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: i < r.risk_summary.top_findings.length - 1 ? "1px dashed var(--border)" : "none" }}>
              <span className={`pill ${f.severity === "block" ? "pill-block" : "pill-warn"}`}>{f.severity}</span>
              <span className="code" style={{ marginRight: "6px" }}>{f.rule_id}</span>
              <span style={{ fontSize: "12px" }}>{f.rationale}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {r.suggestions.length > 0 && (
        <div className="card">
          <h3 className="card-title">{L.result_suggestions}</h3>
          {r.suggestions.map((s, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < r.suggestions.length - 1 ? "1px dashed var(--border)" : "none" }}>
              <span className={`pill ${s.severity === "block" ? "pill-block" : s.severity === "warn" ? "pill-warn" : s.type === "good" ? "pill-active" : "pill-info"}`}>
                {s.type === "good" ? "✓" : s.type === "critical" ? "✗" : "ℹ"}
              </span>
              <span style={{ fontSize: "13px" }}>{s.message_zh}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ingredients list */}
      <div className="card">
        <h3 className="card-title">{L.result_ingredients}</h3>
        <div style={{ maxHeight: "500px", overflowY: "auto" }}>
          {r.ingredients.map((ing, i) => (
            <div key={i} className="ingredient-row" style={{ display: "flex", gap: "8px", padding: "6px 0", borderBottom: "1px dashed var(--border)", alignItems: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "11px", minWidth: "24px" }}>#{ing.position}</span>
              <div className="ingredient-name" style={{ flex: 1, minWidth: 0 }}>
                <code style={{ color: "var(--orange)", fontSize: "12px" }}>{ing.inci_name}</code>
                {ing.chinese_name && <span style={{ color: "var(--muted)", fontSize: "12px", marginLeft: "6px" }}>({ing.chinese_name})</span>}
                {ing.function_translated && <div style={{ fontSize: "10px", color: "var(--muted)" }}>{ing.function_translated}</div>}
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {ing.is_banned_eu && <span className="pill pill-eu-bad">{L.banned_in_eu}</span>}
                {ing.is_restricted_eu && <span className="pill pill-warn">{L.restricted_in_eu}</span>}
                {ing.is_in_iecic ? <span className="pill pill-cn-ok">{L.in_iecic}</span> : <span className="pill pill-cn-no">{L.not_in_iecic}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ num, label, color }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
      <div style={{ fontSize: "20px", fontWeight: 700, color: color || "var(--accent)" }}>{num}</div>
      <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>{label}</div>
    </div>
  );
}
