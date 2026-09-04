// app/layout.js — Top nav with prominent "工具" mega-menu
import Link from "next/link";
import { cookies } from "next/headers";
import LangSwitcher from "../components/LangSwitcher";
import { t, getLangFromCookies } from "../lib/i18n";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = await getLangFromCookies(cookieStore);

  return (
    <html lang={lang === "en" ? "en" : "zh-CN"}>
      <body>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: `
          .top-nav {
            position: sticky; top: 0; z-index: 100;
            background: rgba(255,255,255,0.85);
            backdrop-filter: saturate(180%) blur(12px);
            -webkit-backdrop-filter: saturate(180%) blur(12px);
            border-bottom: 1px solid var(--border);
          }
          .top-nav-inner {
            max-width: 1280px; margin: 0 auto;
            padding: 12px 24px;
            display: flex; align-items: center; gap: 18px;
          }
          .top-nav-brand {
            display: flex; align-items: center; gap: 8px;
            color: var(--text); font-weight: 800; font-size: 17px;
            letter-spacing: -0.02em;
          }
          .top-nav-brand .logo {
            width: 28px; height: 28px; border-radius: 8px;
            background: linear-gradient(135deg, var(--brand) 0%, #b08aff 100%);
            color: #fff; display: grid; place-items: center;
            font-weight: 800; font-size: 16px;
            box-shadow: var(--shadow);
          }
          .nav-link {
            color: var(--text-2);
            font-size: 14px; font-weight: 500;
            padding: 6px 10px; border-radius: 6px;
            transition: all 0.15s;
          }
          .nav-link:hover { color: var(--text); background: var(--surface-2); text-decoration: none; }
          .nav-link.active { color: var(--brand); background: var(--brand-light); }
          .nav-link.primary {
            background: var(--brand); color: #fff; font-weight: 600;
            padding: 8px 14px;
          }
          .nav-link.primary:hover { background: var(--brand-dark); color: #fff; }
          .nav-divider { width: 1px; height: 22px; background: var(--border); }
          .nav-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

          /* Mega menu (tools dropdown) */
          .mega-trigger { position: relative; }
          .mega-trigger:hover .mega-menu, .mega-trigger:focus-within .mega-menu {
            opacity: 1; transform: translateY(0); pointer-events: auto;
          }
          .mega-menu {
            position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(6px);
            width: 640px; max-width: 96vw;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 14px; box-shadow: var(--shadow-lg);
            padding: 18px;
            opacity: 0; pointer-events: none; transition: opacity 0.15s, transform 0.15s;
            z-index: 200;
          }
          .mega-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .mega-item {
            display: flex; gap: 10px; padding: 10px;
            border-radius: 10px;
            color: var(--text);
            transition: background 0.15s;
          }
          .mega-item:hover { background: var(--surface-2); text-decoration: none; }
          .mega-item-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: grid; place-items: center; flex-shrink: 0;
            background: var(--brand-light); color: var(--brand);
            font-size: 18px;
          }
          .mega-item-text { display: flex; flex-direction: column; min-width: 0; }
          .mega-item-title { font-size: 14px; font-weight: 600; color: var(--text); }
          .mega-item-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

          @media (max-width: 900px) {
            .nav-link, .nav-divider { display: none; }
            .top-nav-tools-trigger { display: inline-flex !important; }
            .mega-menu { width: 96vw; left: 2vw; right: 2vw; transform: none; }
            .mega-grid { grid-template-columns: 1fr; }
          }
          .top-nav-tools-trigger { display: none; }
        `}} />
        <nav className="top-nav">
          <div className="top-nav-inner">
            <Link href="/" className="top-nav-brand">
              <span className="logo">OC</span>
              <span>{t("site.brand", lang)}</span>
            </Link>
            <Link href="/ingredients" className="nav-link">{t("nav.ingredients", lang)}</Link>
            <Link href="/regulatory" className="nav-link">{t("nav.regulatory", lang)}</Link>
            <Link href="/china" className="nav-link">{t("nav.china", lang)}</Link>
            <Link href="/fda" className="nav-link">{t("nav.fda", lang)}</Link>
            <Link href="/reference" className="nav-link">{t("nav.reference", lang)}</Link>
            <Link href="/trends" className="nav-link">{t("nav.trends", lang)}</Link>
            <span className="nav-divider" />
            <span className="mega-trigger">
              <span className="nav-link" style={{ background: "var(--brand-light)", color: "var(--brand)", fontWeight: 600, cursor: "pointer" }}>
                🛠 {lang === "en" ? "Tools" : "工具"} ▾
              </span>
              <div className="mega-menu">
                <div className="mega-grid">
                  <Link href="/formula" className="mega-item">
                    <div className="mega-item-icon">🔬</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.formula", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "Reverse-engineer any formula from INCI" : "粘贴 INCI 反推配方类型/活性/价位"}</div>
                    </div>
                  </Link>
                  <Link href="/risk" className="mega-item">
                    <div className="mega-item-icon">⚖️</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.risk", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "65-rule safety check" : "65 规则安全审查"}</div>
                    </div>
                  </Link>
                  <Link href="/substitute" className="mega-item">
                    <div className="mega-item-icon">🔁</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.substitute", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "Find replacement for any active" : "为某成分找同功能替代"}</div>
                    </div>
                  </Link>
                  <Link href="/claim" className="mega-item">
                    <div className="mega-item-icon">🎯</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.claim", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "Brief → active stack in 1 click" : "护肤目标 → 5 活性 brief"}</div>
                    </div>
                  </Link>
                  <Link href="/reference" className="mega-item">
                    <div className="mega-item-icon">📚</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.reference", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "20 classic commercial formulas" : "20 经典商业参考配方"}</div>
                    </div>
                  </Link>
                  <Link href="/scan" className="mega-item">
                    <div className="mega-item-icon">🔍</div>
                    <div className="mega-item-text">
                      <div className="mega-item-title">{t("nav.scan", lang)}</div>
                      <div className="mega-item-desc">{lang === "en" ? "30-sec consumer scan report" : "30秒消费者成分报告"}</div>
                    </div>
                  </Link>
                </div>
              </div>
            </span>
            <div className="nav-right">
              <LangSwitcher />
            </div>
          </div>
        </nav>
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 64px" }}>
          {children}
        </main>
        <footer style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "32px 24px",
          marginTop: 64,
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--muted)" }}>
            <div>
              <strong style={{ color: "var(--text)" }}>{t("site.brand", lang)}</strong>
              <span style={{ marginLeft: 8 }}>· B2B 化妆品数据工具</span>
            </div>
            <div>
              {lang === "en"
                ? "Data: EU CosIng 50K · CN IECIC 8.9K · FDA 85K · 65 risk rules"
                : "数据: EU CosIng 50K · CN IECIC 8.9K · FDA 85K · 65 规则"}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
