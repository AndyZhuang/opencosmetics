import { query } from "../lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const lang = getLangFromCookies(cookies().toString());
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM cosing) AS cosing,
      (SELECT COUNT(*) FROM cosing_lite) AS beauteeru,
      (SELECT COUNT(*) FROM cosing_obf) AS obf,
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS prohibited,
      (SELECT COUNT(*) FROM annex_iii_restricted) AS restricted,
      (SELECT COUNT(*) FROM annex_v_preservatives) AS preservatives,
      (SELECT COUNT(*) FROM annex_vi_uv_filters) AS uv_filters,
      (SELECT COUNT(*) FROM incidb_ingredients) AS incidb_ing
  `);
  const s = stats[0];

  // top 5 functions
  const topFns = await query(`
    SELECT function, COUNT(*) AS n
    FROM cosing
    WHERE function IS NOT NULL AND function != ''
    GROUP BY function ORDER BY n DESC LIMIT 5
  `);

  // BEBD top 10 with EU regulatory check
  const reg = await query(`
    WITH bebd_top AS (
      SELECT unnest(['NIACINAMIDE','GLYCERIN','TOCOPHEROL','SQUALANE',
                     'RETINOL','SALICYLIC ACID','PANTHENOL','TRANEXAMIC ACID',
                     'HYALURONIC ACID','VITAMIN E']) AS inci_name
    )
    SELECT bt.inci_name, a2."Chemical name / INN" AS banned_name, a2."Reference Number" AS ref
    FROM bebd_top bt
    JOIN annex_ii_prohibited a2
      ON LOWER(a2."Chemical name / INN") LIKE '%' || LOWER(bt.inci_name) || '%'
       OR LOWER(a2."Identified INGREDIENTS or substances e.g.") LIKE '%' || LOWER(bt.inci_name) || '%'
    LIMIT 10
  `);

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        {t("home.title", lang)}
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          {t("home.subtitle", lang)}
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {t("home.tagline", lang)}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        margin: "24px 0",
      }}>
        <Stat num={s.cosing.toLocaleString()} label={t("home.stats.cosing", lang)} color="var(--green)" />
        <Stat num={s.beauteeru.toLocaleString()} label={t("home.stats.beauteeru", lang)} />
        <Stat num={s.obf.toLocaleString()} label={t("home.stats.obf", lang)} />
        <Stat num={s.prohibited.toLocaleString()} label={t("home.stats.prohibited", lang)} color="var(--red)" />
        <Stat num={s.restricted.toLocaleString()} label={t("home.stats.restricted", lang)} />
        <Stat num={s.preservatives.toLocaleString()} label={t("home.stats.preservatives", lang)} />
        <Stat num={s.uv_filters.toLocaleString()} label={t("home.stats.uv_filters", lang)} />
        <Stat num={s.incidb_ing.toLocaleString()} label={t("home.stats.incidb", lang)} />
      </div>

      <div style={{
        background: "rgba(231,76,60,0.1)",
        border: "1px solid rgba(231,76,60,0.3)",
        borderRadius: "8px",
        padding: "16px",
        margin: "24px 0",
      }}>
        <h3 style={{ margin: "0 0 8px 0", color: "#f5a8a1" }}>
          {t("home.killer.title", lang)}
        </h3>
        <p style={{ margin: 0, fontSize: "13px" }}>
          {t("home.killer.note", lang)}
        </p>
        <table style={{ width: "100%", marginTop: "12px", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th style={{ textAlign: "left" }}>{t("home.table.bebd", lang)}</th>
              <th style={{ textAlign: "left" }}>{t("home.table.banned", lang)}</th>
              <th style={{ textAlign: "left" }}>{t("home.table.ref", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {reg.map((r, i) => (
              <tr key={i}>
                <td><code style={{ color: "var(--orange)" }}>{r.inci_name}</code></td>
                <td>{String(r.banned_name).slice(0, 100)}</td>
                <td>{r.ref}</td>
              </tr>
            ))}
            {reg.length === 0 && (
              <tr><td colSpan="3" style={{ color: "var(--muted)", textAlign: "center" }}>{lang === "en" ? "No matches" : "无匹配"}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "32px" }}>{t("home.function.top", lang)}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left" }}>Function</th>
            <th style={{ textAlign: "left" }}>{t("common.count", lang)}</th>
            <th style={{ textAlign: "left" }}>{t("common.bar", lang)}</th>
          </tr>
        </thead>
        <tbody>
          {topFns.map(r => {
            const max = Math.max(...topFns.map(x => Number(x.n)));
            const w = Math.round(400 * Number(r.n) / max);
            return (
              <tr key={String(r.function)}>
                <td>{r.function}</td>
                <td>{Number(r.n).toLocaleString()}</td>
                <td>
                  <span style={{
                    display: "inline-block",
                    height: "8px",
                    background: "var(--accent)",
                    borderRadius: "2px",
                    width: `${w}px`,
                  }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>{t("home.sources.title", lang)}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h3>{t("home.sources.ingested", lang)}</h3>
          <ul>
            <li><b>walkowskis</b> — EU CosIng 26K, Function/Restriction</li>
            <li><b>beauteeru</b> — EU CosIng 28K, PubChem CID</li>
            <li><b>OBF Annexes</b> — EU {t("common.regulation", lang)} 1,927</li>
            <li><b>OBF CosIng full</b> — EU CosIng 24K, multi-source join</li>
            <li><b>INCIDB sample</b> — 130 {t("home.sources.li5", lang).match(/\d+/g)?.join(" + ") || "ingredients + products + formulas"}</li>
          </ul>
        </div>
        <div>
          <h3>{t("home.sources.pending", lang)}</h3>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t("home.sources.li6", lang) }} />
            <li dangerouslySetInnerHTML={{ __html: t("home.sources.li7", lang) }} />
            <li dangerouslySetInnerHTML={{ __html: t("home.sources.li8", lang) }} />
            <li dangerouslySetInnerHTML={{ __html: t("home.sources.li9", lang) }} />
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ num, label, color }) {
  return (
    <div style={{
      background: "var(--panel)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "14px",
    }}>
      <div style={{ fontSize: "22px", fontWeight: 600, color: color || "var(--accent)" }}>
        {num}
      </div>
      <div style={{ color: "var(--muted)", fontSize: "11px", marginTop: "4px" }}>
        {label}
      </div>
    </div>
  );
}
