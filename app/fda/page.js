import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

const PERIOD_BG_KEYS = {
  "2019-2020": "fda.time.2019_2020",
  "2021-2023": "fda.time.2021_2023",
  "2024-2025": "fda.time.2024_2025",
  "2016-2018": "fda.time.2016_2018",
  "2001-2010": "fda.time.2001_2010",
};

export default async function FDAPage() {
  const lang = await getLangFromCookies(cookies());
  const filePath = path.join(process.cwd(), "public", "fda-cosmetic.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);

  const maxProd = Math.max(...data.top_products.map((p) => p.event_count));
  const maxReact = Math.max(...data.top_reactions.map((r) => r.count));

  return (
    <div>
      <h1>🛡️ {t("fda.title", lang)}</h1>
      <p style={{ color: "var(--muted)" }}>
        {t("fda.source", lang)}: <a href="https://api.fda.gov/cosmetic/event.json" target="_blank" rel="noreferrer">openFDA Cosmetic Event Reports</a>
        {lang === "en" ? " · Public data (US Government, public domain)" : " · 公开数据 (美国政府, 公共领域)"}
        · {t("common.updated", lang)}: {data.summary.last_updated} · {t("fda.fetched", lang)}: {data.fetched_at}
      </p>
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>
        {data.summary.disclaimer}
      </p>

      {/* Hero stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "16px 0" }}>
        <Stat num={data.summary.total_events.toLocaleString()} label={t("fda.kpi.events", lang)} color="var(--red)" />
        <Stat num={data.gender_split[0].count.toLocaleString()} label={t("fda.kpi.female", lang)} color="var(--accent)" />
        <Stat num={data.gender_split[1].count.toLocaleString()} label={t("fda.kpi.male", lang)} color="var(--muted)" />
        <Stat num={data.top_products[0].event_count.toLocaleString()} label={data.top_products[0].product} color="var(--red)" />
        <Stat num={data.top_reactions[0].count.toLocaleString()} label={t("fda.kpi.ovarian", lang)} color="var(--red)" />
        <Stat num="2001-2025" label={t("fda.kpi.years", lang)} />
      </div>

      {/* Key signals */}
      <h2>{t("fda.signals.title", lang)}</h2>
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
      <h2>{t("fda.products.title", lang)}</h2>
      <p className="muted" style={{ fontSize: "13px" }}>
        {t("fda.products.note", lang)}
      </p>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>#</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.products.col.product", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.products.col.count", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("common.bar", lang)}</th>
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
      <h2>{t("fda.reactions.title", lang)}</h2>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>#</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.reactions.col.reaction", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.reactions.col.count", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("common.bar", lang)}</th>
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
      <h2>{t("fda.time.title", lang)}</h2>
      <p className="muted" style={{ fontSize: "13px" }}>
        {t("fda.time.note", lang)}
      </p>
      <table>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.time.col.range", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.time.col.events", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("fda.time.col.bg", lang)}</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.yearly_activity).map(([period, count]) => (
            <tr key={period}>
              <td style={{ padding: "8px 12px" }}>{period}</td>
              <td style={{ padding: "8px 12px" }}>{count.toLocaleString()}</td>
              <td style={{ padding: "8px 12px", color: "var(--muted)", fontSize: "12px" }}>
                {PERIOD_BG_KEYS[period] ? t(PERIOD_BG_KEYS[period], lang) : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sample events */}
      <h2>{t("fda.samples.title", lang)}</h2>
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

      <h2>{t("fda.linkage.title", lang)}</h2>
      <ul>
        {[
          t("fda.linkage.l1", lang),
          t("fda.linkage.l2", lang),
          t("fda.linkage.l3", lang),
          t("fda.linkage.l4", lang),
        ].map((html, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </ul>

      <p style={{ marginTop: "32px", color: "var(--muted)", fontSize: "12px" }}>
        <Link href="/">{t("fda.back", lang)}</Link> · <Link href="/sources">{t("nav.sources", lang)}</Link>
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
