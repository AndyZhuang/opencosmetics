import Link from "next/link";
import { loadCompanies } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "合成生物美妆原料公司 — 巨子 / 锦波 / 华熙 / 创健",
  description: "4 家港/A/北交所合成生物美妆原料公司, 财务+技术+产品+监管",
};

const COMPANY_COLORS = {
  "juzi-bio": "var(--green)",
  "jinbo-bio": "var(--blue)",
  "huaxi-bio": "var(--orange)",
  "chuangjian": "var(--purple)",
};

export default async function SynbioPage() {
  const data = loadCompanies();
  if (!data) {
    return <div style={{ padding: "40px" }}>companies.json 未找到, 请检查 data/ 目录</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        🧬 合成生物美妆原料公司
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          港/A/北交所 公开披露
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        重组胶原蛋白 (锦波/巨子) + 透明质酸 (华熙) 是中国合成生物美妆的两大主线。
        2024 年市场 ¥185 亿, 2030 年预测 ¥2,193 亿, CAGR 42.4%。
      </p>

      {/* Market sizing 卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "24px 0" }}>
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2022_b}B`} label="2022 市场规模" />
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2025E_b}B`} label="2025E 规模" color="var(--orange)" />
        <Stat num={`¥${data.market_sizing.china_recombinant_collagen_market_2030E_b}B`} label="2030E 规模" color="var(--green)" />
        <Stat num={`${(data.market_sizing.cagr_2022_2030 * 100).toFixed(1)}%`} label="2022-30 CAGR" color="var(--blue)" />
      </div>

      {/* 4 家公司 */}
      {data.companies.map((c) => {
        const f24 = c.financials_2024 || {};
        return (
          <div key={c.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>{c.name_cn}</h2>
              <code style={{ color: "var(--muted)", fontSize: "12px" }}>{c.name_en}</code>
              <span style={{ background: COMPANY_COLORS[c.id] || "var(--blue)", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                {c.ticker} · {c.exchange}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--muted)" }}>
                上市 {c.ipo_date} · 总部 {c.hq}
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text)", margin: "12px 0" }}>
              <strong>{c.category}</strong> · {c.tech_platform}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px", margin: "12px 0" }}>
              {f24.revenue_cny_b !== undefined && (
                <KPI num={`¥${f24.revenue_cny_b}B`} label="2024 营收" />
              )}
              {f24.revenue_growth_yoy !== undefined && (
                <KPI num={`+${(f24.revenue_growth_yoy * 100).toFixed(1)}%`} label="YoY 增长" color="var(--green)" />
              )}
              {f24.net_profit_cny_b !== undefined && (
                <KPI num={`¥${f24.net_profit_cny_b}B`} label="净利润" />
              )}
              {f24.gross_margin !== undefined && (
                <KPI num={`${(f24.gross_margin * 100).toFixed(1)}%`} label="毛利率" color="var(--blue)" />
              )}
              {f24.key_brand_name && (
                <KPI num={f24.key_brand_revenue_pct ? `${(f24.key_brand_revenue_pct * 100).toFixed(0)}%` : "—"} label={f24.key_brand_name} />
              )}
              {f24.wy_sales_volume_2024 && (
                <KPI num={f24.wy_sales_volume_2024.toLocaleString()} label="薇旖美 2024 销量 (支)" color="var(--orange)" />
              )}
            </div>

            {/* 营收历史 */}
            {c.yoy_history && c.yoy_history.length > 0 && (
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "13px", color: "var(--blue)" }}>
                  📈 营收历史 ({c.yoy_history.length} 年)
                </summary>
                <table style={{ width: "100%", fontSize: "12px", marginTop: "8px" }}>
                  <thead><tr style={{ color: "var(--muted)" }}>
                    <th>年</th><th>营收 (¥B)</th><th>YoY</th>
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
                  💊 产品 ({c.products.length})
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
                <strong style={{ color: "var(--muted)" }}>品牌: </strong>
                {c.brands.map((b, i) => (
                  <span key={i} style={{ background: "var(--bg)", padding: "2px 8px", borderRadius: "4px", marginRight: "4px" }}>{b}</span>
                ))}
              </div>
            )}

            {/* 监管 */}
            {c.regulatory && c.regulatory.length > 0 && (
              <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <strong style={{ color: "var(--muted)" }}>监管: </strong>
                <ul style={{ paddingLeft: "20px", margin: "4px 0" }}>
                  {c.regulatory.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Milestones (锦波特殊) */}
            {c.milestones && (
              <div style={{ marginTop: "12px", fontSize: "12px" }}>
                <strong style={{ color: "var(--muted)" }}>近期里程碑: </strong>
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
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>🏭 上下游</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px" }}>
          <div>
            <strong>上游 (B2B 原料商):</strong>
            <ul style={{ marginTop: "8px" }}>
              {data.upstream_competitors.map((u, i) => <li key={i}>{u}</li>)}
            </ul>
          </div>
          <div>
            <strong>市场预测 (Frost & Sullivan):</strong>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>{data.market_sizing.notes}</p>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0", fontSize: "13px" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>🤖 MCP 集成</h2>
        <p>
          把上面 4 家公司 + 65 规则 暴露为 MCP server, 配方师可以在 Claude / GPT 客户端里直接调用:
        </p>
        <pre style={{ background: "var(--bg)", padding: "12px", borderRadius: "4px", fontSize: "12px", overflow: "auto" }}>
{`POST /api/mcp
{
  "tool": "formula_review",
  "args": {
    "ingredients": ["RETINOL", "AHA", "VITAMIN_C"],
    "context": { "population": "孕妇", "region": "CN" }
  }
}`}
        </pre>
        <p style={{ color: "var(--muted)", fontSize: "12px" }}>
          → 返回 block/warn count, 匹配规则列表, 来源标注 (CN/EU/US)
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
