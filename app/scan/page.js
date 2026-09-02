// app/scan/page.js — B2C Consumer Scan (paste INCI, get 30-second report)
"use client";
import { useState } from "react";

const LABELS = {
  zh: {
    title: "🔍 30秒扫成分",
    subtitle: "粘贴任何产品的成分表, 拿到通俗易懂的报告",
    tagline: "为爱美女生设计: 告诉你这是什么产品、有什么活性、要小心什么。",
    input_label: "粘贴产品成分表 (INCI)",
    input_placeholder: "复制产品包装上的成分表, 粘贴到这里\n例:\n水, 甘油, 烟酰胺, 透明质酸, 角鲨烷, 维生素 E, 苯氧乙醇",
    scan_btn: "🔍 扫描",
    scanning: "⏳ 扫描中...",
    result_what: "📦 这是什么产品",
    result_actives: "✨ 核心活性",
    result_cautions: "⚠️ 需要注意",
    result_for_who: "👥 适合谁 / 不适合谁",
    result_score: "🏆 总体评分",
    score_good: "👍 推荐",
    score_ok: "👌 还行",
    score_caution: "⚠️ 谨慎",
    score_avoid: "🚫 避免",
    try_examples: "💡 试试这些",
    error_no_ingredients: "未检测到成分, 请粘贴至少 1 个 INCI 名",
    api_link: "API",
  },
  en: {
    title: "🔍 30-Second Ingredient Scan",
    subtitle: "Paste any product's INCI list, get a human-friendly report",
    tagline: "For beauty consumers: learn what this product is, what actives it has, what to watch for.",
    input_label: "Paste product ingredients (INCI)",
    input_placeholder: "Copy the ingredient list from the back of the product, paste here\ne.g.\nAQUA, GLYCERIN, NIACINAMIDE, HYALURONIC ACID, SQUALANE, TOCOPHEROL, PHENOXYETHANOL",
    scan_btn: "🔍 Scan",
    scanning: "⏳ Scanning...",
    result_what: "📦 What is this product",
    result_actives: "✨ Key actives",
    result_cautions: "⚠️ Watch out for",
    result_for_who: "👥 For / Not for",
    result_score: "🏆 Overall score",
    score_good: "👍 Recommended",
    score_ok: "👌 OK",
    score_caution: "⚠️ Use with care",
    score_avoid: "🚫 Avoid",
    try_examples: "💡 Try these",
    error_no_ingredients: "No ingredients detected, please paste at least 1 INCI name",
    api_link: "API",
  },
};

const EXAMPLE_SCANS = {
  zh: [
    {
      label: "美白精华 (The Ordinary)",
      inci: "AQUA, NIACINAMIDE, GLYCERIN, ZINC PCA, TRANEXAMIC ACID, ALOE BARBADENSIS LEAF JUICE, PANTHENOL, ALLANTOIN, XANTHAN GUM, PHENOXYETHANOL, ETHYLHEXYLGLYCERIN",
    },
    {
      label: "敏感肌面霜 (薇诺娜)",
      inci: "AQUA, GLYCERIN, SQUALANE, BUTYROSPERMUM PARKII BUTTER, CERAMIDE NP, CENTELLA ASIATICA EXTRACT, MADECASSOSIDE, ALLANTOIN, PANTHENOL, BISABOLOL, TOCOPHEROL, CETEARYL ALCOHOL, GLYCERYL STEARATE, PHENOXYETHANOL",
    },
    {
      label: "化学防晒霜",
      inci: "AQUA, OCTINOXATE, AVOBENZONE, OCTOCRYLENE, HOMOSALATE, GLYCERIN, BUTYLENE GLYCOL, TOCOPHEROL, ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER, PHENOXYETHANOL",
    },
    {
      label: "抗老精华 (A 醇)",
      inci: "AQUA, GLYCERIN, RETINOL, SQUALANE, TOCOPHEROL, FERULIC ACID, NIACINAMIDE, HYALURONIC ACID, BISABOLOL, BHT, PHENOXYETHANOL",
    },
  ],
  en: [
    {
      label: "Whitening serum (The Ordinary)",
      inci: "AQUA, NIACINAMIDE, GLYCERIN, ZINC PCA, TRANEXAMIC ACID, ALOE BARBADENSIS LEAF JUICE, PANTHENOL, ALLANTOIN, XANTHAN GUM, PHENOXYETHANOL, ETHYLHEXYLGLYCERIN",
    },
    {
      label: "Sensitive cream (CeraVe style)",
      inci: "AQUA, GLYCERIN, SQUALANE, BUTYROSPERMUM PARKII BUTTER, CERAMIDE NP, CENTELLA ASIATICA EXTRACT, MADECASSOSIDE, ALLANTOIN, PANTHENOL, BISABOLOL, TOCOPHEROL, CETEARYL ALCOHOL, GLYCERYL STEARATE, PHENOXYETHANOL",
    },
    {
      label: "Chemical sunscreen",
      inci: "AQUA, OCTINOXATE, AVOBENZONE, OCTOCRYLENE, HOMOSALATE, GLYCERIN, BUTYLENE GLYCOL, TOCOPHEROL, ACRYLATES/C10-30 ALKYL ACRYLATE CROSSPOLYMER, PHENOXYETHANOL",
    },
    {
      label: "Anti-aging (Retinol)",
      inci: "AQUA, GLYCERIN, RETINOL, SQUALANE, TOCOPHEROL, FERULIC ACID, NIACINAMIDE, HYALURONIC ACID, BISABOLOL, BHT, PHENOXYETHANOL",
    },
  ],
};

function computeConsumerScore(result) {
  let score = 100;
  const issues = [];

  // EU banned = big penalty
  if (result.stats.eu_banned > 0) {
    score -= 50;
    issues.push({ severity: "block", text: `${result.stats.eu_banned} 种 EU 禁用成分` });
  }
  // EU restricted = small penalty
  if (result.stats.eu_restricted > 0) {
    score -= 15;
  }
  // Risk blocks
  if (result.risk_summary.block_count > 0) {
    score -= 30;
    issues.push({ severity: "block", text: `${result.risk_summary.block_count} 项安全规则不通过` });
  }
  if (result.risk_summary.warn_count > 0) {
    score -= Math.min(15, result.risk_summary.warn_count * 3);
  }
  // No preservative (only if water-based)
  const hasWater = result.ingredients.some(i => i.inci_name === "AQUA" || i.inci_name === "WATER");
  const hasPreservative = result.ingredients.some(i => /PHENOXYETHANOL|ETHYLHEXYLGLYCERIN|SODIUM BENZOATE|POTASSIUM SORBATE|BENZYL ALCOHOL/i.test(i.inci_name));
  if (hasWater && !hasPreservative) {
    score -= 10;
    issues.push({ severity: "warn", text: "未检测到防腐剂, 微生物风险" });
  }
  // Actives
  if (result.actives.top3.length >= 3) score += 10;
  else if (result.actives.top3.length >= 1) score += 5;

  score = Math.max(0, Math.min(100, score));
  let tier;
  if (score >= 80) tier = "good";
  else if (score >= 60) tier = "ok";
  else if (score >= 40) tier = "caution";
  else tier = "avoid";
  return { score, tier, issues };
}

export default function ScanPage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState(EXAMPLE_SCANS.zh[0].inci);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Read lang from localStorage on mount
  if (typeof window !== "undefined" && !mounted) {
    setMounted(true);
    const stored = localStorage.getItem("opencosmetics_lang") || "zh";
    if (stored !== lang) {
      setLang(stored);
      setInput(EXAMPLE_SCANS[stored]?.[0]?.inci || EXAMPLE_SCANS.zh[0].inci);
    }
  }

  const isEn = lang === "en";
  const L = isEn ? LABELS.en : LABELS.zh;
  const examples = isEn ? EXAMPLE_SCANS.en : EXAMPLE_SCANS.zh;

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/formula/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: input, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.ingredients || data.ingredients.length === 0) {
        throw new Error(L.error_no_ingredients);
      }
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
          .scan-card { padding: 12px !important; }
          .scan-grid { grid-template-columns: 1fr !important; }
        }
        .scan-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          min-height: 120px;
          width: 100%;
          padding: 12px;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          resize: vertical;
        }
        .scan-input:focus { outline: 2px solid var(--blue); }
        .scan-btn {
          width: 100%;
          padding: 14px 20px;
          background: var(--blue);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        }
        .scan-btn:disabled { opacity: 0.5; cursor: wait; }
        .scan-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
        }
        .card-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px 0;
          color: var(--accent);
        }
        .score-circle {
          display: inline-block;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          line-height: 60px;
          text-align: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          margin-right: 12px;
        }
        .score-good { background: #2ecc71; }
        .score-ok { background: #3498db; }
        .score-caution { background: #f39c12; }
        .score-avoid { background: #e74c3c; }
        .active-pill {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(46,204,113,0.2);
          color: #2ecc71;
          border-radius: 16px;
          font-size: 13px;
          margin: 4px 4px 4px 0;
        }
        .warn-pill {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(243,156,18,0.2);
          color: #f39c12;
          border-radius: 16px;
          font-size: 13px;
          margin: 4px 4px 4px 0;
        }
        .block-pill {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(231,76,60,0.2);
          color: #e74c3c;
          border-radius: 16px;
          font-size: 13px;
          margin: 4px 4px 4px 0;
        }
        .example-btn {
          padding: 6px 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text);
        }
        .example-btn:hover { background: var(--blue); color: white; }
      `}} />

      <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", margin: "0 0 8px 0", color: "var(--accent)" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      <div className="card">
        <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px" }}>{L.input_label}</label>
        <textarea
          className="scan-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={L.input_placeholder}
        />
        <button onClick={scan} disabled={loading || !input.trim()} className="scan-btn" style={{ marginTop: "12px" }}>
          {loading ? L.scanning : L.scan_btn}
        </button>
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>{L.try_examples}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {examples.map((e, i) => (
              <button key={i} onClick={() => setInput(e.inci)} className="example-btn">{e.label}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)" }}>
          <p style={{ color: "#e74c3c", margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {result && (() => {
        const consumer = computeConsumerScore(result);
        return (
          <div>
            {/* Score card */}
            <div className="card" style={{ background: "rgba(52,152,219,0.05)", border: "1px solid rgba(52,152,219,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className={`score-circle score-${consumer.tier}`}>{consumer.score}</div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{L.result_score}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: `var(--${consumer.tier === "good" ? "green" : consumer.tier === "ok" ? "blue" : "red"})` }}>
                    {L[`score_${consumer.tier}`]}
                  </div>
                </div>
              </div>
              {consumer.issues.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  {consumer.issues.map((issue, i) => (
                    <div key={i} className={issue.severity === "block" ? "block-pill" : "warn-pill"} style={{ display: "block", margin: "4px 0" }}>
                      {issue.severity === "block" ? "🚫" : "⚠️"} {issue.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What is this */}
            <div className="card">
              <h3 className="card-title">{L.result_what}</h3>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>{result.type_zh}</div>
              <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>{result.target_demographic_zh} · {result.price_tier_zh}</div>
            </div>

            {/* Key actives */}
            {result.actives.top3.length > 0 && (
              <div className="card">
                <h3 className="card-title">{L.result_actives}</h3>
                <div>
                  {result.actives.top3.map((a, i) => (
                    <div key={i} className="active-pill" style={{ fontSize: "14px", padding: "6px 14px" }}>
                      ✓ {a.ingredient}
                      {a.category_name_zh && <span style={{ color: "var(--muted)", marginLeft: "4px" }}>({a.category_name_zh})</span>}
                    </div>
                  ))}
                </div>
                {result.actives.categories.length > 0 && (
                  <div style={{ marginTop: "10px", fontSize: "13px", color: "var(--muted)" }}>
                    {result.actives.categories.length} 类活性: {result.actives.categories.map(c => c).join("、")}
                  </div>
                )}
              </div>
            )}

            {/* Cautions */}
            {(result.stats.eu_banned > 0 || result.stats.eu_restricted > 0 || result.risk_summary.block_count > 0 || result.risk_summary.warn_count > 0) && (
              <div className="card" style={{ background: consumer.tier === "good" ? "transparent" : "rgba(243,156,18,0.05)" }}>
                <h3 className="card-title">{L.result_cautions}</h3>
                {result.stats.eu_banned > 0 && (
                  <div className="block-pill" style={{ display: "block" }}>🚫 {result.stats.eu_banned} 种 EU 禁用成分 (Annex II) — 在欧盟购买/销售要小心</div>
                )}
                {result.stats.eu_restricted > 0 && (
                  <div className="warn-pill" style={{ display: "block" }}>⚠️ {result.stats.eu_restricted} 种 EU 限用成分 (Annex III)</div>
                )}
                {result.risk_summary.block_count > 0 && (
                  <div className="block-pill" style={{ display: "block" }}>🚫 {result.risk_summary.block_count} 项安全规则不通过 — 含强刺激或禁用组合</div>
                )}
                {result.risk_summary.warn_count > 0 && (
                  <div className="warn-pill" style={{ display: "block" }}>⚠️ {result.risk_summary.warn_count} 项安全警告</div>
                )}
              </div>
            )}

            {/* For who */}
            <div className="card">
              <h3 className="card-title">{L.result_for_who}</h3>
              <div style={{ fontSize: "14px", lineHeight: 1.6 }}>
                <div style={{ color: "#2ecc71" }}>✓ 适合: {result.target_demographic_zh}</div>
                {result.ingredients.some(i => /RETINOIC ACID|RETINOL|AHA|BHA/i.test(i.inci_name)) && (
                  <div style={{ color: "#e74c3c" }}>✗ 孕妇/敏感肌慎用: 含 A 醇或酸类</div>
                )}
                {result.ingredients.some(i => /FRAGRANCE|PARFUM/i.test(i.inci_name)) && (
                  <div style={{ color: "#f39c12" }}>✗ 香精敏感者: 含香精</div>
                )}
                {result.ingredients.some(i => /ALCOHOL DENAT|ETHANOL/i.test(i.inci_name)) && result.ingredients.findIndex(i => /ALCOHOL DENAT|ETHANOL/i.test(i.inci_name)) < 5 && (
                  <div style={{ color: "#f39c12" }}>✗ 干敏肌: 成分表前列有酒精</div>
                )}
                <div style={{ color: "var(--muted)", marginTop: "8px", fontSize: "12px" }}>
                  价位: {result.price_tier_zh} · {result.vehicle.primary}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        {L.api_link}: <a href="/api/formula/analyze" style={{ color: "var(--blue)" }}>REST</a> · <a href="/api/mcp" style={{ color: "var(--blue)" }}>MCP</a>
      </p>
    </div>
  );
}
