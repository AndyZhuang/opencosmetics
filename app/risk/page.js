"use client";
import { useState } from "react";
import Link from "next/link";

// 6 预置配方 (中英同源)
const PRESET_FORMULAS = {
  "孕妇美白": { en: "Pregnant Whitening", list: ["RETINOL", "HYDROQUINONE", "VITAMIN_C", "NIACINAMIDE", "GLYCERIN"] },
  "敏感肌抗老": { en: "Sensitive Anti-aging", list: ["RETINOL", "AHA", "VITAMIN_C", "NIACINAMIDE", "BHA", "COPPER_PEPTIDES"] },
  "祛痘": { en: "Acne Treatment", list: ["BENZOYL_PEROXIDE", "BHA", "RETINOL", "VITAMIN_C", "NIACINAMIDE", "GLYCERIN"] },
  "儿童润肤": { en: "Baby Moisturizer", list: ["GLYCERIN", "HYALURONIC_ACID", "CERAMIDE", "SQUALANE", "PANTHENOL"] },
  "防晒": { en: "Sunscreen", list: ["OXYBENZONE", "TITANIUM_DIOXIDE", "OCTINOXATE", "AVOBENZONE", "HOMOSALATE"] },
  "安全基础": { en: "Safe Base", list: ["GLYCERIN", "HYALURONIC_ACID", "SQUALANE", "PANTHENOL", "CERAMIDE", "NIACINAMIDE"] },
};

const LABELS = {
  zh: {
    title: "⚖️ 配方风险审查",
    subtitle: "65 规则 × 7 类 — MixMyRoutine + STSC 2015 + NIFDC",
    tagline: "实时检查成分兼容性 / pH / 浓度 / 特殊人群 / 区域合规 — Claude / GPT 可通过 MCP 调用",
    ingredients_label: "成分列表 (逗号/换行分隔)",
    population_label: "人群",
    region_label: "地区",
    check_btn: "🔍 审查配方",
    checking: "⏳ 审查中...",
    presets: "预置配方:",
    pop_adult: "成人", pop_pregnant: "孕妇", pop_child: "儿童 (0-12)", pop_sensitive: "敏感肌",
    reg_cn: "🇨🇳 中国", reg_eu: "🇪🇺 欧盟", reg_us: "🇺🇸 美国", reg_kr: "🇰🇷 韩国", reg_jp: "🇯🇵 日本", reg_asean: "🇦🇸 东盟",
    result_title: "📋 审查结果",
    severity: "严重度", category: "类别", rule: "规则", matched: "匹配", explanation: "说明",
    block: "BLOCK", warn: "WARN", info: "INFO", total: "总规则",
    pass: "✅ 所有规则通过。无风险。",
    coverage: "📚 规则覆盖",
    cov_compat: "成分配伍, pH 冲突", cov_ph: "驻留/淋洗/儿童/特殊部位", cov_conc: "STSC 2015 + EU + FDA",
    cov_pop: "孕妇/婴幼儿/敏感肌", cov_region: "CN/EU/US/KR/JP/ASEAN", cov_synbio: "重组胶原 / 透明质酸 / NMN", cov_fda: "openFDA 85,511 reports",
    error: "❌ 错误:",
    mcp_link: "MCP",
  },
  en: {
    title: "⚖️ Formula Risk Review",
    subtitle: "65 rules × 7 categories — MixMyRoutine + STSC 2015 + NIFDC",
    tagline: "Real-time check: compatibility / pH / concentration / special population / region — Claude/GPT can call via MCP",
    ingredients_label: "Ingredients (comma/newline separated)",
    population_label: "Population",
    region_label: "Region",
    check_btn: "🔍 Review Formula",
    checking: "⏳ Reviewing...",
    presets: "Presets:",
    pop_adult: "Adult", pop_pregnant: "Pregnant", pop_child: "Child (0-12)", pop_sensitive: "Sensitive Skin",
    reg_cn: "🇨🇳 China", reg_eu: "🇪🇺 EU", reg_us: "🇺🇸 USA", reg_kr: "🇰🇷 Korea", reg_jp: "🇯🇵 Japan", reg_asean: "🇦🇸 ASEAN",
    result_title: "📋 Review Result",
    severity: "Severity", category: "Category", rule: "Rule", matched: "Matched", explanation: "Explanation",
    block: "BLOCK", warn: "WARN", info: "INFO", total: "Total Rules",
    pass: "✅ All rules passed. No risk.",
    coverage: "📚 Rule Coverage",
    cov_compat: "Compatibility, pH conflict", cov_ph: "Leave-on/rinse-off/child/special", cov_conc: "STSC 2015 + EU + FDA",
    cov_pop: "Pregnant/infant/sensitive", cov_region: "CN/EU/US/KR/JP/ASEAN", cov_synbio: "Recombinant collagen / HA / NMN", cov_fda: "openFDA 85,511 reports",
    error: "❌ Error:",
    mcp_link: "MCP",
  },
};

export default function RiskPage() {
  // Read initial language from localStorage (client-side)
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("opencosmetics_lang") || "both";
    }
    return "both";
  });
  // For "both" mode, default to Chinese display (since data is in English INCI, UI labels in zh)
  const isEnglish = lang === "en";
  const L = isEnglish ? LABELS.en : LABELS.zh;

  const [ingredients, setIngredients] = useState("RETINOL, AHA, VITAMIN_C, NIACINAMIDE, BHA");
  const [population, setPopulation] = useState("adult");
  const [region, setRegion] = useState("CN");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update language on focus
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("opencosmetics_lang") || "both";
    if (stored !== lang) setLang(stored);
  }

  async function check() {
    setLoading(true);
    setError(null);
    try {
      const ings = ingredients.split(/[,\n;]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      const res = await fetch("/api/risk/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ings, context: { population, region } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(name) {
    const preset = PRESET_FORMULAS[name];
    setIngredients(preset.list.join(", "));
    if (name.includes("孕妇") || name === "Pregnant Whitening") setPopulation("pregnant");
    else if (name.includes("儿童") || name === "Baby Moisturizer") setPopulation("child");
    else setPopulation("adult");
  }

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        {L.title}
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          {L.subtitle}
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        {L.tagline}{" "}
        <Link href="/api/mcp" style={{ color: "var(--blue)" }}>{L.mcp_link}</Link>
      </p>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>{isEnglish ? "🧪 Formula Review" : "🧪 配方审查"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>{L.ingredients_label}</label>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
              rows={3} style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "8px", fontFamily: "monospace", fontSize: "12px" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>{L.population_label}</label>
            <select value={population} onChange={(e) => setPopulation(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              <option value="adult">{L.pop_adult}</option>
              <option value="pregnant">{L.pop_pregnant}</option>
              <option value="child">{L.pop_child}</option>
              <option value="sensitive">{L.pop_sensitive}</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>{L.region_label}</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              <option value="CN">{L.reg_cn}</option>
              <option value="EU">{L.reg_eu}</option>
              <option value="US">{L.reg_us}</option>
              <option value="KR">{L.reg_kr}</option>
              <option value="JP">{L.reg_jp}</option>
              <option value="ASEAN">{L.reg_asean}</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={check} disabled={loading} style={{ padding: "10px 16px", background: "var(--blue)", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "wait" : "pointer" }}>
              {loading ? L.checking : L.check_btn}
            </button>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--muted)" }}>
          {L.presets}
          {Object.keys(PRESET_FORMULAS).map((name) => (
            <button key={name} onClick={() => applyPreset(name)} style={{ margin: "0 4px", padding: "2px 8px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
              {isEnglish ? PRESET_FORMULAS[name].en : name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "8px", padding: "12px", color: "#f5a8a1" }}>
          {L.error} {error}
        </div>
      )}

      {result && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>{L.result_title}</h2>
            <span style={{
              fontSize: "20px", fontWeight: "600",
              color: result.summary === "REJECT" ? "var(--red)" : result.summary === "REVIEW" ? "var(--orange)" : "var(--green)",
            }}>
              {result.summary}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
              <Badge num={result.block_count} label={L.block} color="var(--red)" />
              <Badge num={result.warn_count} label={L.warn} color="var(--orange)" />
              <Badge num={result.findings.length} label={L.total} color="var(--blue)" />
            </div>
          </div>

          {result.findings.length === 0 ? (
            <p style={{ color: "var(--green)" }}>{L.pass}</p>
          ) : (
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th style={{ textAlign: "left" }}>{L.severity}</th>
                  <th style={{ textAlign: "left" }}>{L.category}</th>
                  <th style={{ textAlign: "left" }}>{L.rule}</th>
                  <th style={{ textAlign: "left" }}>{L.matched}</th>
                  <th style={{ textAlign: "left" }}>{L.explanation}</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td><Sev sev={f.severity} L={L} /></td>
                    <td><code style={{ fontSize: "11px" }}>{f.category}</code></td>
                    <td><code style={{ fontSize: "11px", color: "var(--blue)" }}>{f.id}</code></td>
                    <td>
                      {f.matched && f.matched.map((m, j) => (
                        <span key={j} style={{ background: "var(--bg)", padding: "1px 6px", borderRadius: "3px", marginRight: "3px", fontSize: "11px" }}>{m}</span>
                      ))}
                    </td>
                    <td style={{ fontSize: "12px" }}>{f.rationale || `${f.ingredient} ${f.max_concentration || ""}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>{L.coverage}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", fontSize: "13px" }}>
          <Cat name={isEnglish ? "Compatibility" : "兼容性"} n="15" desc={L.cov_compat} />
          <Cat name={isEnglish ? "pH Safety" : "pH 安全"} n="8" desc={L.cov_ph} />
          <Cat name={isEnglish ? "Concentration" : "浓度限值"} n="14" desc={L.cov_conc} />
          <Cat name={isEnglish ? "Special Pop" : "特殊人群"} n="10" desc={L.cov_pop} />
          <Cat name={isEnglish ? "Region Reg" : "区域合规"} n="13" desc={L.cov_region} />
          <Cat name={isEnglish ? "Synbio" : "合成生物"} n="5" desc={L.cov_synbio} />
          <Cat name={isEnglish ? "FDA Events" : "FDA 事件"} n="6" desc={L.cov_fda} />
        </div>
      </div>
    </div>
  );
}

function Sev({ sev, L }) {
  if (sev === "block") return <span style={{ background: "rgba(231,76,60,0.2)", color: "#f5a8a1", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>🚫 {L.block}</span>;
  if (sev === "warn") return <span style={{ background: "rgba(241,196,15,0.2)", color: "#f5d491", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>⚠️ {L.warn}</span>;
  return <span style={{ background: "var(--bg)", color: "var(--muted)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>{L.info}</span>;
}
function Badge({ num, label, color }) {
  return (
    <div style={{ background: "var(--bg)", padding: "6px 12px", borderRadius: "4px", textAlign: "center" }}>
      <div style={{ fontSize: "20px", fontWeight: "600", color }}>{num}</div>
      <div style={{ fontSize: "10px", color: "var(--muted)" }}>{label}</div>
    </div>
  );
}
function Cat({ name, n, desc }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "8px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <strong>{name}</strong>
        <span style={{ color: "var(--blue)", fontWeight: "600" }}>{n}</span>
      </div>
      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>{desc}</div>
    </div>
  );
}
