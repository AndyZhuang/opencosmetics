// components/TopNav.js — 配方引擎主导航 (桌面: 横排; 移动: 横向滚动)
import Link from "next/link";

const PRIMARY = [
  { href: "/", zh: "工作台", en: "Workbench" },
  { href: "/bench", zh: "配方构建器", en: "Builder" },
  { href: "/formulas", zh: "我的配方", en: "My Formulas" },
  { href: "/ingredients", zh: "成分库", en: "Ingredients" },
];

const TOOLS = [
  { href: "/risk", label_zh: "风险审查", label_en: "Risk" },
  { href: "/substitute", label_zh: "成分替代", label_en: "Substitute" },
  { href: "/claim", label_zh: "目标反推", label_en: "Claim → Formula" },
  { href: "/reference", label_zh: "参考配方", label_en: "Reference" },
  { href: "/formula", label_zh: "配方反查", label_en: "Reverse" },
  { href: "/trends", label_zh: "行业趋势", label_en: "Trends" },
  { href: "/china", label_zh: "中国 IECIC", label_en: "CN IECIC" },
  { href: "/fda", label_zh: "FDA 事件", label_en: "FDA" },
  { href: "/regulatory", label_zh: "法规地图", label_en: "Regulatory" },
];

export default function TopNav({ lang, current }) {
  const isZh = lang !== "en";
  return (
    <nav className="fl-nav">
      <div className="fl-nav-inner">
        <Link href="/" className="fl-brand">
          <span className="fl-mark">FL</span>
          <span className="fl-brand-text">
            <b>{isZh ? "配方引擎" : "FormulaLab"}</b>
            <i>{isZh ? "美妆配方工作台" : "Cosmetic Formulation Workbench"}</i>
          </span>
        </Link>

        <div className="fl-nav-links">
          {PRIMARY.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`fl-nav-link${current === p.href ? " active" : ""}`}
            >
              {isZh ? p.zh : p.en}
            </Link>
          ))}
        </div>

        <div className="fl-nav-tools">
          <span className="fl-nav-label">{isZh ? "工具" : "Tools"}</span>
          {TOOLS.map((x) => (
            <Link key={x.href} href={x.href} className={`fl-nav-tool${current === x.href ? " active" : ""}`}>
              {isZh ? x.label_zh : x.label_en}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
