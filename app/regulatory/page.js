import { query } from "../../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegulatoryPage() {
  const counts = await query(`
    SELECT
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS prohibited,
      (SELECT COUNT(*) FROM annex_iii_restricted) AS restricted,
      (SELECT COUNT(*) FROM annex_iv_colorants) AS colorants,
      (SELECT COUNT(*) FROM annex_v_preservatives) AS preservatives,
      (SELECT COUNT(*) FROM annex_vi_uv_filters) AS uv_filters
  `);
  const c = counts[0];

  const annexes = [
    { key: "ii",   name: "Annex II — Prohibited (禁用)",       table: "annex_ii_prohibited",     desc: "化妆品中完全禁止使用的成分",     n: c.prohibited },
    { key: "iii",  name: "Annex III — Restricted (限用)",      table: "annex_iii_restricted",    desc: "在特定浓度/部位/条件下限制使用",  n: c.restricted },
    { key: "iv",   name: "Annex IV — Colorants (着色剂)",      table: "annex_iv_colorants",      desc: "允许使用的着色剂清单",            n: c.colorants },
    { key: "v",    name: "Annex V — Preservatives (防腐剂)",   table: "annex_v_preservatives",   desc: "允许使用的防腐剂清单",            n: c.preservatives },
    { key: "vi",   name: "Annex VI — UV Filters (防晒剂)",     table: "annex_vi_uv_filters",     desc: "允许使用的防晒剂清单",            n: c.uv_filters },
  ];

  // Show first 20 rows from each annex
  const samples = {};
  for (const a of annexes) {
    const cols = await query(`DESCRIBE ${a.table}`);
    const firstCol = cols[0][0];
    samples[a.key] = await query(`SELECT * FROM ${a.table} LIMIT 20`);
  }

  return (
    <div>
      <h1>⚖️ EU 化妆品监管 ({Number(c.prohibited) + Number(c.restricted) + Number(c.colorants) + Number(c.preservatives) + Number(c.uv_filters)} 条)</h1>
      <p style={{ color: "var(--muted)" }}>
        EU Cosmetics Regulation 1223/2009 的 5 个 Annex. 任何成分查这个数据库,能直接告诉你在 EU 是不是允许用。
      </p>

      {annexes.map(a => (
        <section key={a.key} style={{ margin: "32px 0" }}>
          <h2>{a.name} <span style={{ color: "var(--muted)", fontSize: "14px" }}>— {a.n} 条</span></h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>{a.desc}</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Ref</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Chemical Name / INCI</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>CAS</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>EC</th>
              </tr>
            </thead>
            <tbody>
              {samples[a.key].map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
                    {String(r["Reference Number"] || r["Reference number"] || i + 1)}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {String(r["Chemical name / INN"] || r["Chemical name"] || "—").slice(0, 120)}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
                    {r["CAS Number"] || r["CAS No"] || "—"}
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
                    {r["EC Number"] || r["EC No"] || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "8px" }}>
            显示前 20 / {a.n} 条
          </p>
        </section>
      ))}
    </div>
  );
}
