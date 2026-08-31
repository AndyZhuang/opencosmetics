import { query, queryOne } from "../../lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "China Cosmetics Regulatory — IECIC I/II + Adjustments",
  description: "NMPA 国家药监局 化妆品原料目录 8,985 条 + 2025-06-23 调整说明",
};

export default async function ChinaPage() {
  const lang = getLangFromCookies(cookies().toString());
  // Stats
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM cn_iecic_i) AS iecic_i,
      (SELECT COUNT(*) FROM cn_iecic_ii) AS iecic_ii,
      (SELECT COUNT(*) FROM cn_iecic_adjustments) AS adjustments,
      (SELECT COUNT(*) FROM cosing) AS cosing,
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS eu_prohibited
  `);
  const s = stats[0];

  // 调整说明前 5 条
  const recentChanges = await query(`
    SELECT id, paragraph FROM cn_iecic_adjustments
    WHERE paragraph LIKE '%2025%' OR paragraph LIKE '%调整%' OR paragraph LIKE '%标准化%'
    ORDER BY id LIMIT 6
  `);

  // 中国法规趋势
  const milestones = [
    { date: "2025-06-23", key: "china.m.2025_61" },
    { date: "2026-08-06", key: "china.m.gb_2026" },
    { date: "2026-08-25", key: "china.m.first" },
    { date: "2026-08-20", key: "china.m.adj5" },
    { date: "2026-05-17", key: "china.m.snow" },
  ];

  // 8 种危害物 GB 7916-2026 限量
  const heavyMetals = [
    { key: "heavy_metal.lead",     limit: "< 10 mg/kg", catKey: "heavy_metal.cat.heavy_metal" },
    { key: "heavy_metal.arsenic",  limit: "< 1 mg/kg",  catKey: "heavy_metal.cat.trace" },
    { key: "heavy_metal.mercury",  limit: "< 4 mg/kg",  catKey: "heavy_metal.cat.trace" },
    { key: "heavy_metal.cadmium",  limit: "(Cr/Cd/Cu/Mo/Fe/Ni) ≤ 50 mg/kg", catKey: "heavy_metal.cat.trace" },
    { key: "heavy_metal.methanol", limitKey: "heavy_metal.monitor", catKey: "heavy_metal.cat.specific" },
    { key: "heavy_metal.dioxane",  limitKey: "heavy_metal.monitor", catKey: "heavy_metal.cat.specific" },
    { key: "heavy_metal.asbestos", limitKey: "heavy_metal.banned",  catKey: "heavy_metal.cat.talc" },
    { key: "heavy_metal.benzene",  limit: "≤ 2 mg/kg", catKey: "heavy_metal.cat.process" },
  ];

  // IECIC I 搜索 (top 5 个示例)
  const samples = await query(`
    SELECT seq, chinese_name, inci_name
    FROM cn_iecic_i
    WHERE inci_name != ''
    ORDER BY RANDOM()
    LIMIT 8
  `);

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        {t("china.title", lang)}
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          {t("china.subtitle", lang)}
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {t("china.tagline", lang)}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "24px 0" }}>
        <Stat num={s.iecic_i.toLocaleString()} label={t("china.stat.iecic_i", lang)} color="var(--green)" />
        <Stat num={s.iecic_ii.toLocaleString()} label={t("china.stat.iecic_ii", lang)} />
        <Stat num={s.adjustments.toLocaleString()} label={t("china.stat.adjustments", lang)} color="var(--orange)" />
        <Stat num={s.cosing.toLocaleString()} label={t("china.stat.cosing_compare", lang)} />
        <Stat num={s.eu_prohibited.toLocaleString()} label={t("china.stat.eu_prohibited", lang)} color="var(--red)" />
      </div>

      <Section title={t("china.timeline.title", lang)}>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px dashed var(--border)" }}>
            <code style={{ color: "var(--orange)", minWidth: "100px", fontSize: "12px" }}>{m.date}</code>
            <span style={{ fontSize: "13px" }}>{t(m.key, lang)}</span>
          </div>
        ))}
      </Section>

      <Section title={t("china.gb.title", lang)}>
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
          {t("china.gb.subtitle", lang)}
        </p>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th style={{ textAlign: "left" }}>{t("china.gb.substance", lang)}</th>
              <th style={{ textAlign: "left" }}>{t("china.gb.limit", lang)}</th>
              <th style={{ textAlign: "left" }}>{t("china.gb.category", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {heavyMetals.map((h, i) => (
              <tr key={i}>
                <td><strong>{t(h.key, lang)}</strong></td>
                <td><code style={{ color: "var(--red)" }}>{h.limit || t(h.limitKey, lang)}</code></td>
                <td>{t(h.catKey, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={t("china.adjustments.title", lang)}>
        {recentChanges.map((row) => (
          <div key={row.id} style={{ padding: "6px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
            <code style={{ color: "var(--muted)" }}>§{row.id}:</code> {row.paragraph.slice(0, 200)}
            {row.paragraph.length > 200 && "..."}
          </div>
        ))}
      </Section>

      <Section title={t("china.sample.title", lang)}>
        <table style={{ width: "100%", fontSize: "12px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th>{t("china.sample.seq", lang)}</th>
              <th>{t("china.sample.zh", lang)}</th>
              <th>{t("china.sample.inci", lang)}</th>
              <th>{t("china.sample.search", lang)}</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((s, i) => (
              <tr key={i}>
                <td>{s.seq}</td>
                <td>{s.chinese_name}</td>
                <td><code style={{ fontSize: "11px", color: "var(--orange)" }}>{s.inci_name}</code></td>
                <td><Link href={`/ingredients/${encodeURIComponent(s.inci_name)}`} style={{ color: "var(--blue)" }}>→</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title={t("china.regions.title", lang)}>
        <ul style={{ fontSize: "13px", lineHeight: "1.8" }}>
          <li>🇨🇳 <strong>{t("common.region.cn", lang)}</strong>: {t("china.region.cn", lang)}</li>
          <li>🇪🇺 <strong>{t("common.region.eu", lang)}</strong>: {t("china.region.eu", lang)}</li>
          <li>🇺🇸 <strong>{t("common.region.us", lang)}</strong>: {t("china.region.us", lang)}</li>
          <li>🇰🇷 <strong>{t("common.region.kr", lang)}</strong>: KCID 20,530 {t("china.region.ingredients", lang)} (KFDA)</li>
          <li>🇯🇵 <strong>{t("common.region.jp", lang)}</strong>: JCIA 16,152 {t("china.region.ingredients", lang)} (PMDL)</li>
          <li>🇦🇸 <strong>{t("common.region.asean", lang)}</strong>: {t("china.region.asean", lang)}</li>
        </ul>
      </Section>
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
function Section({ title, children }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>{title}</h2>
      {children}
    </div>
  );
}
