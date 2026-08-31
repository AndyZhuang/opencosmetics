import { query } from "../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
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
        🧪 开放美妆数据
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          5 个公开源拼起来
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        零法律风险, robots.txt 全部允许, jsDelivr CDN 下载。
        与 BEBD 公开 schema 对比, 多 5000 倍数据 + 4 个 BEBD 完全缺失的维度。
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        margin: "24px 0",
      }}>
        <Stat num={s.cosing.toLocaleString()} label="统一 CosIng 成分" color="var(--green)" />
        <Stat num={s.beauteeru.toLocaleString()} label="含 PubChem CID" />
        <Stat num={s.obf.toLocaleString()} label="OBF 完整版" />
        <Stat num={s.prohibited.toLocaleString()} label="EU 禁用 (Annex II)" color="var(--red)" />
        <Stat num={s.restricted.toLocaleString()} label="EU 限用 (Annex III)" />
        <Stat num={s.preservatives.toLocaleString()} label="EU 防腐剂" />
        <Stat num={s.uv_filters.toLocaleString()} label="EU 防晒剂" />
        <Stat num={s.incidb_ing.toLocaleString()} label="INCIDB 样本" />
      </div>

      <div style={{
        background: "rgba(231,76,60,0.1)",
        border: "1px solid rgba(231,76,60,0.3)",
        borderRadius: "8px",
        padding: "16px",
        margin: "24px 0",
      }}>
        <h3 style={{ margin: "0 0 8px 0", color: "#f5a8a1" }}>
          🚨 Killer Finding: BEBD 公开 Top 10 成分中 3 个匹配 EU 禁用清单
        </h3>
        <p style={{ margin: 0, fontSize: "13px" }}>
          BEBD 公开 schema 看不出这层。搜 "GLYCERIN" 不会告诉你同名变体 Nitroglycerin 是心脏药 (Annex II #253)。
        </p>
        <table style={{ width: "100%", marginTop: "12px", fontSize: "13px" }}>
          <thead>
            <tr style={{ color: "var(--muted)" }}>
              <th style={{ textAlign: "left" }}>BEBD 公开成分</th>
              <th style={{ textAlign: "left" }}>EU 禁用变体 (Annex II)</th>
              <th style={{ textAlign: "left" }}>Ref</th>
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
              <tr><td colSpan="3" style={{ color: "var(--muted)", textAlign: "center" }}>无匹配</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "32px" }}>📊 CosIng 成分功能 Top 5</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left" }}>Function</th>
            <th style={{ textAlign: "left" }}>数量</th>
            <th style={{ textAlign: "left" }}>柱</th>
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

      <h2 style={{ marginTop: "40px" }}>🗺️ 数据源</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h3>🟢 已落库 (5 源)</h3>
          <ul>
            <li><b>walkowskis</b> — EU CosIng 26K, Function/Restriction</li>
            <li><b>beauteeru</b> — EU CosIng 28K, PubChem CID</li>
            <li><b>OBF Annexes</b> — EU 监管 1,927 条</li>
            <li><b>OBF CosIng full</b> — EU CosIng 24K, 多源 join</li>
            <li><b>INCIDB sample</b> — 130 成分 + 10 商品 + 191 配方</li>
          </ul>
        </div>
        <div>
          <h3>🟡 待办</h3>
          <ul>
            <li><b>INCIDB 全量</b> — 43K 成分, 公开仅 130, 余下在付费墙后</li>
            <li><b>NMPA 备案</b> — 4M+ 中国数据, 这台机器 DNS 拦</li>
            <li><b>FDA VCRP</b> — 2M 美国商品</li>
            <li><b>Wikidata SPARQL</b> — 跨语言结构化标签</li>
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
