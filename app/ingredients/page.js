import { query } from "../../lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IngredientsPage({ searchParams }) {
  const sp = await searchParams;
  const q = (sp?.q || "").trim();
  const page = Math.max(1, parseInt(sp?.page || "1", 10) || 1);
  const size = 50;
  const offset = (page - 1) * size;

  const where = q
    ? `WHERE LOWER(inci_name) LIKE '%' || LOWER(?) || '%'
        OR LOWER(COALESCE(function, '')) LIKE '%' || LOWER(?) || '%'
        OR LOWER(COALESCE(cas_no, '')) LIKE '%' || LOWER(?) || '%'`
    : "";
  const params = q ? [q, q, q] : [];

  const totalRow = await query(
    `SELECT COUNT(*) AS n FROM cosing ${where}`,
    params
  );
  const total = Number(totalRow[0].n);
  const pages = Math.max(1, Math.ceil(total / size));

  const rows = await query(
    `SELECT inci_name, cas_no, function, restriction
     FROM cosing ${where}
     ORDER BY inci_name
     LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  return (
    <div>
      <h1>🧬 成分库 ({total.toLocaleString()})</h1>
      <form method="GET" style={{ marginBottom: "16px" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="搜 INCI / CAS / 功能..."
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "12px 16px",
            color: "var(--text)",
            width: "100%",
            maxWidth: "500px",
            fontSize: "14px",
          }}
        />
      </form>
      <div style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "12px" }}>
        第 {offset + 1}-{Math.min(offset + size, total)} / {total.toLocaleString()} 条 · 第 {page} / {pages} 页
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>INCI 名称</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>CAS</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Function</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>Restriction</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 12px" }}>
                <Link href={`/ingredients/${encodeURIComponent(r.inci_name)}`}>
                  {r.inci_name}
                </Link>
              </td>
              <td style={{ padding: "8px 12px", color: "var(--muted)" }}>
                {r.cas_no || "—"}
              </td>
              <td style={{ padding: "8px 12px" }}>
                {r.function ? (
                  r.function.split(",").map((f, j) => (
                    <span key={j} style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      background: "var(--border)",
                      color: "var(--muted)",
                      marginRight: "4px",
                    }}>{f.trim()}</span>
                  ))
                ) : "—"}
              </td>
              <td style={{ padding: "8px 12px", color: "var(--muted)", fontSize: "12px" }}>
                {r.restriction || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* pagination */}
      <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
        {page > 1 && <Link href={`/ingredients?${new URLSearchParams({q, page: String(page - 1)})}`}>← 上一页</Link>}
        {page < pages && <Link href={`/ingredients?${new URLSearchParams({q, page: String(page + 1)})}`}>下一页 →</Link>}
      </div>
    </div>
  );
}
