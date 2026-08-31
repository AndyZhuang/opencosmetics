import { query } from "../../lib/db";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function RegulatoryPage() {
  const lang = await getLangFromCookies(cookies());
  const counts = await query(`
    SELECT
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS prohibited,
      (SELECT COUNT(*) FROM annex_iii_restricted) AS restricted,
      (SELECT COUNT(*) FROM annex_iv_colorants) AS colorants,
      (SELECT COUNT(*) FROM annex_v_preservatives) AS preservatives,
      (SELECT COUNT(*) FROM annex_vi_uv_filters) AS uv_filters
  `);
  const c = counts[0];
  const totalN = Number(c.prohibited) + Number(c.restricted) + Number(c.colorants) + Number(c.preservatives) + Number(c.uv_filters);

  const annexes = [
    { key: "ii",   nameKey: "regulatory.annex.ii.name",  descKey: "regulatory.annex.ii.desc",  table: "annex_ii_prohibited",     n: c.prohibited },
    { key: "iii",  nameKey: "regulatory.annex.iii.name", descKey: "regulatory.annex.iii.desc", table: "annex_iii_restricted",    n: c.restricted },
    { key: "iv",   nameKey: "regulatory.annex.iv.name",  descKey: "regulatory.annex.iv.desc",  table: "annex_iv_colorants",      n: c.colorants },
    { key: "v",    nameKey: "regulatory.annex.v.name",   descKey: "regulatory.annex.v.desc",   table: "annex_v_preservatives",   n: c.preservatives },
    { key: "vi",   nameKey: "regulatory.annex.vi.name",  descKey: "regulatory.annex.vi.desc",  table: "annex_vi_uv_filters",     n: c.uv_filters },
  ];

  const samples = {};
  for (const a of annexes) {
    samples[a.key] = await query(`SELECT * FROM ${a.table} LIMIT 20`);
  }

  return (
    <div>
      <h1>{t("regulatory.title", lang)} ({totalN.toLocaleString()})</h1>
      <p style={{ color: "var(--muted)" }}>{t("regulatory.subtitle", lang)}</p>

      {annexes.map(a => (
        <section key={a.key} style={{ margin: "32px 0" }}>
          <h2>
            {t(a.nameKey, lang)}{" "}
            <span style={{ color: "var(--muted)", fontSize: "14px" }}>— {Number(a.n).toLocaleString()}</span>
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>{t(a.descKey, lang)}</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("regulatory.col.ref", lang)}</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Chemical Name / INCI</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("regulatory.col.cas", lang)}</th>
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
            {t("regulatory.showing", lang, { n: Number(a.n).toLocaleString() })}
          </p>
        </section>
      ))}
    </div>
  );
}
