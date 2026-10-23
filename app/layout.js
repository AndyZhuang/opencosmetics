// app/layout.js — 配方引擎 FormulaLab 根布局
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import LangSwitcher from "../components/LangSwitcher";
import TopNav from "../components/TopNav";
import { t, getLangFromCookies } from "../lib/i18n";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = await getLangFromCookies(cookieStore);
  const isZh = lang !== "en";

  return (
    <html lang={lang === "en" ? "en" : "zh-CN"}>
      <body>
        <TopNav lang={lang} />
        <main className="fl-main">{children}</main>
        <footer className="fl-footer">
          <div className="fl-footer-inner">
            <div className="fl-footer-brand">
              <span className="fl-mark sm">FL</span>
              <div>
                <b>{isZh ? "配方引擎 FormulaLab" : "FormulaLab"}</b>
                <span>
                  {isZh
                    ? "美妆配方师工作台 · 法规 / 成本 / 风险 一处算清"
                    : "The formulator's workbench for regulatory, cost and risk"}
                </span>
              </div>
            </div>
            <div className="fl-footer-meta">
              {isZh ? (
                <>
                  数据源: EU CosIng · CN IECIC · FDA · 65 条风险规则 · 243 项原料画像
                  <br />
                  原料价格为估算参考值, 落地前须按供应商报价校准
                </>
              ) : (
                <>
                  Sources: EU CosIng · CN IECIC · FDA · 65 risk rules · 243 raw-material profiles
                  <br />
                  Raw-material prices are reference estimates — recalibrate against supplier quotes
                </>
              )}
            </div>
            <div className="fl-footer-links">
              <Link href="/bench">构建器</Link>
              <Link href="/ingredients">成分库</Link>
              <Link href="/formulas">我的配方</Link>
              <Link href="/api/stats">API</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
