"use client";
// app/ingredients/page.js — 成分库 (客户端检索)
// 旧版是服务端一次性渲染 5 万条 (279KB HTML), 改为按需检索 + 角色/价格/法规维度
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const ROLES = [
  { v: "", l: "全部" },
  { v: "active", l: "功效活性" },
  { v: "solvent", l: "溶剂" },
  { v: "humectant", l: "保湿剂" },
  { v: "emollient", l: "润肤剂" },
  { v: "emulsifier", l: "乳化剂" },
  { v: "surfactant", l: "表活" },
  { v: "thickener", l: "增稠剂" },
  { v: "preservative", l: "防腐剂" },
  { v: "antioxidant", l: "抗氧剂" },
  { v: "uv_filter", l: "紫外线吸收剂" },
  { v: "extract", l: "提取物" },
  { v: "film_former", l: "成膜剂" },
  { v: "chelator", l: "螯合剂" },
  { v: "ph_adjuster", l: "pH调节剂" },
  { v: "colorant", l: "着色剂" },
];

const ONLYS = [
  { v: "", l: "不限" },
  { v: "cn", l: "已入 IECIC" },
  { v: "priced", l: "有价格" },
];

export default function IngredientsPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [only, setOnly] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const timer = useRef(null);

  const load = useCallback(async (query, roleV, onlyV) => {
    setBusy(true);
    setErr("");
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (query) params.set("q", query);
      if (roleV) params.set("role", roleV);
      if (onlyV) params.set("only", onlyV);
      const r = await fetch(`/api/ingredients/search?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setData(j);
    } catch (e) {
      setErr(e.message);
      setData(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(q, role, only), 280);
    return () => timer.current && clearTimeout(timer.current);
  }, [q, role, only, load]);

  const items = data?.items || [];

  return (
    <>
      <div className="page-title" style={{ marginTop: 28 }}>成分库</div>
      <p className="page-lede">
        5 万条 EU CosIng + 9 千条 CN IECIC,叠加 {data?.total_all_sources || 243} 项人工维护的原料画像
        (配方角色 · 典型用量 · 价格区间)。中英文名都能搜。
      </p>

      <div className="bench-card" style={{ marginBottom: 16 }}>
        <div className="bench-card-body">
          <input
            className="oc-input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 15, padding: "13px 15px" }}
            placeholder="搜 INCI 或中文名 —— 如 niacinamide / 烟酰胺 / 角鲨烷"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 2 }}>角色</span>
            {ROLES.map((r) => (
              <button
                key={r.v || "all"}
                className={`oc-btn oc-btn-sm ${role === r.v ? "" : "oc-btn-ghost"}`}
                onClick={() => setRole(r.v)}
              >
                {r.l}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 2 }}>筛选</span>
            {ONLYS.map((o) => (
              <button
                key={o.v || "all"}
                className={`oc-btn oc-btn-sm ${only === o.v ? "" : "oc-btn-ghost"}`}
                onClick={() => setOnly(o.v)}
              >
                {o.l}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              {busy ? "检索中…" : data ? `${data.total} 条结果` : ""}
            </span>
          </div>
        </div>
      </div>

      {err && (
        <div className="bench-card"><div className="bench-card-body" style={{ color: "var(--block)" }}>{err}</div></div>
      )}

      {data && items.length === 0 && (
        <div className="bench-card"><div className="bench-empty">没有匹配的成分, 换个关键词试试</div></div>
      )}

      {items.length > 0 && (
        <div className="bench-card">
          <div style={{ overflowX: "auto" }}>
            <table className="oc-table">
              <thead>
                <tr>
                  <th>INCI</th>
                  <th>中文名</th>
                  <th>角色</th>
                  <th className="num">典型用量</th>
                  <th className="num">价格 CNY/kg</th>
                  <th>CN IECIC</th>
                  <th>EU</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.inci_name}>
                    <td>
                      <Link
                        href={`/ingredients/${encodeURIComponent(it.inci_name)}`}
                        style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600 }}
                      >
                        {it.inci_name}
                      </Link>
                      {it.function && (
                        <div style={{ fontSize: 11, color: "var(--muted)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {it.function}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{it.chinese_name || "—"}</td>
                    <td>
                      <span className="bench-role" data-role={it.role}>{it.role}</span>
                    </td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {it.use_min != null ? `${it.use_min}–${it.use_max}%` : "—"}
                    </td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {it.price_lo != null ? `${it.price_lo}–${it.price_hi}` : "—"}
                    </td>
                    <td>
                      {it.cn_status === "iecic_i_included" ? (
                        <span className="oc-pill oc-pill-green">已收录</span>
                      ) : it.cn_status === "unknown" ? (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      ) : (
                        <span className="oc-pill oc-pill-gray">未收录</span>
                      )}
                    </td>
                    <td>
                      {it.eu_status === "banned" ? (
                        <span className="oc-pill oc-pill-red">禁用</span>
                      ) : it.eu_status === "restricted" ? (
                        <span className="oc-pill oc-pill-yellow">限用</span>
                      ) : it.eu_status === "unknown" ? (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      ) : (
                        <span className="oc-pill oc-pill-green">允许</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bench-foot">
            <span className="bench-total">
              显示前 <b>{items.length}</b> 条,共 <b>{data.total}</b> 条
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              价格为估算参考值,须按供应商报价校准
            </span>
          </div>
        </div>
      )}
    </>
  );
}
