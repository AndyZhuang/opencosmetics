"use client";
import { useState } from "react";
import Link from "next/link";

const PRESET_FORMULAS = {
  "孕妇美白": ["RETINOL", "HYDROQUINONE", "VITAMIN_C", "NIACINAMIDE", "GLYCERIN"],
  "敏感肌抗老": ["RETINOL", "AHA", "VITAMIN_C", "NIACINAMIDE", "BHA", "COPPER_PEPTIDES"],
  "祛痘": ["BENZOYL_PEROXIDE", "BHA", "RETINOL", "VITAMIN_C", "NIACINAMIDE", "GLYCERIN"],
  "儿童润肤": ["GLYCERIN", "HYALURONIC_ACID", "CERAMIDE", "SQUALANE", "PANTHENOL"],
  "防晒": ["OXYBENZONE", "TITANIUM_DIOXIDE", "OCTINOXATE", "AVOBENZONE", "HOMOSALATE"],
  "安全基础": ["GLYCERIN", "HYALURONIC_ACID", "SQUALANE", "PANTHENOL", "CERAMIDE", "NIACINAMIDE"],
};

export default function RiskPage() {
  const [ingredients, setIngredients] = useState("RETINOL, AHA, VITAMIN_C, NIACINAMIDE, BHA");
  const [population, setPopulation] = useState("adult");
  const [region, setRegion] = useState("CN");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setIngredients(PRESET_FORMULAS[name].join(", "));
    if (name.includes("孕妇") || name.includes("儿童")) setPopulation(name.includes("儿童") ? "child" : "pregnant");
    else setPopulation("adult");
  }

  return (
    <div>
      <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
        ⚖️ 配方风险审查
        <span style={{ fontSize: "16px", color: "var(--muted)", marginLeft: "12px" }}>
          65 规则 × 7 类 — MixMyRoutine + STSC 2015 + NIFDC
        </span>
      </h1>
      <p style={{ color: "var(--muted)" }}>
        实时检查成分兼容性 / pH / 浓度 / 特殊人群 / 区域合规 — Claude / GPT 可通过 <Link href="/api/mcp" style={{ color: "var(--blue)" }}>MCP</Link> 调用
      </p>

      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>🧪 配方审查</h2>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>成分列表 (逗号/换行分隔)</label>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
              rows={3} style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "8px", fontFamily: "monospace", fontSize: "12px" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>人群</label>
            <select value={population} onChange={(e) => setPopulation(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              <option value="adult">成人</option>
              <option value="pregnant">孕妇</option>
              <option value="child">儿童 (0-12)</option>
              <option value="sensitive">敏感肌</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "var(--muted)" }}>地区</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: "100%", padding: "8px", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px" }}>
              <option value="CN">🇨🇳 中国</option>
              <option value="EU">🇪🇺 欧盟</option>
              <option value="US">🇺🇸 美国</option>
              <option value="KR">🇰🇷 韩国</option>
              <option value="JP">🇯🇵 日本</option>
              <option value="ASEAN">🇦🇸 东盟</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={check} disabled={loading} style={{ padding: "10px 16px", background: "var(--blue)", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "wait" : "pointer" }}>
              {loading ? "⏳ 审查中..." : "🔍 审查配方"}
            </button>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--muted)" }}>
          预置配方:
          {Object.keys(PRESET_FORMULAS).map((name) => (
            <button key={name} onClick={() => applyPreset(name)} style={{ margin: "0 4px", padding: "2px 8px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "8px", padding: "12px", color: "#f5a8a1" }}>
          ❌ 错误: {error}
        </div>
      )}

      {result && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", margin: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <h2 style={{ margin: 0 }}>📋 审查结果</h2>
            <span style={{
              fontSize: "20px", fontWeight: "600",
              color: result.summary === "REJECT" ? "var(--red)" : result.summary === "REVIEW" ? "var(--orange)" : "var(--green)",
            }}>
              {result.summary}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
              <Badge num={result.block_count} label="BLOCK" color="var(--red)" />
              <Badge num={result.warn_count} label="WARN" color="var(--orange)" />
              <Badge num={result.findings.length} label="总规则" color="var(--blue)" />
            </div>
          </div>

          {result.findings.length === 0 ? (
            <p style={{ color: "var(--green)" }}>✅ 所有规则通过。无风险。</p>
          ) : (
            <table style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th style={{ textAlign: "left" }}>严重度</th>
                  <th style={{ textAlign: "left" }}>类别</th>
                  <th style={{ textAlign: "left" }}>规则</th>
                  <th style={{ textAlign: "left" }}>匹配</th>
                  <th style={{ textAlign: "left" }}>说明</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td><Sev sev={f.severity} /></td>
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
        <h2 style={{ margin: "0 0 12px 0", fontSize: "18px" }}>📚 规则覆盖</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", fontSize: "13px" }}>
          <Cat name="兼容性" n="15" desc="成分配伍, pH 冲突" />
          <Cat name="pH 安全" n="8" desc="驻留/淋洗/儿童/特殊部位" />
          <Cat name="浓度限值" n="14" desc="STSC 2015 + EU + FDA" />
          <Cat name="特殊人群" n="10" desc="孕妇/婴幼儿/敏感肌" />
          <Cat name="区域合规" n="13" desc="CN/EU/US/KR/JP/ASEAN 6 大地区" />
          <Cat name="合成生物" n="5" desc="重组胶原 / 透明质酸 / NMN" />
          <Cat name="FDA 事件" n="6" desc="openFDA 85,511 reports" />
        </div>
      </div>
    </div>
  );
}

function Sev({ sev }) {
  if (sev === "block") return <span style={{ background: "rgba(231,76,60,0.2)", color: "#f5a8a1", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>🚫 BLOCK</span>;
  if (sev === "warn") return <span style={{ background: "rgba(241,196,15,0.2)", color: "#f5d491", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>⚠️ WARN</span>;
  return <span style={{ background: "var(--bg)", color: "var(--muted)", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>INFO</span>;
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
