// app/trends/page.js — Industry Trends feed
"use client";
import { useState, useEffect } from "react";

const LABELS = {
  zh: {
    title: "📈 行业趋势",
    subtitle: "2026 化妆品行业新动向: 成分增长信号 / K-beauty / 生物科技",
    tagline: "为配方师设计的快讯: 哪些活性物在涨, 哪些在跌, 哪些是 2026 新赛道。",
    actives_title: "🔥 跨趋势热门成分",
    region_label: "地区焦点",
    growth_label: "增长率",
    source_label: "数据来源",
    active_label: "活性物",
    actives_count: "跨 N 个趋势出现",
    view_formulas: "看参考配方 →",
    view_substitutes: "找替代 →",
    note_label: "📌 数据说明",
  },
  en: {
    title: "📈 Industry Trends",
    subtitle: "2026 cosmetics industry signals: ingredient growth / K-beauty / biotech",
    tagline: "For formulators: what's growing, what's fading, what's the new 2026 lane.",
    actives_title: "🔥 Cross-trend hot actives",
    region_label: "Region focus",
    growth_label: "Growth",
    source_label: "Sources",
    active_label: "Actives",
    actives_count: "in N trends",
    view_formulas: "View reference formulas →",
    view_substitutes: "Find substitutes →",
    note_label: "📌 Data note",
  },
};

const REGION_FLAGS = {
  CN: "🇨🇳 CN",
  KR: "🇰🇷 KR",
  JP: "🇯🇵 JP",
  EU: "🇪🇺 EU",
  US: "🇺🇸 US",
  Global: "🌍 Global",
};

export default function TrendsPage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("opencosmetics_lang") || "zh");
    }
    Promise.all([
      fetch("/api/trends").then(r => r.json()),
      fetch("/api/trends?summary=1").then(r => r.json()),
    ]).then(([all, summary]) => {
      setData({ trends: all.trends || [], meta: all.meta || {}, actives_summary: summary.actives_summary || [] });
    });
  }, []);

  const isEn = lang === "en";
  const L = isEn ? LABELS.en : LABELS.zh;
  const trends = data?.trends || [];
  const summary = data?.actives_summary || [];

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .trend-card { padding: 12px !important; }
          .trend-grid { grid-template-columns: 1fr !important !important; }
        }
        .trend-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
        }
        .trend-card h3 {
          color: var(--accent);
          margin: 0 0 4px 0;
          font-size: 18px;
        }
        .trend-summary {
          color: var(--muted);
          font-size: 13px;
          margin: 8px 0;
          line-height: 1.6;
        }
        .region-tag {
          display: inline-block;
          padding: 2px 8px;
          background: var(--border);
          border-radius: 8px;
          font-size: 11px;
          margin-right: 4px;
        }
        .growth-pill {
          display: inline-block;
          padding: 3px 10px;
          background: rgba(46,204,113,0.2);
          color: #2ecc71;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin: 2px;
        }
        .growth-new { background: rgba(155,89,182,0.2); color: #9b59b6; }
        .growth-stable { background: rgba(149,165,166,0.2); color: #95a5a6; }
        .actives-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }
        .active-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
        }
        .active-name { color: var(--orange); font-family: ui-monospace, monospace; font-size: 12px; font-weight: 600; }
        .active-note { font-size: 11px; color: var(--muted); margin-top: 4px; }
      `}} />

      <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 8px 0" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      {data?.meta?.note && (
        <div style={{ background: "rgba(241,196,15,0.1)", border: "1px solid rgba(241,196,15,0.3)", borderRadius: "8px", padding: "8px 12px", margin: "12px 0", fontSize: "12px", color: "var(--muted)" }}>
          {L.note_label}: {data.meta.note}
        </div>
      )}

      {/* Cross-trend hot actives */}
      {summary.length > 0 && (
        <div className="trend-card">
          <h3 style={{ fontSize: "16px" }}>{L.actives_title}</h3>
          <div className="actives-grid">
            {summary.slice(0, 12).map((s, i) => (
              <div key={i} className="active-card">
                <div className="active-name">{s.inci}</div>
                <div className="active-note">{L.actives_count.replace("N", s.mentions)} · max {s.max_growth}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend cards */}
      {trends.map((t, i) => (
        <div key={i} className="trend-card">
          <h3>{isEn ? t.title_en : t.title_zh}</h3>
          <div className="region-tag" style={{ marginRight: "8px" }}>
            {(t.region_focus || []).map(r => REGION_FLAGS[r] || r).join(" · ")}
          </div>

          <div className="trend-summary">{isEn ? t.summary_en : t.summary_zh}</div>

          <div style={{ marginTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{L.active_label}</div>
            <div>
              {(t.active_ingredients || []).map((ai, j) => {
                const cls = ai.growth === "new" ? "growth-new" :
                            ai.growth === "stable" ? "growth-stable" : "";
                return (
                  <span key={j} className={`growth-pill ${cls}`} title={isEn ? "" : ai.note_zh}>
                    {ai.inci} {ai.growth}
                  </span>
                );
              })}
            </div>
          </div>

          {t.source_signals && t.source_signals.length > 0 && (
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
              <strong>{L.source_label}:</strong> {t.source_signals.join(" · ")}
            </div>
          )}

          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
            <a href={`/reference?q=${encodeURIComponent((t.active_ingredients || [])[0]?.inci || "")}`} style={{ fontSize: "12px", color: "var(--blue)" }}>{L.view_formulas}</a>
            <a href={`/substitute?inci=${encodeURIComponent((t.active_ingredients || [])[0]?.inci || "")}`} style={{ fontSize: "12px", color: "var(--blue)" }}>{L.view_substitutes}</a>
          </div>
        </div>
      ))}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        API: <a href="/api/trends" style={{ color: "var(--blue)" }}>REST</a> · <a href="/api/mcp" style={{ color: "var(--blue)" }}>industry_trends</a>
      </p>
    </div>
  );
}
