// app/claim/page.js — Claim-to-Formula tool (mobile + desktop)
"use client";
import { useState, useEffect } from "react";

const LABELS = {
  zh: {
    title: "🎯 目标反推配方",
    subtitle: "告诉我要做什么, 我给你配方 brief",
    tagline: "为配方师设计: 输入人群 + 目标 + 价位, 自动输出活性物组合 + 浓度 + 基质 + 注意事项。",
    population_label: "目标人群",
    price_label: "价位带",
    concerns_label: "护肤目标 (选择或输入)",
    generate_btn: "🎯 生成配方 brief",
    generating: "⏳ 生成中...",
    pop_adult: "成人", pop_pregnant: "孕妇", pop_child: "儿童 (0-12)", pop_sensitive: "敏感肌",
    price_drugstore: "平价", price_mid: "中端", price_premium: "高端", price_luxury: "奢华",
    actives_title: "🧪 推荐活性物 (浓度 + 角色)",
    avoid_title: "⛔ 避免使用",
    vehicle_title: "🧴 推荐基质",
    notes_title: "💡 配方要点",
    pop_note_title: "⚠️ 特殊人群提示",
    api_link: "🤖 API/MCP",
  },
  en: {
    title: "🎯 Claim to Formula",
    subtitle: "Tell me what to make, I'll give you the formula brief",
    tagline: "For formulators: input population + concern + price tier, get active stack + concentrations + vehicle + warnings.",
    population_label: "Target population",
    price_label: "Price tier",
    concerns_label: "Concern (pick or type)",
    generate_btn: "🎯 Generate Formula Brief",
    generating: "⏳ Generating...",
    pop_adult: "Adult", pop_pregnant: "Pregnant", pop_child: "Child (0-12)", pop_sensitive: "Sensitive",
    price_drugstore: "Drugstore", price_mid: "Mid-range", price_premium: "Premium", price_luxury: "Luxury",
    actives_title: "🧪 Recommended Actives (concentration + role)",
    avoid_title: "⛔ Avoid",
    vehicle_title: "🧴 Vehicle",
    notes_title: "💡 Formulation Notes",
    pop_note_title: "⚠️ Population Note",
    api_link: "🤖 API/MCP",
  },
};

const CONCERNS_ZH = [
  { id: "sensitive_repair", icon: "🛡️", name: "敏感肌修护" },
  { id: "whitening_brightening", icon: "✨", name: "美白淡斑" },
  { id: "anti_aging", icon: "🌟", name: "抗衰老" },
  { id: "anti_acne", icon: "🧹", name: "祛痘控油" },
  { id: "hydrating", icon: "💧", name: "保湿补水" },
  { id: "barrier_repair", icon: "🏰", name: "屏障修复" },
  { id: "antioxidant_anti_pollution", icon: "🛡️", name: "抗氧化" },
  { id: "sunscreen", icon: "☀️", name: "防晒 SPF30+" },
  { id: "exfoliation", icon: "🌿", name: "焕肤去角质" },
  { id: "anti_hair_loss", icon: "💆", name: "防脱生发" },
];

const CONCERNS_EN = [
  { id: "sensitive_repair", icon: "🛡️", name: "Sensitive Repair" },
  { id: "whitening_brightening", icon: "✨", name: "Whitening" },
  { id: "anti_aging", icon: "🌟", name: "Anti-aging" },
  { id: "anti_acne", icon: "🧹", name: "Anti-acne" },
  { id: "hydrating", icon: "💧", name: "Hydration" },
  { id: "barrier_repair", icon: "🏰", name: "Barrier Repair" },
  { id: "antioxidant_anti_pollution", icon: "🛡️", name: "Antioxidant" },
  { id: "sunscreen", icon: "☀️", name: "Sunscreen SPF30+" },
  { id: "exfoliation", icon: "🌿", name: "Exfoliation" },
  { id: "anti_hair_loss", icon: "💆", name: "Anti Hair Loss" },
];

export default function ClaimPage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [population, setPopulation] = useState("sensitive");
  const [priceTier, setPriceTier] = useState("mid");
  const [claimId, setClaimId] = useState("sensitive_repair");
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
  const concerns = isEn ? CONCERNS_EN : CONCERNS_ZH;

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_id: claimId, population, price_tier: priceTier, lang }),
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
          .claim-grid { grid-template-columns: 1fr !important; }
          .concern-chip { font-size: 12px !important; padding: 6px 10px !important; }
        }
        .concern-chip {
          padding: 8px 14px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text);
          white-space: nowrap;
        }
        .concern-chip:hover { background: var(--panel); }
        .concern-chip.active { background: var(--blue); color: white; border-color: var(--blue); }
        .generate-btn {
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
        .generate-btn:disabled { opacity: 0.5; cursor: wait; }
        .generate-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
        }
        .select-input {
          width: 100%;
          padding: 10px;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
        }
        .actives-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .actives-table td { padding: 8px 0; border-bottom: 1px solid var(--border); }
        .actives-table td:first-child { font-family: ui-monospace, monospace; color: var(--orange); }
        .pill { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; margin-right: 4px; }
        .pill-tier { background: var(--border); color: var(--text); }
        .pill-avoid { background: rgba(231,76,60,0.2); color: #e74c3c; }
      `}} />

      <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 8px 0" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="claim-grid">
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{L.population_label}</label>
            <select value={population} onChange={(e) => setPopulation(e.target.value)} className="select-input">
              <option value="adult">{L.pop_adult}</option>
              <option value="pregnant">{L.pop_pregnant}</option>
              <option value="child">{L.pop_child}</option>
              <option value="sensitive">{L.pop_sensitive}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>{L.price_label}</label>
            <select value={priceTier} onChange={(e) => setPriceTier(e.target.value)} className="select-input">
              <option value="drugstore">{L.price_drugstore}</option>
              <option value="mid">{L.price_mid}</option>
              <option value="premium">{L.price_premium}</option>
              <option value="luxury">{L.price_luxury}</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>{L.concerns_label}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {concerns.map(c => (
              <button
                key={c.id}
                onClick={() => setClaimId(c.id)}
                className={`concern-chip ${claimId === c.id ? "active" : ""}`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="generate-btn" style={{ marginTop: "16px" }}>
          {loading ? L.generating : L.generate_btn}
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
          <p style={{ color: "#e74c3c", margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && result.found && (
        <div>
          <div className="card" style={{ background: "rgba(52,152,219,0.1)", border: "1px solid rgba(52,152,219,0.3)" }}>
            <h2 style={{ margin: "0 0 4px 0", color: "var(--accent)" }}>{result.claim.icon} {result.claim.name}</h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>{result.claim.target_demo}</p>
            {result.price_tiers_filtered && (
              <div style={{ marginTop: "6px" }}>
                {result.price_tiers_filtered.map(t => {
                  const label = result.price_tiers_available.find(x => x.tier === t);
                  return label ? <span key={t} className="pill pill-tier">{label.label}</span> : null;
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ margin: "0 0 12px 0", color: "var(--accent)", fontSize: "14px" }}>{L.actives_title}</h3>
            <table className="actives-table">
              <tbody>
                {result.actives.map((a, i) => (
                  <tr key={i}>
                    <td style={{ width: "35%" }}>{a.inci}</td>
                    <td style={{ width: "20%", color: "var(--blue)", fontFamily: "ui-monospace, monospace", fontSize: "12px" }}>{a.pct}</td>
                    <td style={{ color: "var(--muted)", fontSize: "12px" }}>{isEn ? a.role_en : a.role_zh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.avoid && result.avoid.length > 0 && (
            <div className="card" style={{ background: "rgba(231,76,60,0.05)" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#e74c3c", fontSize: "14px" }}>{L.avoid_title}</h3>
              <div>
                {result.avoid.map(a => <span key={a} className="pill pill-avoid">{a}</span>)}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: "14px" }}>{L.vehicle_title}</h3>
            <p style={{ margin: 0, fontSize: "13px" }}>{result.vehicle}</p>
          </div>

          <div className="card" style={{ background: "rgba(241,196,15,0.05)", border: "1px solid rgba(241,196,15,0.3)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#f1c40f", fontSize: "14px" }}>{L.notes_title}</h3>
            <p style={{ margin: 0, fontSize: "13px" }}>{result.notes}</p>
          </div>

          {result.population_note && (
            <div className="card" style={{ background: "rgba(231,76,60,0.05)", border: "1px solid rgba(231,76,60,0.3)" }}>
              <h3 style={{ margin: "0 0 8px 0", color: "#e74c3c", fontSize: "14px" }}>{L.pop_note_title}</h3>
              <p style={{ margin: 0, fontSize: "13px" }}>{result.population_note}</p>
            </div>
          )}
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        {L.api_link}: <a href="/api/mcp" style={{ color: "var(--blue)" }}>MCP server</a> · <a href="/api/claim" style={{ color: "var(--blue)" }}>REST API</a>
      </p>
    </div>
  );
}
