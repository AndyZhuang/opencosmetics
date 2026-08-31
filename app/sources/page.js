import { query } from "../../lib/db";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const lang = await getLangFromCookies(cookies());
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM cosing_lite) AS beauteeru,
      (SELECT COUNT(*) FROM cosing_walkowskis) AS walkowskis,
      (SELECT COUNT(*) FROM cosing_obf) AS obf_full,
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS prohibited,
      (SELECT COUNT(*) FROM annex_iii_restricted) AS restricted,
      (SELECT COUNT(*) FROM annex_iv_colorants) AS colorants,
      (SELECT COUNT(*) FROM annex_v_preservatives) AS preservatives,
      (SELECT COUNT(*) FROM annex_vi_uv_filters) AS uv_filters,
      (SELECT COUNT(*) FROM incidb_brands) AS incidb_brands,
      (SELECT COUNT(*) FROM incidb_ingredients) AS incidb_ing,
      (SELECT COUNT(*) FROM incidb_products) AS incidb_prod,
      (SELECT COUNT(*) FROM incidb_product_ingredients) AS incidb_pi
  `);
  const s = stats[0];

  return (
    <div>
      <h1>{t("sources.title", lang)}</h1>
      <p style={{ color: "var(--muted)" }}>{t("sources.subtitle", lang)}</p>

      <h2>{t("sources.ingested", lang)}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.source", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.table", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.records", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.fields", lang)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>walkowskis</td>
            <td>cosing_walkowskis</td>
            <td>{Number(s.walkowskis).toLocaleString()}</td>
            <td>INCI + CAS + EC + Function + Restriction + INN + PhEur</td>
          </tr>
          <tr>
            <td>beauteeru</td>
            <td>cosing_lite</td>
            <td>{Number(s.beauteeru).toLocaleString()}</td>
            <td>INCI + CAS + EC + PubChem CID</td>
          </tr>
          <tr>
            <td>OBF CosIng full</td>
            <td>cosing_obf</td>
            <td>{Number(s.obf_full).toLocaleString()}</td>
            <td>{lang === "en" ? "INCI + Function + Restriction (all EU fields)" : "INCI + Function + Restriction (全 EU 字段)"}</td>
          </tr>
          <tr>
            <td>OBF Annex II</td>
            <td>annex_ii_prohibited</td>
            <td>{Number(s.prohibited).toLocaleString()}</td>
            <td>{lang === "en" ? "EU Banned list" : "EU 禁用清单"}</td>
          </tr>
          <tr>
            <td>OBF Annex III</td>
            <td>annex_iii_restricted</td>
            <td>{Number(s.restricted).toLocaleString()}</td>
            <td>{lang === "en" ? "EU Restricted list" : "EU 限用清单"}</td>
          </tr>
          <tr>
            <td>OBF Annex IV</td>
            <td>annex_iv_colorants</td>
            <td>{Number(s.colorants).toLocaleString()}</td>
            <td>{lang === "en" ? "EU Colorants" : "EU 着色剂"}</td>
          </tr>
          <tr>
            <td>OBF Annex V</td>
            <td>annex_v_preservatives</td>
            <td>{Number(s.preservatives).toLocaleString()}</td>
            <td>{lang === "en" ? "EU Preservatives" : "EU 防腐剂"}</td>
          </tr>
          <tr>
            <td>OBF Annex VI</td>
            <td>annex_vi_uv_filters</td>
            <td>{Number(s.uv_filters).toLocaleString()}</td>
            <td>{lang === "en" ? "EU UV Filters" : "EU 防晒剂"}</td>
          </tr>
          <tr>
            <td>INCIDB</td>
            <td>incidb_*</td>
            <td>9 brands + {Number(s.incidb_ing)} ing + {Number(s.incidb_prod)} prod + {Number(s.incidb_pi)} mappings</td>
            <td>{lang === "en" ? "INCI + 17 source join + comedogenic + FDA warning" : "INCI + 17 源 join + 致痘 + FDA 警告"}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>{t("sources.pending", lang)}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.source", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.expected", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("sources.col.blocker", lang)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{lang === "en" ? "INCIDB full" : "INCIDB 全量"}</td>
            <td>{t("sources.pending.incidb.expected", lang)}</td>
            <td>{t("sources.pending.incidb.blocker", lang)}</td>
          </tr>
          <tr>
            <td>{lang === "en" ? "NMPA filing" : "NMPA 备案"}</td>
            <td>{t("sources.pending.nmpa.expected", lang)}</td>
            <td>{t("sources.pending.nmpa.blocker", lang)}</td>
          </tr>
          <tr>
            <td>FDA VCRP</td>
            <td>{t("sources.pending.fda.expected", lang)}</td>
            <td>{t("sources.pending.fda.blocker", lang)}</td>
          </tr>
          <tr>
            <td>Wikidata SPARQL</td>
            <td>{t("sources.pending.wikidata.expected", lang)}</td>
            <td>{t("sources.pending.wikidata.blocker", lang)}</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>{t("sources.legal", lang)}</h2>
      <p>{t("sources.legal.intro", lang)}</p>
      <ul>
        {[
          t("sources.legal.li1", lang),
          t("sources.legal.li2", lang),
          t("sources.legal.li3", lang),
          t("sources.legal.li4", lang),
          t("sources.legal.li5", lang),
        ].map((html, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </ul>
      <p style={{ fontSize: "13px", color: "var(--muted)" }}>{t("sources.legal.note", lang)}</p>
    </div>
  );
}
