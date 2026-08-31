// /api/china/ingredient — query NMPA IECIC I/II, returns Chinese + INCI + regulatory notes
import { query, queryOne } from "../../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 200);

  if (!q) {
    return Response.json({ error: "q parameter required (Chinese name or INCI)" }, { status: 400 });
  }

  // Search IECIC I + II
  const sql = `
    SELECT 'IECIC-I' AS source, seq, chinese_name, inci_name, note
    FROM cn_iecic_i
    WHERE chinese_name ILIKE ? OR inci_name ILIKE ?
    ORDER BY seq
    LIMIT ?
  `;
  const params = [`%${q}%`, `%${q}%`, limit];
  const rows = await query(sql, params);

  // Also search IECIC II
  const sql2 = `
    SELECT 'IECIC-II' AS source, seq, chinese_name, inci_name, NULL AS note
    FROM cn_iecic_ii
    WHERE chinese_name ILIKE ? OR inci_name ILIKE ?
    LIMIT ?
  `;
  const rows2 = await query(sql2, [`%${q}%`, `%${q}%`, limit]);

  return Response.json({
    query: q,
    total: rows.length + rows2.length,
    iecic_i: rows,
    iecic_ii: rows2,
    source_meta: {
      iecic_i: "NMPA 2025 年第 61 号公告附件 1 (xlsx)",
      iecic_ii: "NMPA 2025 年第 61 号公告附件 2 (docx)",
      adjustments: "NMPA 2025 年第 61 号公告附件 3 (docx)",
      last_updated: "2025-06-23",
    },
  });
}
