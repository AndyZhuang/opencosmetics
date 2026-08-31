import { query } from "../../../lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function IngredientDetail({ params }) {
  const p = await params;
  const lang = await getLangFromCookies(cookies());
  const name = decodeURIComponent(p.name);
  // case-insensitive lookup; get the canonical name
  const rows = await query(
    `SELECT inci_name, cas_no, ec_no, function, restriction, inn_name, phe_eur_name, chem_name, update_date
     FROM cosing WHERE UPPER(inci_name) = UPPER(?)
     LIMIT 1`,
    [name]
  );
  if (rows.length === 0) {
    notFound();
  }
  const ing = rows[0];
  const canonical = String(ing.inci_name);

  // also check PubChem
  const pc = await query(
    `SELECT pubchem_cid, pubchem FROM cosing_lite WHERE name = ? LIMIT 1`,
    [name]
  );

  // EU regulatory status
  const banned = await query(
    `SELECT "Chemical name / INN" AS name, "Reference Number" AS ref,
            "Regulation" AS regulation
     FROM annex_ii_prohibited
     WHERE LOWER("Chemical name / INN") LIKE '%' || LOWER(?) || '%'
        OR LOWER("Identified INGREDIENTS or substances e.g.") LIKE '%' || LOWER(?) || '%'
     LIMIT 5`,
    [name, name]
  );
  const restricted = await query(
    `SELECT "Chemical name / INN" AS name, "Reference number" AS ref
     FROM annex_iii_restricted
     WHERE LOWER("Chemical name / INN") LIKE '%' || LOWER(?) || '%'
        OR LOWER("Name of Common Ingredients Glossary") LIKE '%' || LOWER(?) || '%'
     LIMIT 5`,
    [name, name]
  );
  const preservatives = await query(
    `SELECT "Chemical name / INN" AS name, "Reference number" AS ref
     FROM annex_v_preservatives
     WHERE LOWER("Chemical name / INN") LIKE '%' || LOWER(?) || '%'
        OR LOWER("Name of Common Ingredients Glossary") LIKE '%' || LOWER(?) || '%'
     LIMIT 5`,
    [name, name]
  );
  const uv = await query(
    `SELECT "Chemical name / INN / XAN" AS name, "Reference number" AS ref
     FROM annex_vi_uv_filters
     WHERE LOWER("Chemical name / INN / XAN") LIKE '%' || LOWER(?) || '%'
        OR LOWER("Name of Common Ingredients Glossary") LIKE '%' || LOWER(?) || '%'
     LIMIT 5`,
    [name, name]
  );

  const pc0 = pc[0];

  return (
    <div>
      <Link href="/ingredients" style={{ fontSize: "13px" }}>{t("ingredients.back", lang)}</Link>
      <h1 style={{ marginTop: "12px" }}>{canonical}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "24px 0" }}>
        <section>
          <h3>{t("ingredients.basic", lang)}</h3>
          <table style={{ width: "100%", fontSize: "13px" }}>
            <tbody>
              <Row k="CAS" v={ing.cas_no} />
              <Row k="EC" v={ing.ec_no} />
              <Row k="INN" v={ing.inn_name} />
              <Row k="Ph. Eur." v={ing.phe_eur_name} />
              <Row k={t("ingredients.fn", lang)} v={ing.function} wide />
              <Row k={t("ingredients.restrictions", lang)} v={ing.restriction} wide />
              <Row k="PubChem CID" v={pc0 ? (
                <a href={String(pc0.pubchem)} target="_blank">{String(pc0.pubchem_cid)} →</a>
              ) : "—"} />
              <Row k={t("common.updated", lang)} v={ing.update_date} />
            </tbody>
          </table>
        </section>

        <section>
          <h3>{t("ingredients.eu.title", lang)}</h3>
          {banned.length > 0 ? (
            <Pill color="red" label={t("ingredients.eu.prohibited", lang)}>
              {banned.map((r, i) => (
                <div key={i} style={{ fontSize: "12px" }}>
                  {String(r.name).slice(0, 80)} <span style={{ color: "var(--muted)" }}>(Ref #{r.ref})</span>
                </div>
              ))}
            </Pill>
          ) : null}
          {restricted.length > 0 ? (
            <Pill color="orange" label={t("ingredients.eu.restricted", lang)}>
              {restricted.map((r, i) => (
                <div key={i} style={{ fontSize: "12px" }}>
                  {String(r.name).slice(0, 80)} <span style={{ color: "var(--muted)" }}>(Ref #{r.ref})</span>
                </div>
              ))}
            </Pill>
          ) : null}
          {preservatives.length > 0 ? (
            <Pill color="blue" label={t("ingredients.eu.preservative", lang)}>
              {preservatives.map((r, i) => (
                <div key={i} style={{ fontSize: "12px" }}>
                  {String(r.name).slice(0, 80)} <span style={{ color: "var(--muted)" }}>(Ref #{r.ref})</span>
                </div>
              ))}
            </Pill>
          ) : null}
          {uv.length > 0 ? (
            <Pill color="yellow" label={t("ingredients.eu.uvfilter", lang)}>
              {uv.map((r, i) => (
                <div key={i} style={{ fontSize: "12px" }}>
                  {String(r.name).slice(0, 80)} <span style={{ color: "var(--muted)" }}>(Ref #{r.ref})</span>
                </div>
              ))}
            </Pill>
          ) : null}
          {banned.length === 0 && restricted.length === 0 && preservatives.length === 0 && uv.length === 0 && (
            <div style={{ padding: "12px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: "6px", color: "var(--green)" }}>
              {t("ingredients.eu.none", lang)}
            </div>
          )}
        </section>
      </div>

      {ing.chem_name && (
        <section>
          <h3>{t("ingredients.chem", lang)}</h3>
          <div style={{ padding: "12px", background: "var(--panel)", borderRadius: "6px", fontSize: "13px", lineHeight: 1.7 }}>
            {ing.chem_name}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, wide }) {
  if (!v) return null;
  return (
    <tr>
      <td style={{ padding: "6px 0", color: "var(--muted)", verticalAlign: "top", width: "120px" }}>{k}</td>
      <td style={{ padding: "6px 0", wordBreak: wide ? "break-word" : "normal" }}>{v}</td>
    </tr>
  );
}

function Pill({ color, label, children }) {
  return (
    <div style={{
      padding: "12px",
      background: `rgba(${color === "red" ? "231,76,60" : color === "orange" ? "243,156,18" : color === "blue" ? "52,152,219" : "241,196,15"}, 0.1)`,
      border: `1px solid rgba(${color === "red" ? "231,76,60" : color === "orange" ? "243,156,18" : color === "blue" ? "52,152,219" : "241,196,15"}, 0.3)`,
      borderRadius: "6px",
      margin: "8px 0",
    }}>
      <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
      {children}
    </div>
  );
}
