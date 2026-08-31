import Link from "next/link";
import { cookies } from "next/headers";
import { loadCompanies } from "../../lib/db";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Synthetic Biology Cosmetic Companies — 巨子 / 锦波 / 华熙 / 创健",
  description: "4 HK/A/BSE listed synbio cosmetic ingredient companies, financials + tech + products + regulatory",
};

const COMPANY_COLORS = {
  "juzi-bio": "var(--green)",
  "jinbo-bio": "var(--blue)",
  "huaxi-bio": "var(--orange)",
  "chuangjian": "var(--purple)",
};

export default async function SynbioPage() {
  const lang = getLangFromCookies(cookies().toString());
  const data = loadCompanies();
  if (!data) {
    return <div style={{ padding: "40px" }}>{lang === "en" ? "companies.json not found, check data/ directory" : "companies.json 未找到, 请检查 data/ 目录"}</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        {t("synbio.title", lang)}
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          {t("synbio.subtitle", lang)}
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {t("synbio.tagline", lang)}
      </p>

      {/* Market sizing 卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "24px 0" }}>
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2022_b}B`} label={t("synbio.stat.2022", lang)} />
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2025E_b}B`} label={t("synbio.stat.2025E", lang)} color="var(--orange)" />
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2030E_b}B`} label={t("synbio.stat.2030E", lang)} color="var(--green)" />
        <Stat num={`${(data.market_sizing.cagr_2022_2030 * 100).toFixed(1)}%`} label={t("synbio.stat.cagr", lang)} color="var(--blue)" />
      </div>

      {/* 4 家公司 */}
      {data.companies.map((c) => {
        const f24 = c.financials_2024 || {};
        return (
          <div key={c.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>
                {c.name_cn} <span style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 400 }}>/ {c.name_en}</span>
              </h2>
              <code style={{ color: "var(--muted)", fontSize: "12px" }}>{c.ticker}</code>
              <span style={{ background: COMPANY_COLORS[c.id] || "var(--blue)", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                {c.exchange}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--muted)" }}>
                {t("synbio.listed", lang)} {c.ipo_date} · {t("synbio.hq", lang)} {c.hq}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text)", margin: "12px 0" }}>
              <strong>{c.category}</strong> · {c.tech_platform}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", margin: "12px 0" }}>
              {f24.revenue_cny_b !== undefined && (
                <KPI num={`¥${f24.revenue_cny_b}B`} label={t("synbio.revenue", lang)} />
              )}
              {f24.revenue_growth_yoy !== undefined && (
                <KPI num={`+${(f24.revenue_growth_yoy * 100).toFixed(1)}%`} label={t("synbio.yoy", lang)} color="var(--green)" />
              )}
              {f24.net_profit_cny_b !== undefined && (
                <KPI num={`¥${f24.net_profit_cny_b}B`} label={t("synbio.net_profit", lang)} />
              )}
              {f24.gross_margin !== undefined && (
                <KPI num={`${(f24.gross_margin * 100).toFixed(1)}%`} label={t("synbio.gross_margin", lang)} color="var(--blue)" />
              )}
              {f24.key_brand_name && (
                <KPI num={f24.key_brand_revenue_pct ? `${(f24.key_brand_revenue_pct * 100).toFixed(0)}%` : "—"} label={f24.key_brand_name} />
              )}
              {f24.wy_sales_volume_2024 && (
                <KPI num={f24.wy_sales_volume_2024.toLocaleString()} label={lang === "en" ? "WY 2024 sales (units)" : "薇旖美 2024 销量 (支)"} color="var(--orange)" />
              )}
            </div>

            {/* 营收历史 */}
            {c.yoy_history && c.yoy_history.length > 0 && (
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "13px", color: "var(--blue)" }}>
                  📈 {t("synbio.history", lang)} ({c.yoy_history.length} {lang === "en" ? "years" : "年"})
                </summary>
                <table style={{ width: "100%", fontSize: "12px", marginTop: "8px" }}>
                  <thead><tr style={{ color: "var(--muted)" }}>
                    <th>{t("synbio.year", lang)}</th><th>{t("synbio.revenue", lang)} (¥B)</th><th>{t("synbio.growth", lang)}</th>
                  </tr></thead>
                  <tbody>
                    {c.yoy_history.map((y) => (
                      <tr key={y.year}>
                        <td>{y.year}</td>
                        <td>¥{y.revenue_b.toFixed(2)}B</td>
                        <td style={{ color: y.growth ? "var(--green)" : "var(--muted)" }}>
                          {y.growth ? `+${(y.growth * 100).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}

            {/* 产品 */}
            {c.products && c.products.length > 0 && (
              <details style={{ marginTop: "8px" }}>
                <summary style={{ cursor: "pointer", fontSize: "13px", color: "var(--blue)" }}>
                  💊 {t("synbio.products", lang)} ({c.products.length})
                </summary>
                <ul style={{ fontSize: "12px", marginTop: "8px", paddingLeft: "20px" }}>
                  {c.products.map((p, i) => (
                    <li key={i} style={{ marginBottom: "4px" }}>
                      <strong>{p.name}</strong> — <em>{p.type}</em> — {p.application}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* 品牌 */}
            {c.brands && c.brands.length > 0 && (
              <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <strong style={{ color: "var(--muted)" }}>{t("synbio.brands", lang)}: </strong>
                {c.brands.map((b, i) => (
                  <span key={i} style={{ background: "var(--bg)", padding: "2px 8px", borderRadius: "4px", marginRight: "4px" }}>{b}</span>
                ))}
              </div>
            )}

            {/* 监管 */}
            {c.regulatory && c.regulatory.length > 0 && (
              <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <strong style={{ color: "var(--muted)" }}>{t("synbio.regulatory", lang)}: </strong>
                <ul style={{ paddingLeft: "20px", margin: "4px 0" }}>
                  {c.regulatory.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Milestones (锦波特殊) */}
            {c.milestones && (
              <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <strong style={{ color: "var(--muted)" }}>{lang === "en" ? "Recent milestones: " : "近期里程碑: "}</strong>
                <ul style={{ paddingLeft: "20px", margin: "4px 0" }}>
                  {c.milestones.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      {/* 上下游 */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>🏭 {t("synbio.upstream", lang)}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
          <div>
            <strong>{t("synbio.upstream.up", lang)}</strong>
            <ul style={{ marginTop: "8px" }}>
              {data.upstream_competitors.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          </div>
          <div>
            <strong>{t("synbio.upstream.market", lang)}</strong>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>{data.market_sizing.notes}</p>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0", fontSize: "13px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>{t("synbio.mcp.title", lang)}</h2>
        <p>{t("synbio.mcp.desc", lang)}</p>
        <pre style={{ background: "var(--bg)", padding: "12px", borderRadius: "4px", fontSize: "12px", overflow: "auto" }}>
{`POST /api/mcp
{
  "tool": "formula_review",
  "args": {
    "ingredients": ["RETINOL", "AHA", "VITAMIN_C"],
    "context": { "population": "pregnant", "region": "CN" }
  }
}`}
        </pre>
        <p style={{ color: "var(--muted)", fontSize: "12px" }}>
          → {lang === "en" ? "Returns block/warn count, matched rules, source labels (CN/EU/US)" : "返回 block/warn count, 匹配规则列表, 来源标注 (CN/EU/US)"}
        </p>
      </div>
    </div>
  );
}

function Stat({ num, label, color }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px" }}>
      <div style={{ fontSize: "22px", fontWeight: "600", color: color || "var(--text)" }}>{num}</div>
      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}
function KPI({ num, label, color }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "8px 10px" }}>
      <div style={{ fontSize: "16px", fontWeight: "600", color: color || "var(--text)" }}>{num}</div>
      <div style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
