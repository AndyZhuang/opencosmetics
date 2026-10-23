// /api/ingredients/search — 成分检索 (画像库 + CosIng + IECIC 三源合并, 分级排序)
// GET ?q=&limit=&offset=&role=&only=cn|priced|banned
//
// 排序优先级: 精确匹配 > 前缀匹配 > 词中包含; 同级按中文名可检索优先
import { query } from "../../../../lib/db";
import { enrichIngredient, loadProfileIndex, normalizeKey } from "../../../../lib/ingredient_profiles";
import { getLangFromCookies } from "../../../../lib/i18n";
import { cookies } from "next/headers";

function rankOf(inci, qUpper) {
  const key = normalizeKey(inci);
  if (!qUpper) return 3;
  if (key === qUpper) return 0;
  if (key.startsWith(qUpper)) return 1;
  const words = key.split(/[\s,\-()/]+/).filter(Boolean);
  if (words.some((w) => w === qUpper)) return 1;
  if (key.includes(qUpper)) return 2;
  return 3;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 200);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const role = searchParams.get("role") || "";
  const only = searchParams.get("only") || "";
  const lang = await getLangFromCookies(cookies());
  const qUpper = q.toUpperCase();

  const profileIndex = loadProfileIndex();
  const merged = new Map();

  // ---- 来源 1: 画像库 (角色 / 用量 / 价格 / 中文名) ----
  for (const p of profileIndex.values()) {
    const key = normalizeKey(p.inci_name);
    const hitCn = q && p.chinese_name && p.chinese_name.toUpperCase().includes(qUpper);
    const hitInci = qUpper && key.includes(qUpper);
    if (q && !hitCn && !hitInci) continue;
    merged.set(key, {
      inci_name: p.inci_name,
      chinese_name: p.chinese_name,
      function: null,
      cas_no: null,
      ec_no: null,
      inn_name: null,
      restriction: null,
      role: p.role,
      role_is_estimated: false,
      use_min: p.use_min,
      use_max: p.use_max,
      price_lo: p.price_lo,
      price_hi: p.price_hi,
      cn_status: "unknown",
      eu_status: "unknown",
      sources: ["Profile book"],
      _rank: rankOf(p.inci_name, qUpper),
    });
  }

  // ---- 来源 2: EU CosIng + CN IECIC (功能 / CAS / 法规状态) ----
  let dbTotal = 0;
  try {
    if (q) {
      const like = `%${qUpper}%`;
      const cnLike = `%${q}%`;
      const countRow = await query(
        `SELECT count(*) AS c FROM cosing c
         LEFT JOIN cn_iecic_i n ON UPPER(n.inci_name) = UPPER(c.inci_name)
         WHERE UPPER(c.inci_name) LIKE ? OR UPPER(COALESCE(n.chinese_name,'')) LIKE ?`,
        [like, cnLike]
      );
      dbTotal = Number(countRow?.[0]?.c || 0);

      const rows = await query(
        `SELECT c.inci_name, c.function, c.cas_no, c.ec_no, c.inn_name, c.restriction,
                n.chinese_name AS cn_name
         FROM cosing c
         LEFT JOIN cn_iecic_i n ON UPPER(n.inci_name) = UPPER(c.inci_name)
         WHERE UPPER(c.inci_name) LIKE ? OR UPPER(COALESCE(n.chinese_name,'')) LIKE ?
         ORDER BY c.inci_name
         LIMIT ? OFFSET ?`,
        [like, cnLike, 500, 0]
      );

      for (const r of rows) {
        const key = normalizeKey(r.inci_name);
        const e = enrichIngredient(r.inci_name);
        const existing = merged.get(key);
        const dbItem = {
          inci_name: e.inci_name,
          chinese_name: r.cn_name || e.chinese_name || existing?.chinese_name || null,
          function: r.function || null,
          cas_no: r.cas_no || null,
          ec_no: r.ec_no || null,
          inn_name: r.inn_name || null,
          restriction: r.restriction || null,
          role: existing?.role || e.role,
          role_is_estimated: existing ? existing.role_is_estimated : e.role_is_estimated,
          use_min: existing?.use_min ?? e.use_min,
          use_max: existing?.use_max ?? e.use_max,
          price_lo: existing?.price_lo ?? e.price_lo,
          price_hi: existing?.price_hi ?? e.price_hi,
          cn_status: r.cn_name ? "iecic_i_included" : "not_in_iecic",
          eu_status: "allowed",
          sources: [r.cn_name ? "EU CosIng" : "EU CosIng", r.cn_name ? "CN IECIC I" : null].filter(Boolean),
          _rank: rankOf(r.inci_name, qUpper),
        };
        if (existing) {
          // 保留画像库里的规范名 (CosIng 里存在 "SQUALANE (SUCROSE)" 这类脏名)
          merged.set(key, {
            ...dbItem,
            inci_name: existing.inci_name,
            sources: [...new Set([...existing.sources, ...dbItem.sources])],
            role: dbItem.role,
          });
        } else {
          merged.set(key, dbItem);
        }
      }
    }
  } catch (e) {
    console.error("[ingredients/search] db error:", e);
  }

  let items = [...merged.values()].sort((a, b) => {
    if (a._rank !== b._rank) return a._rank - b._rank;
    return a.inci_name.localeCompare(b.inci_name);
  });

  const totalAll = items.length;
  if (role) items = items.filter((i) => i.role === role);
  if (only === "cn") items = items.filter((i) => i.cn_status === "iecic_i_included");
  if (only === "priced") items = items.filter((i) => i.price_lo != null);
  if (only === "banned") items = items.filter((i) => i.eu_status === "banned");

  const page = items.slice(offset, offset + limit).map(({ _rank, ...rest }) => rest);

  return Response.json({
    ok: true,
    query: q,
    total: items.length,
    total_in_db: dbTotal,
    total_all_sources: totalAll,
    offset,
    limit,
    items: page,
    lang,
  });
}
