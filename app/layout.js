import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import LangSwitcher from "../components/LangSwitcher";
import { t, getLangFromCookies } from "../lib/i18n";

export const metadata = {
  title: "开放美妆数据",
  description: "B2B 化妆品数据 MCP + Next.js — 50K EU CosIng + 8,985 CN IECIC + 65 风险规则 + MCP server",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = await getLangFromCookies(cookieStore);
  return (
    <html lang={lang === "en" ? "en" : "zh-CN"}>
      <body>
        <nav style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 24px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <Link href="/" style={{ color: "var(--accent)", fontWeight: 600, fontSize: "16px" }}>
            {t("site.brand", lang)}
          </Link>
          <Link href="/ingredients" style={{ color: "var(--text)" }}>{t("nav.ingredients", lang)}</Link>
          <Link href="/regulatory" style={{ color: "var(--text)" }}>{t("nav.regulatory", lang)}</Link>
          <Link href="/fda" style={{ color: "var(--text)" }}>{t("nav.fda", lang)}</Link>
          <Link href="/china" style={{ color: "var(--orange)" }}>{t("nav.china", lang)}</Link>
          <Link href="/risk" style={{ color: "var(--red)" }}>{t("nav.risk", lang)}</Link>
          <Link href="/formula" style={{ color: "var(--blue)", fontWeight: 600 }}>{t("nav.formula", lang)}</Link>
          <Link href="/substitute" style={{ color: "var(--blue)" }}>{t("nav.substitute", lang)}</Link>
          <Link href="/claim" style={{ color: "var(--blue)" }}>{t("nav.claim", lang)}</Link>
          <Link href="/reference" style={{ color: "var(--text)" }}>{t("nav.reference", lang)}</Link>
          <Link href="/scan" style={{ color: "#9b59b6" }}>{t("nav.scan", lang)}</Link>
          <Link href="/trends" style={{ color: "var(--text)" }}>{t("nav.trends", lang)}</Link>
          <Link href="/api/mcp" style={{ color: "var(--accent)" }}>{t("nav.mcp", lang)}</Link>
          <Link href="/sources" style={{ color: "var(--text)" }}>{t("nav.sources", lang)}</Link>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "var(--muted)", fontSize: "12px" }}>
              {t("site.snapshot", lang)}: 2026-08-25 · MCP v0.2
            </span>
            <LangSwitcher />
          </div>
        </nav>
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
