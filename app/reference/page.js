// app/reference/page.js — Reference Formulas library (mobile + desktop)
"use client";
import { useState, useEffect } from "react";

const LABELS = {
  zh: {
    title: "📚 参考配方库",
    subtitle: "20 经典商业配方公开 INCI",
    tagline: "为配方师学习: 看 '做得好' 的产品长什么样, 作为新配方的起点。",
    search_placeholder: "搜索 INCI / 品牌 / 类别, 例如: NIACINAMIDE, The Ordinary, 神经酰胺",
    filter_all: "全部",
    filter_brand: "品牌",
    filter_category: "类别",
    actives_label: "关键活性物",
    full_inci_label: "完整 INCI",
    notes_label: "配方要点",
    target_demo: "目标人群",
    vehicle: "基质",
    no_results: "未找到匹配的配方",
  },
  en: {
    title: "📚 Reference Formulas",
    subtitle: "20 classic commercial formulas with public INCI",
    tagline: "For formulator learning: see what 'good' products look like, use as starting points.",
    search_placeholder: "Search INCI / brand / category, e.g. NIACINAMIDE, The Ordinary, ceramide",
    filter_all: "All",
    filter_brand: "Brand",
    filter_category: "Category",
    actives_label: "Key Actives",
    full_inci_label: "Full INCI",
    notes_label: "Notes",
    target_demo: "Target Demographic",
    vehicle: "Vehicle",
    no_results: "No matching formulas",
  },
};

const CATEGORY_TRANSLATE = {
  "精华液": "Essence / Serum",
  "面霜": "Cream",
  "精华水": "Essence / Toner",
  "防晒霜": "Sunscreen",
  "卸妆水": "Micellar Water",
  "修护霜": "Repair Balm",
  "爽肤水": "Toning Solution",
};

export default function ReferencePage() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("opencosmetics_lang") || "zh");
    }
    fetch("/api/reference").then(r => r.json()).then(setData);
  }, []);

  const isEn = lang === "en";
  const L = isEn ? LABELS.en : LABELS.zh;

  const allFormulas = data?.formulas || [];
  const filtered = allFormulas.filter(f => {
    if (activeCategory && f.category !== activeCategory && f.category_en !== activeCategory) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        f.name_zh?.toLowerCase().includes(q) ||
        f.name_en?.toLowerCase().includes(q) ||
        f.brand?.toLowerCase().includes(q) ||
        f.tag?.toLowerCase().includes(q) ||
        f.key_actives?.some(a => a.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Extract unique categories
  const categories = [...new Set(allFormulas.map(f => f.category))].sort();
  const categoryOptions = categories.flatMap(c => {
    const en = CATEGORY_TRANSLATE[c] || c;
    return [{ zh: c, en: en, key: c }];
  });

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .ref-card { padding: 12px !important; }
          .ref-stats { grid-template-columns: 1fr 1fr !important; }
          .ref-grid { grid-template-columns: 1fr !important; }
        }
        .ref-input {
          width: 100%;
          padding: 12px 16px;
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
        }
        .ref-input:focus { outline: 2px solid var(--blue); }
        .category-chip {
          padding: 6px 12px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text);
          white-space: nowrap;
        }
        .category-chip:hover { background: var(--panel); }
        .category-chip.active { background: var(--blue); color: white; border-color: var(--blue); }
        .ref-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
        }
        .ref-card h3 { color: var(--accent); margin: 0 0 4px 0; font-size: 16px; }
        .ref-meta { color: var(--muted); font-size: 12px; margin-bottom: 8px; }
        .ref-inci { font-family: ui-monospace, monospace; font-size: 11px; color: var(--muted); line-height: 1.5; background: var(--bg); padding: 8px; border-radius: 4px; word-break: break-word; }
        .ref-actives { display: flex; gap: 4px; flex-wrap: wrap; margin: 6px 0; }
        .ref-active-pill { background: rgba(52,152,219,0.2); color: #3498db; padding: 2px 8px; border-radius: 8px; font-size: 11px; }
        .ref-tier-pill { background: var(--border); padding: 2px 8px; border-radius: 8px; font-size: 11px; }
      `}} />

      <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 8px 0" }}>{L.title}</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: "0 0 4px 0" }}>{L.subtitle}</p>
      <p style={{ color: "var(--muted)", fontSize: "12px", margin: "0 0 16px 0" }}>{L.tagline}</p>

      <div className="ref-card">
        <input
          className="ref-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L.search_placeholder}
        />
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setActiveCategory("")} className={`category-chip ${activeCategory === "" ? "active" : ""}`}>
            {L.filter_all}
          </button>
          {categoryOptions.map(c => (
            <button key={c.key} onClick={() => setActiveCategory(c.key)} className={`category-chip ${activeCategory === c.key ? "active" : ""}`}>
              {isEn ? c.en : c.zh}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--muted)" }}>
          {filtered.length} / {allFormulas.length}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="ref-card" style={{ textAlign: "center", color: "var(--muted)" }}>
          {L.no_results}
        </div>
      )}

      {filtered.map((f, i) => (
        <div key={i} className="ref-card">
          <h3>{isEn ? f.name_en : f.name_zh}</h3>
          <div className="ref-meta">
            <span style={{ color: "var(--blue)" }}>{f.brand}</span>
            <span> · {f.year}</span>
            <span> · {isEn ? f.category_en : f.category}</span>
            <span> · <span className="ref-tier-pill">{f.price_tier}</span></span>
            <span> · {f.tag}</span>
          </div>
          {f.target_demo && (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{L.target_demo}: {f.target_demo}</div>
          )}
          <div style={{ marginTop: "8px" }}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>{L.actives_label}</div>
            <div className="ref-actives">
              {(f.key_actives || []).map((a, j) => <span key={j} className="ref-active-pill">{a}</span>)}
            </div>
          </div>
          {f.vehicle && (
            <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "6px" }}>
              <strong>{L.vehicle}:</strong> {f.vehicle}
            </div>
          )}
          <details style={{ marginTop: "8px" }}>
            <summary style={{ fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>{L.full_inci_label} ({f.inci?.split(",").length || 0})</summary>
            <div className="ref-inci">{f.inci}</div>
          </details>
          <details style={{ marginTop: "4px" }}>
            <summary style={{ fontSize: "12px", color: "var(--muted)", cursor: "pointer" }}>{L.notes_label}</summary>
            <div style={{ fontSize: "12px", color: "var(--text)", marginTop: "4px" }}>
              {isEn ? f.notes_en : f.notes_zh}
            </div>
          </details>
        </div>
      ))}

      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "24px" }}>
        API: <a href="/api/reference" style={{ color: "var(--blue)" }}>REST</a> · MCP: <a href="/api/mcp" style={{ color: "var(--blue)" }}>reference_formulas</a>
      </p>
    </div>
  );
}
