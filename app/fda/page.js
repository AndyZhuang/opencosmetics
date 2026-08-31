import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function FDAPage() {
  // Read the FDA JSON from public/ — works for both server-side render and static export
  const filePath = path.join(process.cwd(), "public", "fda-cosmetic.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  const maxProd = Math.max(...data.top_products.map((p) => p.event_count));
  const maxReact = Math.max(...data.top_reactions.map((r) => r.count));

  return (
    <div>
      <h1>🛡️ openFDA Cosmetic Event Reports</h1>
      <p style={{ color: "var(--muted)" }}>
        来源: <a href="https://api.fda.gov/cosmetic/event.json" target="_blank" rel="noreferrer">openFDA Cosmetic Event Reports</a> · 公开数据 (美国政府, 公共领域)
        · 最近更新: {data.summary.last_updated} · 本地快照: {data.fetched_at}
      </p>
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>
        {data.summary.disclaimer}
      </p>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "16px 0" }}>
        <Stat num={data.summary.total_events.toLocaleString()} label="Cosmetic 事件" color="var(--red)" />
        <Stat num={data.gender_split[0].count.toLocaleString()} label="女性 (95.7%)" color="var(--accent)" />
        <Stat num={data.gender_split[1].count.toLocaleString()} label="男性 (4.3%)" color="var(--muted)" />
        <Stat num={data.top_products[0].event_count.toLocaleString()} label="Johnsons Powder No UPC" color="var(--red)" />
        <Stat num={data.top_reactions[0].count.toLocaleString()} label="Ovarian Cancer 反应" color="var(--red)" />
        <Stat num="2001-2025" label="24 年" />
      </div>

      {/* Key signals */}
      <h2>🚨 关键安全信号 (4 个)</h2>
      {data.key_signals.map((s, i) => (
        <div key={i} style={{
          background: "rgba(231,76,60,0.1)",
          border: "1px solid rgba(231,76,60,0.3)",
          borderRadius: "8px",
          padding: "12px 16px",
          margin: "12px 0",
        }}>
          <h3 style={{ margin: "0 0 6px 0", color: "#f5a8a1" }}>{s.signal}</h3>
          <p style={{ margin: "0 0 4px 0", fontSize: "13px" }}>{s.evidence}</p>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>↳ {s.severity}</p>
        </div>
      ))}

      {/* Top products */}
      <h2>📦 Top 20 被报告产品</h2>
      <p className="muted" style={{ fontSize: "13px" }}>
        注: 这些是 user-reported 名字, 同一产品多个变体, 例如 J&J Baby Powder 在 5 个不同写法下总共 84K+ 报告
      </p>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>#</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>产品名</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>事件数</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>柱</th>
          </tr>
        </thead>
        <tbody>
          {data.top_products.map((p, i) => {
            const w = Math.round(400 * p.event_count / maxProd);
            const isJnj = p.product.toLowerCase().includes("johnson") || p.product.toLowerCase().includes("j & j") || p.product.toLowerCase().includes("j and j") || p.product.toLowerCase().includes("shower");
            return (
              <tr key={i}>
                <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{i + 1}</td>
                <td style={{ padding: "8px 12px", color: isJnj ? "var(--red)" : "inherit" }}>{p.product}</td>
                <td style={{ padding: "8px 12px" }}>{p.event_count.toLocaleString()}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ display: "inline-block", height: "8px", background: isJnj ? "var(--red)" : "var(--accent)", borderRadius: "2px", width: `${w}px` }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Top reactions */}
      <h2>⚠️ Top 20 不良反应</h2>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>#</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>反应</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>次数</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>柱</th>
          </tr>
        </thead>
        <tbody>
          {data.top_reactions.map((r, i) => {
            const w = Math.round(400 * r.count / maxReact);
            const isCancer = r.reaction.toLowerCase().includes("cancer") || r.reaction.toLowerCase().includes("mesothelioma") || r.reaction.toLowerCase().includes("death") || r.reaction.toLowerCase().includes("injury");
            return (
              <tr key={i}>
                <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{i + 1}</td>
                <td style={{ padding: "8px 12px", color: isCancer ? "var(--red)" : "inherit" }}>{r.reaction}</td>
                <td style={{ padding: "8px 12px" }}>{r.count.toLocaleString()}</td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ display: "inline-block", height: "8px", background: isCancer ? "var(--red)" : "var(--orange)", borderRadius: "2px", width: `${w}px` }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Yearly activity */}
      <h2>📅 按时间分布 (估算)</h2>
      <p className="muted" style={{ fontSize: "13px" }}>
        早期记录少 (1990s MoCRA 实施前), 2018 后开始指数增长 (WEN/DevaCurl 诉讼 + J&J talc 系列宣判)
      </p>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>区间</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>事件估算</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>背景</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.yearly_activity).map(([period, count]) => (
            <tr key={period}>
              <td style={{ padding: "8px 12px" }}>{period}</td>
              <td style={{ padding: "8px 12px" }}>{count.toLocaleString()}</td>
              <td style={{ padding: "8px 12px", color: "var(--muted)", fontSize: "12px" }}>
                {period === "2019-2020" && "J&J talc 判决 + WEN 集体诉讼"}
                {period === "2021-2023" && "DevaCurl 诉讼激增"}
                {period === "2024-2025" && "MoCRA 2023 实施后, 报告要求强化"}
                {period === "2016-2018" && "J&J 系列诉讼进入联邦法院"}
                {period === "2001-2010" && "FDA 自愿报告, 极少数"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sample events */}
      <h2>📋 样本事件 (3 条)</h2>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Report #</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Date</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Patient</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Products (Suspect)</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Reactions</th>
          </tr>
        </thead>
        <tbody>
          {data.sample_events.map((e, i) => (
            <tr key={i}>
              <td style={{ padding: "8px 12px", color: "var(--muted)" }}>{e.report_number}</td>
              <td style={{ padding: "8px 12px" }}>{e.date}</td>
              <td style={{ padding: "8px 12px" }}>{e.patient.gender} {e.patient.age}y</td>
              <td style={{ padding: "8px 12px", color: "var(--orange)" }}>
                {e.products.filter((p) => p.role === "Suspect").map((p) => p.name).join(", ") || "(none — only concomitant)"}
              </td>
              <td style={{ padding: "8px 12px", color: "var(--red)", fontSize: "12px" }}>{e.reactions.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>🔗 与 BEBD / CosIng 的关联</h2>
      <ul>
        <li>BEBD 公开 Top 8 成分均**未出现在 FDA 不良反应 Top 20** (美修指数榜 ≠ 安全榜)</li>
        <li>BEBD "美修指数 99.82" 全部相同的 Top 10 成分也**没有 1 个在 FDA Top 反应里**</li>
        <li>FDA 的真实信号是 <b>产品名</b> (J&J, WEN, DevaCurl) 而非 <b>成分</b> — BEBD schema 完全看不到产品名层</li>
        <li>我们 v3 数据加上 openFDA 后, 真正能跑 "成分 × 安全信号" 跨源 join</li>
      </ul>

      <p style={{ marginTop: "32px", color: "var(--muted)", fontSize: "12px" }}>
        <Link href="/">← 回首页</Link> · <Link href="/sources">数据源</Link>
      </p>
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
