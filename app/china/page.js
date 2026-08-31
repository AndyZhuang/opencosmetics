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
    { date: "2025-06-23", event: lang === "en"
      ? "NMPA 2025 #61: IECIC split into I (8,985) + II (dynamic new ingredients)"
      : "NMPA 2025 年第 61 号公告: IECIC 拆分为 Ⅰ (8,985) + Ⅱ (动态纳入新原料)" },
    { date: "2026-08-06", event: lang === "en"
      ? "GB 7916-2026 published, effective 2028-01-01 (first mandatory national standard)"
      : "GB 7916-2026《化妆品 安全通用要求》发布, 2028-01-01 实施 (首个强制性国标)" },
    { date: "2026-08-25", event: lang === "en"
      ? "First test: eye/lip area + children colony limit 10x stricter than regular products"
      : "首项检测: 眼周/口唇/儿童菌落总数限量比普通产品严 10×" },
    { date: "2026-08-20", event: lang === "en"
      ? "IECIC 5th dynamic adjustment (3 new ingredients like Lauroyl Alanine → IECIC II)"
      : "IECIC 第 5 次动态调整 (月桂酰丙氨酸等 3 个新原料 → IECIC Ⅱ)" },
    { date: "2026-05-17", event: lang === "en"
      ? "NMPA approved Saussurea involucrata callus powder (Dalian Purecare) into IECIC II"
      : "NMPA 批准雪莲花愈伤组织粉 (大连普瑞康) 列入 IECIC Ⅱ" },
  ];

  // 8 种危害物 GB 7916-2026 限量
  const heavyMetals = [
    { substance: lang === "en" ? "Lead (Pb)" : "铅 Pb", limit: "< 10 mg/kg", note: lang === "en" ? "Total heavy metal" : "重金属总量" },
    { substance: lang === "en" ? "Arsenic (As)" : "砷 As", limit: "< 1 mg/kg", note: lang === "en" ? "Trace element" : "微量元素" },
    { substance: lang === "en" ? "Mercury (Hg)" : "汞 Hg", limit: "< 4 mg/kg", note: lang === "en" ? "Trace element" : "微量元素" },
    { substance: lang === "en" ? "Cadmium (Cd)" : "镉 Cd", limit: lang === "en" ? "(Cr/Cd/Cu/Mo/Fe/Ni) ≤ 50 mg/kg" : "(Cr/Cd/Cu/Mo/Fe/Ni) ≤ 50 mg/kg", note: lang === "en" ? "Trace element" : "微量元素" },
    { substance: lang === "en" ? "Methanol (residual)" : "甲醇 (残留)", limit: lang === "en" ? "On-demand monitoring" : "按需监测", note: lang === "en" ? "Specific ingredient risk" : "特定原料风险" },
    { substance: lang === "en" ? "Dioxane" : "二噁烷", limit: lang === "en" ? "On-demand monitoring" : "按需监测", note: lang === "en" ? "Specific ingredient risk" : "特定原料风险" },
    { substance: lang === "en" ? "Asbestos" : "石棉", limit: lang === "en" ? "Banned" : "禁用", note: lang === "en" ? "Talc powder risk" : "滑石粉风险" },
    { substance: lang === "en" ? "Benzene" : "苯", limit: "≤ 2 mg/kg", note: lang === "en" ? "Carbomer process residual" : "卡波姆工艺残留" },
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
            <span style={{ fontSize: "13px" }}>{m.event}</span>
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
                <td><strong>{h.substance}</strong></td>
                <td><code style={{ color: "var(--red)" }}>{h.limit}</code></td>
                <td>{h.note}</td>
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
          <li>🇨🇳 <strong>{lang === "en" ? "China" : "中国"}</strong>: {lang === "en" ? "NMPA + NIFDC (STSC 2015 + GB 7916-2026) — 8,985 ingredients + 1,393 banned + 47 restricted + 4 allowed categories" : "NMPA + NIFDC + 中检院 (STSC 2015 + GB 7916-2026) — 8,985 原料 + 1,393 禁用 + 47 限用 + 4 类准用"}</li>
          <li>🇪🇺 <strong>{lang === "en" ? "EU" : "欧盟"}</strong>: {lang === "en" ? "CosIng + 5 Annex — 50,169 ingredients + 1,927 regulatory (open)" : "CosIng + 5 Annex — 50,169 成分 + 1,927 监管 (开放)"}</li>
          <li>🇺🇸 <strong>{lang === "en" ? "US" : "美国"}</strong>: {lang === "en" ? "FDA + CIR — 11 banned + MoCRA 2022 (Modernization Act)" : "FDA + CIR — 11 禁用 + MoCRA 2022 (现代法案)"}</li>
          <li>🇰🇷 <strong>{lang === "en" ? "Korea" : "韩国"}</strong>: KCID 20,530 {lang === "en" ? "ingredients" : "成分"} (KFDA)</li>
          <li>🇯🇵 <strong>{lang === "en" ? "Japan" : "日本"}</strong>: JCIA 16,152 {lang === "en" ? "ingredients" : "成分"} (PMDL)</li>
          <li>🇦🇸 <strong>{lang === "en" ? "ASEAN" : "东盟"}</strong>: {lang === "en" ? "Annex II" : "Annex II"} 1,870 {lang === "en" ? "banned" : "禁用"}</li>
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
