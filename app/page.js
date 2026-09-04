// app/page.js — Home page v2 (INCIDecoder + EWG inspired)
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const TOOL_CARDS = [
  {
    icon: "🔬",
    href: "/formula",
    color: "var(--brand)",
    bg: "var(--brand-light)",
    title_zh: "配方反向工程",
    title_en: "Formula Reverse-Engineering",
    desc_zh: "粘贴任何产品 INCI, 5 秒得类型/活性/价位/风险全报告",
    desc_en: "Paste any INCI, get type / actives / price / risk in 5s",
    tag: "热门",
    tag_en: "Popular",
  },
  {
    icon: "⚖️",
    href: "/risk",
    color: "var(--red)",
    bg: "var(--red-bg)",
    title_zh: "65 规则风险审查",
    title_en: "65-Rule Risk Check",
    desc_zh: "兼容性 / pH / 浓度 / 特殊人群 / 区域合规",
    desc_en: "Compat / pH / conc / special pop / region",
  },
  {
    icon: "🔁",
    href: "/substitute",
    color: "var(--orange)",
    bg: "var(--orange-bg)",
    title_zh: "成分替代",
    title_en: "Ingredient Substitute",
    desc_zh: "被禁/太贵/不可用? 找 3-5 个同功能替代",
    desc_en: "Banned / pricey / unavailable? 3-5 alternatives",
  },
  {
    icon: "🎯",
    href: "/claim",
    color: "var(--purple)",
    bg: "var(--purple-bg)",
    title_zh: "目标反推",
    title_en: "Claim-to-Formula",
    desc_zh: "敏感肌修护 ¥300 → 5 活性 + 浓度 + 基质",
    desc_en: "Sensitive ¥300 cream → 5 actives + conc + base",
  },
  {
    icon: "📚",
    href: "/reference",
    color: "var(--blue)",
    bg: "var(--blue-bg)",
    title_zh: "20 经典参考配方",
    title_en: "20 Classic Reference Formulas",
    desc_zh: "CeraVe / SK-II / 修丽可 / TO / La Mer 公开 INCI",
    desc_en: "CeraVe / SK-II / Skinceuticals / TO / La Mer public INCI",
  },
  {
    icon: "🔍",
    href: "/scan",
    color: "#9b59b6",
    bg: "#f0e8fb",
    title_zh: "30秒扫成分",
    title_en: "30-sec Scan",
    desc_zh: "给 KOL/客户的通俗版成分报告, 0 行业黑话",
    desc_en: "Plain-language report for KOLs and customers",
  },
];

const BROWSE_CARDS = [
  { icon: "🧬", href: "/ingredients", title_zh: "成分库", title_en: "Ingredients", num: "50,169", color: "var(--brand)" },
  { icon: "🇨🇳", href: "/china", title_zh: "中国法规", title_en: "China", num: "8,985", color: "var(--red)" },
  { icon: "⚖️", href: "/regulatory", title_zh: "EU 监管", title_en: "EU Reg", num: "1,927", color: "var(--blue)" },
  { icon: "🛡️", href: "/fda", title_zh: "FDA 事件", title_en: "FDA Events", num: "85,511", color: "var(--orange)" },
  { icon: "🗺️", href: "/sources", title_zh: "数据源", title_en: "Sources", num: "5", color: "var(--green)" },
  { icon: "📈", href: "/trends", title_zh: "2026 趋势", title_en: "Trends", num: "5", color: "var(--purple)" },
];

export default function Home() {
  const [lang, setLang] = useState("zh");
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [stats, setStats] = useState(null);
  const [refCount, setRefCount] = useState(20);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("opencosmetics_lang") || "zh");
    }
    fetch("/api/stats").then(r => r.json()).then(d => setStats(d?.duckdb));
    fetch("/api/reference").then(r => r.json()).then(d => setRefCount(d?.count || 20));
  }, []);

  const isEn = lang === "en";

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .hero {
          padding: 56px 0 36px;
          text-align: center;
        }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px;
          background: var(--brand-light); color: var(--brand);
          border-radius: 999px; font-size: 12px; font-weight: 600;
          margin-bottom: 18px;
        }
        .hero-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800; letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 14px;
          color: var(--text);
        }
        .hero-title .grad {
          background: linear-gradient(135deg, var(--brand) 0%, #b08aff 50%, #ff6ec7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(15px, 1.6vw, 18px);
          color: var(--text-2);
          max-width: 640px; margin: 0 auto 28px;
        }
        .hero-search {
          max-width: 720px; margin: 0 auto;
          display: flex; gap: 8px;
          background: var(--surface);
          border: 2px solid var(--border);
          border-radius: 14px;
          padding: 8px;
          box-shadow: var(--shadow);
          transition: all 0.2s;
        }
        .hero-search:focus-within {
          border-color: var(--brand);
          box-shadow: 0 0 0 3px rgba(110,77,255,0.12), var(--shadow-lg);
        }
        .hero-search input {
          flex: 1; min-width: 0;
          border: 0; background: transparent;
          padding: 10px 14px;
          font-size: 15px; color: var(--text);
          font-family: var(--font-sans);
          outline: none;
        }
        .hero-search button {
          padding: 10px 22px;
          font-size: 14px; font-weight: 600;
          background: var(--brand); color: #fff;
          border: 0; border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .hero-search button:hover { background: var(--brand-dark); }
        .hero-examples {
          margin-top: 12px; font-size: 13px; color: var(--muted);
        }
        .hero-examples a {
          color: var(--brand); margin: 0 4px;
          text-decoration: none;
        }
        .hero-examples a:hover { text-decoration: underline; }

        .hero-stats {
          display: flex; justify-content: center; gap: 36px;
          margin-top: 36px; flex-wrap: wrap;
        }
        .hero-stat { text-align: center; }
        .hero-stat-num {
          font-size: 28px; font-weight: 800;
          background: linear-gradient(135deg, var(--brand) 0%, #b08aff 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        .hero-stat-label { font-size: 12px; color: var(--muted); margin-top: 2px; }

        .section { margin: 48px 0 24px; }
        .section-header {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 18px;
        }
        .section-title {
          font-size: 22px; font-weight: 700; color: var(--text);
          display: flex; align-items: center; gap: 10px;
        }
        .section-title .badge {
          font-size: 12px; font-weight: 600;
          padding: 2px 8px; border-radius: 6px;
          background: var(--brand-light); color: var(--brand);
        }
        .section-link { font-size: 13px; color: var(--brand); }

        /* Tool grid */
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .tool-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          text-decoration: none !important;
          color: var(--text);
          transition: all 0.2s;
          display: flex; flex-direction: column;
          position: relative; overflow: hidden;
        }
        .tool-card::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 60%, var(--brand-light) 100%);
          opacity: 0; transition: opacity 0.2s;
        }
        .tool-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
          border-color: var(--brand);
        }
        .tool-card:hover::before { opacity: 1; }
        .tool-card-icon {
          width: 44px; height: 44px; border-radius: 10px;
          display: grid; place-items: center;
          font-size: 22px;
          background: var(--bg);
          margin-bottom: 14px;
          position: relative; z-index: 1;
        }
        .tool-card-title {
          font-size: 16px; font-weight: 700;
          color: var(--text);
          margin-bottom: 6px;
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 8px;
        }
        .tool-card-tag {
          font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
          padding: 2px 6px; border-radius: 4px;
          background: var(--red); color: #fff;
        }
        .tool-card-desc {
          font-size: 13px; color: var(--text-2);
          line-height: 1.5;
          position: relative; z-index: 1;
        }
        .tool-card-cta {
          font-size: 12px; font-weight: 600; color: var(--brand);
          margin-top: 14px;
          position: relative; z-index: 1;
        }

        /* Browse cards */
        .browse-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .browse-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          text-decoration: none !important;
          color: var(--text);
          transition: all 0.15s;
        }
        .browse-card:hover {
          border-color: var(--brand);
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
        .browse-card-icon { font-size: 22px; margin-bottom: 8px; }
        .browse-card-num {
          font-size: 18px; font-weight: 700; letter-spacing: -0.01em;
          margin-bottom: 2px;
        }
        .browse-card-name {
          font-size: 13px; color: var(--text-2); font-weight: 500;
        }

        /* Reference carousel */
        .ref-row {
          display: flex; gap: 12px; overflow-x: auto;
          padding-bottom: 12px; margin: 0 -4px; padding-left: 4px;
          scrollbar-width: thin;
        }
        .ref-card {
          flex-shrink: 0; width: 240px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          text-decoration: none !important;
          color: var(--text);
          transition: all 0.15s;
        }
        .ref-card:hover {
          border-color: var(--brand);
          transform: translateY(-1px);
          box-shadow: var(--shadow);
        }
        .ref-card-brand { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
        .ref-card-name { font-size: 14px; font-weight: 600; line-height: 1.3; margin-bottom: 4px; }
        .ref-card-tag {
          display: inline-block; padding: 2px 7px;
          font-size: 10px; font-weight: 600;
          background: var(--surface-2); color: var(--text-2);
          border-radius: 999px;
        }

        @media (max-width: 700px) {
          .hero { padding: 32px 0 24px; }
          .hero-stats { gap: 18px; }
          .hero-stat-num { font-size: 22px; }
          .tool-card { padding: 16px; }
        }
      `}} />

      {/* HERO */}
      <section className="hero">
        <div className="hero-tag">
          ✨ {isEn ? "Free · 9 MCP tools · 5 data sources" : "免费 · 9 MCP 工具 · 5 数据源"}
        </div>
        <h1 className="hero-title">
          {isEn
            ? <>Decode any cosmetic <span className="grad">formula</span></>
            : <>反向工程任意<span className="grad">化妆品配方</span></>
          }
        </h1>
        <p className="hero-sub">
          {isEn
            ? "Paste an INCI list, get a 5-second report: type, top actives, vehicle, price tier, safety risks, regulatory status across CN/EU/US."
            : "粘贴成分表, 5 秒出报告: 配方类型、核心活性、基质、价位、安全风险、CN/EU/US 法规状态。"}
        </p>
        <form
          className="hero-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              window.location.href = `/scan?inci=${encodeURIComponent(input.trim())}`;
            }
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isEn ? "Paste INCI list here, e.g. AQUA, GLYCERIN, NIACINAMIDE, ..." : "粘贴成分表, 例如 水, 甘油, 烟酰胺, ..."}
          />
          <button type="submit">{isEn ? "🔍 Scan" : "🔍 扫"}</button>
        </form>
        <div className="hero-examples">
          {isEn ? "Try:" : "试试:"}
          <a href="/scan?inci=AQUA%2C%20NIACINAMIDE%2C%20GLYCERIN%2C%20SQUALANE%2C%20TOCOPHEROL%2C%20PHENOXYETHANOL">
            {isEn ? "whitening serum" : "美白精华"}
          </a>
          ·
          <a href="/scan?inci=AQUA%2C%20GLYCERIN%2C%20CERAMIDE%20NP%2C%20CENTELLA%20ASIATICA%2C%20MADECASSOSIDE%2C%20PANTHENOL%2C%20SQUALANE">
            {isEn ? "sensitive cream" : "敏感肌面霜"}
          </a>
          ·
          <a href="/formula">{isEn ? "or pick a tool →" : "或选工具 →"}</a>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-num">50K+</div>
            <div className="hero-stat-label">{isEn ? "EU CosIng" : "EU 成分库"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">8.9K</div>
            <div className="hero-stat-label">{isEn ? "CN IECIC" : "中国 IECIC"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">1,927</div>
            <div className="hero-stat-label">{isEn ? "EU Annexes" : "EU 监管"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">85K</div>
            <div className="hero-stat-label">{isEn ? "FDA events" : "FDA 事件"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">65</div>
            <div className="hero-stat-label">{isEn ? "Risk rules" : "风险规则"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-num">9</div>
            <div className="hero-stat-label">{isEn ? "MCP tools" : "MCP 工具"}</div>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            🛠 {isEn ? "Tools" : "工具"}
            <span className="badge">{isEn ? "BETA" : "推荐"}</span>
          </h2>
          <Link href="/api/mcp" className="section-link">{isEn ? "MCP server →" : "MCP server →"}</Link>
        </div>
        <div className="tool-grid">
          {TOOL_CARDS.map((t, i) => (
            <Link key={i} href={t.href} className="tool-card">
              <div className="tool-card-icon" style={{ background: t.bg, color: t.color }}>
                {t.icon}
              </div>
              <div className="tool-card-title">
                {isEn ? t.title_en : t.title_zh}
                {(t.tag || t.tag_en) && <span className="tool-card-tag">{isEn ? t.tag_en : t.tag}</span>}
              </div>
              <div className="tool-card-desc">{isEn ? t.desc_en : t.desc_zh}</div>
              <div className="tool-card-cta">{isEn ? "Try now →" : "立即使用 →"}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BROWSE DATA */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">📚 {isEn ? "Browse data" : "浏览数据"}</h2>
          <Link href="/sources" className="section-link">{isEn ? "All sources →" : "所有数据源 →"}</Link>
        </div>
        <div className="browse-grid">
          {BROWSE_CARDS.map((b, i) => (
            <Link key={i} href={b.href} className="browse-card">
              <div className="browse-card-icon">{b.icon}</div>
              <div className="browse-card-num" style={{ color: b.color }}>{b.num}</div>
              <div className="browse-card-name">{isEn ? b.title_en : b.title_zh}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* REFERENCE FORMULAS */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">📖 {isEn ? "Reference formulas" : "参考配方库"}</h2>
          <Link href="/reference" className="section-link">{isEn ? `View all ${refCount} →` : `查看全部 ${refCount} →`}</Link>
        </div>
        <div className="ref-row">
          {[
            { brand: "The Ordinary", name_zh: "烟酰胺 10% + 锌 1%", name_en: "Niacinamide 10% + Zinc 1%", tag: "精华液 / Essence" },
            { brand: "CeraVe", name_zh: "保湿面霜", name_en: "Moisturizing Cream", tag: "面霜 / Cream" },
            { brand: "SK-II", name_zh: "神仙水", name_en: "Facial Treatment Essence", tag: "精华水 / Essence" },
            { brand: "Skinceuticals", name_zh: "CE Ferulic 精华", name_en: "CE Ferulic", tag: "精华液 / Serum" },
            { brand: "La Roche-Posay", name_zh: "UVMUNE 400 防晒", name_en: "UVMUNE 400", tag: "防晒 / Sunscreen" },
            { brand: "Estée Lauder", name_zh: "小棕瓶 ANR", name_en: "Advanced Night Repair", tag: "精华液 / Serum" },
            { brand: "The Ordinary", name_zh: "AHA 30% + BHA 2% 焕肤", name_en: "AHA 30% + BHA 2% Peel", tag: "精华液 / Peel" },
            { brand: "La Mer", name_zh: "海蓝之谜面霜", name_en: "Moisturizing Cream", tag: "面霜 / Cream" },
          ].map((r, i) => (
            <Link key={i} href="/reference" className="ref-card">
              <div className="ref-card-brand">{r.brand}</div>
              <div className="ref-card-name">{isEn ? r.name_en : r.name_zh}</div>
              <span className="ref-card-tag">{r.tag}</span>
            </Link>
          ))}
        </div>
      </section>

      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 32 }}>
        {isEn
          ? "B2B toolset for formulators. Data: EU CosIng, CN IECIC, FDA, MoCRA. Free, no login, MCP-compatible."
          : "B2B 配方师工具集。数据: EU CosIng / CN IECIC / FDA / MoCRA。免费, 无需登录, 支持 MCP。"}
      </p>
    </div>
  );
}
