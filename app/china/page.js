import { query, queryOne } from "../../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "中国化妆品法规 — IECIC I/II + 调整说明",
  description: "NMPA 国家药监局 化妆品原料目录 8,985 条 + 2025-06-23 调整说明",
};

export default async function ChinaPage() {
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

  // 中国法规趋势: 2025-2026 重要更新
  const milestones = [
    { date: "2025-06-23", event: "NMPA 2025 年第 61 号公告: IECIC 拆分为 Ⅰ (8,985) + Ⅱ (动态纳入新原料)" },
    { date: "2026-08-06", event: "GB 7916-2026《化妆品 安全通用要求》发布, 2028-01-01 实施 (首个强制性国标)" },
    { date: "2026-08-25", event: "首项检测: 眼周/口唇/儿童菌落总数限量比普通产品严 10×" },
    { date: "2026-08-20", event: "IECIC 第 5 次动态调整 (月桂酰丙氨酸等 3 个新原料 → IECIC Ⅱ)" },
    { date: "2026-05-17", event: "NMPA 批准雪莲花愈伤组织粉 (大连普瑞康) 列入 IECIC Ⅱ" },
  ];

  // 8 种危害物 GB 7916-2026 限量
  const heavyMetals = [
    { substance: "铅 Pb", limit: "< 10 mg/kg", note: "重金属总量" },
    { substance: "砷 As", limit: "< 1 mg/kg", note: "微量元素" },
    { substance: "汞 Hg", limit: "< 4 mg/kg", note: "微量元素" },
    { substance: "镉 Cd", limit: "(Cr/Cd/Cu/Mo/Fe/Ni) ≤ 50 mg/kg", note: "微量元素" },
    { substance: "甲醇 (残留)", limit: "按需监测", note: "特定原料风险" },
    { substance: "二噁烷", limit: "按需监测", note: "特定原料风险" },
    { substance: "石棉", limit: "禁用", note: "滑石粉风险" },
    { substance: "苯", limit: "≤ 2 mg/kg", note: "卡波姆工艺残留" },
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
        🇨🇳 中国化妆品法规数据
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          NMPA 2025 年第 61 号公告 + STSC 2015 + GB 7916-2026
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        2025-06-23 NMPA 将 IECIC 拆分为 Ⅰ + Ⅱ 两个清单; 2026-08-06 GB 7916-2026 首个强制性国标发布 (2028-01-01 实施)。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "24px 0" }}>
        <Stat num={s.iecic_i.toLocaleString()} label="IECIC Ⅰ (已使用)" color="var(--green)" />
        <Stat num={s.iecic_ii.toLocaleString()} label="IECIC Ⅱ (新原料)" />
        <Stat num={s.adjustments.toLocaleString()} label="调整说明 (2025-06-23)" color="var(--orange)" />
        <Stat num={s.cosing.toLocaleString()} label="EU CosIng (跨地区比对)" />
        <Stat num={s.eu_prohibited.toLocaleString()} label="EU 禁用 (Annex II)" color="var(--red)" />
      </div>

      <Section title="📅 2025-2026 中国化妆品法规大事记">
        {milestones.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px dashed var(--border)" }}>
            <code style={{ color: "var(--orange)", minWidth: "100px", fontSize: "12px" }}>{m.date}</code>
            <span style={{ fontSize: "13px" }}>{m.event}</span>
          </div>
        ))}
      </Section>

      <Section title="⚠️ GB 7916-2026 严控 8 种有害物质">
        <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 12px 0" }}>
          首个强制性国标, 2028-01-01 实施, 取代 1987 版 GB 7916。
        </p>
        <table style={{ width: "100%", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th style={{ textAlign: "left" }}>有害物质</th>
              <th style={{ textAlign: "left" }}>限量</th>
              <th style={{ textAlign: "left" }}>类别</th>
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

      <Section title="🔄 2025-06-23 IECIC 调整说明 (前 6 段节选)">
        {recentChanges.map((row) => (
          <div key={row.id} style={{ padding: "6px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
            <code style={{ color: "var(--muted)" }}>§{row.id}:</code> {row.paragraph.slice(0, 200)}
            {row.paragraph.length > 200 && "..."}
          </div>
        ))}
      </Section>

      <Section title="📊 IECIC Ⅰ 随机 8 条 (示例)">
        <table style={{ width: "100%", fontSize: "12px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th>序号</th>
              <th>中文名称</th>
              <th>INCI 名称</th>
              <th>搜索</th>
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

      <Section title="🔗 多地区法规对比">
        <ul style={{ fontSize: "13px", lineHeight: "1.8" }}>
          <li>🇨🇳 <strong>CN</strong>: NMPA + NIFDC + 中检院 (STSC 2015 + GB 7916-2026) — 8,985 原料 + 1,393 禁用 + 47 限用 + 4 类准用</li>
          <li>🇪🇺 <strong>EU</strong>: CosIng + 5 Annex — 50,169 成分 + 1,927 监管 (开放)</li>
          <li>🇺🇸 <strong>US</strong>: FDA + CIR — 11 禁用 + MoCRA 2022 (现代法案)</li>
          <li>🇰🇷 <strong>KR</strong>: KCID 20,530 成分 (KFDA)</li>
          <li>🇯🇵 <strong>JP</strong>: JCIA 16,152 成分 (PMDL)</li>
          <li>🇦🇸 <strong>ASEAN</strong>: Annex II 1,870 禁用</li>
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
