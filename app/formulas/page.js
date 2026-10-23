"use client";
// app/formulas/page.js — 我的配方 (设备维度草稿)
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function deviceId() {
  if (typeof window === "undefined") return "anonymous";
  const k = "fl_device_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = "d_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(k, v);
  }
  return v;
}

export default function FormulasPage() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [cmp, setCmp] = useState([]);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/formulas", { headers: { "x-device-id": deviceId() } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setItems(j.formulas || []);
    } catch (e) {
      setErr(e.message);
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id) {
    if (!confirm("删除这个配方草稿?")) return;
    await fetch(`/api/formulas/${id}`, { method: "DELETE", headers: { "x-device-id": deviceId() } });
    load();
  }

  async function openInBench(id) {
    const r = await fetch(`/api/formulas/${id}`, { headers: { "x-device-id": deviceId() } });
    const j = await r.json();
    if (!j.ok) return;
    try {
      sessionStorage.setItem("fl_open_formula", JSON.stringify({ name: j.formula.name, lines: j.formula.lines }));
    } catch { /* ignore */ }
    router.push("/bench");
  }

  function toggleCompare(id) {
    setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 2 ? [c[1], id] : [...c, id]));
  }

  return (
    <>
      <div className="page-title" style={{ marginTop: 28 }}>我的配方</div>
      <p className="page-lede">草稿按设备保存, 不上传账号体系。勾选两个版本可以做成分与成本差异对比。</p>

      {err && <div className="bench-card"><div className="bench-card-body" style={{ color: "var(--block)" }}>{err}</div></div>}
      {items === null && <div className="bench-empty">加载中…</div>}
      {items && items.length === 0 && (
        <div className="bench-card">
          <div className="bench-empty">
            还没有草稿。去 <Link href="/bench" style={{ color: "var(--accent)", fontWeight: 600 }}>配方构建器</Link> 建一个, 或从 <Link href="/reference" style={{ color: "var(--accent)", fontWeight: 600 }}>参考配方库</Link> 拉一个进来改。
          </div>
        </div>
      )}

      {items && items.length > 0 && (
        <>
          <div className="wb-tools" style={{ marginBottom: 18 }}>
            {items.map((f) => (
              <div className="wb-tool" key={f.id} style={{ cursor: "default" }}>
                <div className="wb-tool-top">
                  <h3 style={{ fontSize: 14 }}>{f.name}</h3>
                  <span className="tag">v{f.version}</span>
                </div>
                <p>
                  {f.product_type || "未分类"} · {f.region || "—"} · {f.ingredient_count} 成分 · 合计 {f.total_pct}%
                </p>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--muted)" }}>
                  {String(f.updated_at).slice(0, 16).replace("T", " ")}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <button className="oc-btn oc-btn-sm" onClick={() => openInBench(f.id)}>编辑</button>
                  <button
                    className="oc-btn oc-btn-ghost oc-btn-sm"
                    onClick={() => toggleCompare(f.id)}
                    style={cmp.includes(f.id) ? { background: "var(--accent-soft)", borderColor: "var(--accent-line)", color: "var(--accent)" } : {}}
                  >
                    {cmp.includes(f.id) ? "已选" : "对比"}
                  </button>
                  <button className="oc-btn oc-btn-danger oc-btn-sm" onClick={() => remove(f.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>

          {cmp.length === 2 && (
            <ComparePanel a={cmp[0]} b={cmp[1]} onClose={() => setCmp([])} />
          )}
          {cmp.length === 1 && (
            <div className="bench-card" style={{ marginTop: 14 }}>
              <div className="bench-card-body" style={{ fontSize: 13, color: "var(--muted)" }}>再选一个版本即可对比</div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ComparePanel({ a, b, onClose }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [ra, rb] = await Promise.all([a, b].map((id) =>
          fetch(`/api/formulas/${id}`, { headers: { "x-device-id": deviceId() } }).then((r) => r.json())
        ));
        const r = await fetch("/api/formula/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a: { lines: ra.formula.lines }, b: { lines: rb.formula.lines } }),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error);
        setData(j);
      } catch (e) { setErr(e.message); }
    })();
  }, [a, b]);

  return (
    <div className="bench-card" style={{ marginTop: 14 }}>
      <div className="bench-card-head">
        <h3>版本对比</h3>
        <button className="oc-btn oc-btn-ghost oc-btn-sm" onClick={onClose}>关闭</button>
      </div>
      {err && <div className="bench-card-body" style={{ color: "var(--block)" }}>{err}</div>}
      {!data && !err && <div className="bench-loading">对比中…</div>}
      {data && (
        <>
          <div className="bench-cost-grid">
            <div className="bench-cost-cell">
              <div className="l">A 单公斤成本</div>
              <div className="v">¥{data.cost.a.total_per_kg}</div>
            </div>
            <div className="bench-cost-cell">
              <div className="l">B 单公斤成本</div>
              <div className="v">¥{data.cost.b.total_per_kg}</div>
            </div>
            <div className="bench-cost-cell">
              <div className="l">差异</div>
              <div className="v" style={{ color: data.cost.delta_per_kg > 0 ? "var(--block)" : "var(--ok)" }}>
                {data.cost.delta_per_kg > 0 ? "+" : ""}{data.cost.delta_per_kg}
              </div>
            </div>
            <div className="bench-cost-cell">
              <div className="l">变动比例</div>
              <div className="v">{data.cost.delta_pct > 0 ? "+" : ""}{data.cost.delta_pct}%</div>
            </div>
          </div>
          <table className="oc-table" style={{ margin: 0 }}>
            <thead>
              <tr><th>成分</th><th className="num">A %</th><th className="num">B %</th><th className="num">差异</th><th>状态</th></tr>
            </thead>
            <tbody>
              {data.diffs.map((d) => (
                <tr key={d.inci_name}>
                  <td className="inci">{d.inci_name}</td>
                  <td className="num">{d.a_pct}</td>
                  <td className="num">{d.b_pct}</td>
                  <td className="num" style={{ color: d.delta_pct > 0 ? "var(--block)" : d.delta_pct < 0 ? "var(--ok)" : "inherit" }}>
                    {d.delta_pct > 0 ? "+" : ""}{d.delta_pct}
                  </td>
                  <td>
                    <span className="oc-pill oc-pill-gray">
                      {d.status === "added" ? "新增" : d.status === "removed" ? "移除" : "调整"}
                    </span>
                  </td>
                </tr>
              ))}
              {!data.diffs.length && (
                <tr><td colSpan={5} style={{ color: "var(--muted)", textAlign: "center" }}>两个版本成分完全一致</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
