import { query } from "../../lib/db";
import Link from "next/link";
import { cookies } from "next/headers";
import { t, getLangFromCookies } from "../../lib/i18n";

export const dynamic = "force-dynamic";

export default async function IngredientsPage({ searchParams }) {
  const sp = await searchParams;
  const lang = await getLangFromCookies(cookies());
  const q = (sp?.q || "").trim();
  const page = Math.max(1, parseInt(sp?.page || "1", 10) || 1);
  const size = 50;
  const offset = (page - 1) * size;

  // In zh mode, also search by Chinese name (joined from cn_iecic_i)
  let where, params, countSql, rowsSql;
  if (q) {
    if (lang === "zh") {
      // Search both INCI and Chinese name
      where = `WHERE (
          LOWER(c.inci_name) LIKE '%' || LOWER(?) || '%'
          OR LOWER(COALESCE(n.chinese_name, '')) LIKE '%' || LOWER(?) || '%'
          OR LOWER(COALESCE(c.function, '')) LIKE '%' || LOWER(?) || '%'
          OR LOWER(COALESCE(c.cas_no, '')) LIKE '%' || LOWER(?) || '%'
        )`;
      params = [q, q, q, q];
      countSql = `
        SELECT COUNT(DISTINCT c.inci_name) AS n
        FROM cosing c
        LEFT JOIN cn_iecic_i n ON UPPER(c.inci_name) = UPPER(n.inci_name)
        ${where}
      `;
      rowsSql = `
        SELECT DISTINCT c.inci_name, c.cas_no, c.function, c.restriction,
               n.chinese_name
        FROM cosing c
        LEFT JOIN cn_iecic_i n ON UPPER(c.inci_name) = UPPER(n.inci_name)
        ${where}
        ORDER BY c.inci_name
        LIMIT ? OFFSET ?
      `;
    } else {
      where = `WHERE LOWER(inci_name) LIKE '%' || LOWER(?) || '%'
        OR LOWER(COALESCE(function, '')) LIKE '%' || LOWER(?) || '%'
        OR LOWER(COALESCE(cas_no, '')) LIKE '%' || LOWER(?) || '%'`;
      params = [q, q, q];
      countSql = `SELECT COUNT(*) AS n FROM cosing ${where}`;
      rowsSql = `SELECT inci_name, cas_no, function, restriction
       FROM cosing ${where}
       ORDER BY inci_name
       LIMIT ? OFFSET ?`;
    }
  } else {
    where = "";
    params = [];
    countSql = "SELECT COUNT(*) AS n FROM cosing";
    rowsSql = `SELECT c.inci_name, c.cas_no, c.function, c.restriction,
             n.chinese_name
             FROM cosing c
             LEFT JOIN cn_iecic_i n ON UPPER(c.inci_name) = UPPER(n.inci_name)
             ORDER BY c.inci_name
             LIMIT ? OFFSET ?`;
  }

  const totalRow = await query(countSql, params);
  const total = Number(totalRow[0].n);
  const pages = Math.max(1, Math.ceil(total / size));

  // Always pass [size, offset] for the rows query (after the WHERE clause params)
  const rowsParams = lang === "zh" ? [...params, size, offset] : [...params, size, offset];
  const rows = await query(rowsSql, rowsParams);

  return (
    <div>
      <h1>{t("ingredients.title", lang)} ({total.toLocaleString()})</h1>
      <form method="GET" style={{ marginBottom: "16px" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder={t("ingredients.search.placeholder", lang)}
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
        {t("ingredients.pagination", lang, {
          from: offset + 1,
          to: Math.min(offset + size, total),
          total: total.toLocaleString(),
          page,
          pages,
        })}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>
              {lang === "en" ? "INCI Name" : "中文名称 / INCI"}
            </th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("ingredients.cas", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("ingredients.fn", lang)}</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>{t("ingredients.restrictions", lang)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 12px" }}>
                <Link href={`/ingredients/${encodeURIComponent(r.inci_name)}`}>
                  {lang === "en" || !r.chinese_name ? (
                    r.inci_name
                  ) : (
                    <span>
                      <strong>{r.chinese_name}</strong>
                      <br/>
                      <code style={{ fontSize: "10px", color: "var(--muted)" }}>{r.inci_name}</code>
                    </span>
                  )}
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
        {page > 1 && <Link href={`/ingredients?${new URLSearchParams({q, page: String(page - 1)})}`}>{t("ingredients.prev", lang)}</Link>}
        {page < pages && <Link href={`/ingredients?${new URLSearchParams({q, page: String(page + 1)})}`}>{t("ingredients.next", lang)}</Link>}
      </div>
    </div>
  );
}
