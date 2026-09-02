// app/substitute/page.js — Ingredient Substitution tool (mobile + desktop)
"use client";
import { useState, useEffect } from "react";

const LABELS = {
  zh: {
    title: "🔁 成分替代",
    subtitle: "某成分被禁/太贵/不可用? 找 3-5 个同功能替代",
    tagline: "为配方师设计: 替代成分的法规状态、浓度限值、价格带、使用建议, 一目了然。",
    input_label: "输入要找替代的 INCI 名",
    input_placeholder: "例如: RETINOL, HYDROQUINONE, MINERAL OIL, NIACINAMIDE",
    search_btn: "🔍 找替代",
    searching: "⏳ 搜索中...",
    examples: "💡 试试看",
    group_label: "功能分类",
    regulatory_label: "法规状态",
    conc_label: "浓度限值",
    price_label: "价位",
    notes_label: "使用建议",
    cn_iecic: "IECIC 收录",
    cn_not: "未在 IECIC",
    eu_banned: "EU 禁用",
    eu_restricted: "EU 限用",
    eu_clean: "EU 干净",
    api_link: "🤖 API/MCP",
  },
  en: {
    title: "🔁 Ingredient Substitution",
    subtitle: "Ingredient banned, expensive, or unavailable? Find 3-5 alternatives",
    tagline: "For formulators: regulatory status, concentration limits, price tier, usage notes for each alternative.",
    input_label: "Enter INCI name to find alternatives for",
    input_placeholder: "e.g. RETINOL, HYDROQUINONE, MINERAL OIL, NIACINAMIDE",
    search_btn: "🔍 Find Alternatives",
    searching: "⏳ Searching...",
    examples: "💡 Try these",
    group_label: "Function group",
    regulatory_label: "Regulatory",
    conc_label: "Concentration limit",
    price_label: "Price tier",
    notes_label: "Notes",
    cn_iecic: "In IECIC",
    cn_not: "Not in IECIC",
    eu_banned: "EU Banned",
    eu_restricted: "EU Restricted",
    eu_clean: "EU Clean",
    api_link: "🤖 API/MCP",
  },
};

const EXAMPLE_INPUTS = {
  zh: ["RETINOL", "HYDROQUINONE", "MINERAL OIL", "NIACINAMIDE", "SILICONE", "AHA", "BHA"],
  en: ["RETINOL", "HYDROQUINONE", "MINERAL OIL", "NIACINAMIDE", "SILICONE", "AHA", "BHA"],
};

export default function SubstitutePage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("RETINOL");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("opencosmetics_lang") || "zh");
    }
  }, []);

  const isEn = lang === "en";
  const L = isEn ? LABELS.en : LABELS.zh;

  async function search() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/substitute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inci: input, lang }),
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

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .subst-card { padding: 12px !important; }
          .subst-grid { grid-template-columns: 1fr !important; }
        }
        .subst-input {
          font-size: 14px;
          width: 100%;
          padding: 12px 16px;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .subst-input:focus { outline: 2px solid var(--blue); }
        .subst-btn {
          padding: 12px 24px;
          background: var(--blue);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }
        .subst-btn:disabled { opacity: 0.5; cursor: wait; }
        .subst-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
        }
        .pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          margin-right: 4px;
        }
        .pill-banned { background: rgba(231,76,60,0.2); color: #e74c3c; }
        .pill-restricted { background: rgba(241,196,15,0.2); color: #f1c40f; }
        .pill-clean { background: rgba(46,204,113,0.2); color: #2ecc71; }
        .pill-tier { background: var(--border); color: var(--text); }
        .example-btn {
          padding: 4px 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          color: var(--text);
          font-family: ui-monospace, monospace;
        }
        .example-btn:hover { background: var(--blue); color: white; }
      `}} />

      <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 8px 0" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      <div className="card">
        <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>{L.input_label}</label>
        <div style={{ display: "flex", gap: "8px" }} className="subst-grid">
          <input
            className="subst-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={L.input_placeholder}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button onClick={search} disabled={loading || !input.trim()} className="subst-btn">
            {loading ? L.searching : L.search_btn}
          </button>
        </div>
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>{L.examples}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {EXAMPLE_INPUTS.zh.map(ex => (
              <button key={ex} onClick={() => { setInput(ex); }} className="example-btn">{ex}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
          <p style={{ color: "#e74c3c", margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && !result.found && (
        <div className="card">
          <p style={{ margin: 0 }}>{isEn ? result.message_en : result.message_zh}</p>
          {result.groups_available && (
            <div style={{ marginTop: "8px" }}>
              {result.groups_available.map(g => <span key={g} className="pill pill-tier">{g}</span>)}
            </div>
          )}
        </div>
      )}

      {result && result.found && (
        <div>
          <div className="card">
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{result.query}</h2>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              {L.group_label}: <strong style={{ color: "var(--accent)" }}>{isEn ? result.group_en : result.group}</strong>
              <span style={{ marginLeft: "12px" }}>· {result.candidates_count} {isEn ? "candidates" : "个候选"}</span>
            </div>
          </div>

          {result.suggestions.map((s, i) => (
            <div key={i} className="card subst-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ margin: 0, color: "var(--orange)", fontFamily: "ui-monospace, monospace", fontSize: "15px" }}>{s.inci_name}</h3>
                <span className="pill pill-tier">{s.tier} · ¥{s.price_index}/5</span>
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "var(--text)" }}>
                {isEn ? s.notes_en : s.notes_zh}
              </p>
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{L.regulatory_label}</div>
                <div>
                  {s.regulatory.cn_iecic
                    ? <span className="pill pill-clean">{L.cn_iecic} ({s.regulatory.cn_iecic.chinese_name})</span>
                    : <span className="pill" style={{ background: "var(--border)" }}>{L.cn_not}</span>}
                  {s.regulatory.eu_banned ? <span className="pill pill-banned">{L.eu_banned} #{s.regulatory.eu_banned_ref}</span>
                    : s.regulatory.eu_restricted ? <span className="pill pill-restricted">{L.eu_restricted}</span>
                    : <span className="pill pill-clean">{L.eu_clean}</span>}
                </div>
              </div>
              {s.concentration && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>{L.conc_label}</div>
                  <div style={{ fontSize: "12px", color: "var(--text)" }}>
                    {s.concentration.max_pct !== undefined && <>Max: {s.concentration.max_pct}%  </>}
                    {s.concentration.leave_on_max_pct !== undefined && <>Leave-on: {s.concentration.leave_on_max_pct}%  </>}
                    {s.concentration.rinse_off_max_pct !== undefined && <>Rinse-off: {s.concentration.rinse_off_max_pct}%</>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        {L.api_link}: <a href="/api/mcp" style={{ color: "var(--blue)" }}>MCP server</a> · <a href="/api/substitute" style={{ color: "var(--blue)" }}>REST API</a>
      </p>
    </div>
  );
}
