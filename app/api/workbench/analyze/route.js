// /api/workbench/analyze — 配方工作台全量分析 (一次调用给全所有结论)
// POST { ingredients: "text" | ["AQUA", ...], lines?: [{inci_name,pct,phase}],
//        context: { population, region }, model?: { batch_kg, net_content_g, ... } }
// 返回: 配方结构 / 角色画像 / 成本 / 法规 / 风险 / 建议

import { analyzeFormula, parseINCIText } from "../../../../lib/formula_analyzer";
import { calculateCost, scaffoldFormula } from "../../../../lib/cost_engine";
import { enrichIngredient, getProfile } from "../../../../lib/ingredient_profiles";
import { getLangFromCookies } from "../../../../lib/i18n";
import { cookies } from "next/headers";

// 相位推断: 基于角色 + 亲水性
const PHASE_RULES = [
  { phase: "A相 (水相)", roles: ["solvent", "humectant", "active", "extract", "ph_adjuster", "chelator", "preservative", "antioxidant"] },
  { phase: "B相 (油相)", roles: ["emollient", "uv_filter", "colorant", "optical", "film_former"] },
  { phase: "C相 (乳化/分散)", roles: ["emulsifier", "surfactant", "thickener", "conditioner", "fragrance"] },
];

function suggestPhase(role) {
  for (const r of PHASE_RULES) if (r.roles.includes(role)) return r.phase;
  return "A相 (水相)";
}

export async function POST(request) {
  let body;
  let lang = await getLangFromCookies(cookies());
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "无效的 JSON 请求体 / Invalid JSON body" }, { status: 400 });
  }
  if (body.lang && ["zh", "en"].includes(body.lang)) lang = body.lang;

  const { context = {}, model = {} } = body;

  // ---- 归一化输入 ----
  let lines = [];
  if (Array.isArray(body.lines) && body.lines.length) {
    lines = body.lines
      .filter((l) => l && l.inci_name)
      .map((l) => ({ inci_name: String(l.inci_name).toUpperCase().trim(), pct: Number(l.pct) || 0, phase: l.phase || null }));
  } else if (Array.isArray(body.ingredients)) {
    lines = body.ingredients.map((n) => ({ inci_name: String(n).toUpperCase().trim(), pct: 0, phase: null }));
  } else if (typeof body.ingredients === "string" && body.ingredients.trim()) {
    lines = parseINCIText(body.ingredients).map((n) => ({ inci_name: n, pct: 0, phase: null }));
  }

  if (!lines.length) {
    return Response.json({
      error: "需要 ingredients (字符串或数组) 或 lines 数组",
      usage_zh: 'POST { "ingredients": "AQUA, GLYCERIN, NIACINAMIDE" } 或 { "lines": [{ "inci_name": "AQUA", "pct": 70 }] }',
    }, { status: 400 });
  }

  const names = lines.map((l) => l.inci_name);

  try {
    // ---- 1. 原有深度分析 (类型/活性/基质/风险) ----
    const base = await analyzeFormula(names.join(", "), { context, lang });

    // ---- 2. 角色画像 + 相位 ----
    const enriched = lines.map((l, i) => {
      const e = enrichIngredient(l.inci_name);
      const detail = (base.ingredients || []).find((x) => x.inci_name === l.inci_name) || {};
      const hasPct = l.pct > 0;
      return {
        index: i + 1,
        inci_name: e.inci_name,
        chinese_name: e.chinese_name,
        role: e.role,
        role_is_estimated: e.role_is_estimated,
        pct: hasPct ? l.pct : null,
        use_min: e.use_min,
        use_max: e.use_max,
        phase: l.phase || suggestPhase(e.role),
        phase_is_estimated: !l.phase,
        price_lo: e.price_lo,
        price_hi: e.price_hi,
        eu_status: detail.eu_status || "allowed",
        cn_status: detail.cn_status || "not_in_iecic",
        function: detail.function || null,
        function_translated: detail.function_translated || null,
        is_banned_eu: detail.is_banned_eu || false,
        is_restricted_eu: detail.is_restricted_eu || false,
        is_in_iecic: detail.is_in_iecic || false,
        tags: e.tags,
      };
    });

    // ---- 3. 成本 ----
    // 若用户未提供用量, 用各成分的典型用量骨架估算成本 (标注为估算)
    const noPctCount = lines.filter((l) => !l.pct).length;
    const scaffold = noPctCount > 0 ? scaffoldFormula(names) : null;
    const costLines = noPctCount === lines.length && scaffold
      ? scaffold.map((s) => ({ inci_name: s.inci_name, pct: s.pct }))
      : lines.map((l) => ({ ...l, inci_name: l.inci_name }));
    const cost = calculateCost(costLines, model);
    cost.estimated_from_typical_levels = noPctCount === lines.length;
    if (cost.estimated_from_typical_levels) {
      cost.quality.note_zh = "未提供用量, 成本按各成分典型使用浓度估算, 仅供量级参考。";
      cost.quality.note_en = "No use levels given; cost estimated from typical use levels, magnitude reference only.";
    }

    // ---- 5. 结构摘要 ----
    const roleBreakdown = {};
    for (const e of enriched) roleBreakdown[e.role] = (roleBreakdown[e.role] || 0) + 1;
    const phaseBreakdown = {};
    for (const e of enriched) phaseBreakdown[e.phase] = (phaseBreakdown[e.phase] || 0) + 1;

    // ---- 6. 法规汇总 ----
    const banned = enriched.filter((e) => e.eu_status === "banned");
    const restricted = enriched.filter((e) => e.eu_status === "restricted");
    const notInIecic = enriched.filter((e) => !e.is_in_iecic);

    return Response.json({
      ok: true,
      lang,
      input: { ingredient_count: lines.length, context, has_pct: lines.some((l) => l.pct > 0) },
      formula: {
        type: base.type,
        type_zh: base.type_zh,
        type_en: base.type_en,
        actives: base.actives,
        vehicle: base.vehicle,
        target_demographic: base.target_demographic,
        price_tier: base.price_tier,
        suggestions: base.suggestions,
        stats: base.stats,
      },
      lines: enriched,
      structure: {
        role_breakdown: roleBreakdown,
        phase_breakdown: phaseBreakdown,
        total_pct_declared: cost.quality.total_pct_declared,
        scaffold,
      },
      cost,
      regulatory: {
        eu_banned: banned.map((e) => ({ inci_name: e.inci_name, chinese_name: e.chinese_name })),
        eu_restricted: restricted.map((e) => ({ inci_name: e.inci_name, chinese_name: e.chinese_name })),
        cn_not_in_iecic: notInIecic.map((e) => ({ inci_name: e.inci_name, chinese_name: e.chinese_name })),
        cn_not_in_iecic_count: notInIecic.length,
      },
      risk: base.risk_summary,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[workbench/analyze] error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || (await getLangFromCookies(cookies()));
  return Response.json({
    name: "workbench_analyze",
    name_zh: "配方工作台全量分析",
    version: "1.0.0",
    method: "POST",
    description:
      lang === "en"
        ? "One-shot formula analysis: structure, role profile, phase suggestion, cost, regulatory, risk."
        : "一次调用完成配方全量分析: 结构、角色画像、相位建议、成本、法规、风险。",
    input: {
      ingredients: "string (INCI text) | string[] (INCI names)",
      lines: "[{ inci_name, pct, phase }] — 可选, 带用量时计算完整成本",
      context: "{ population, region }",
      model: "{ batch_kg, net_content_g, gross_margin, packaging_per_unit, ... }",
    },
    output: {
      lines: "[{ inci_name, role, pct, phase, use_min, use_max, eu_status, cn_status }]",
      structure: "{ role_breakdown, phase_breakdown, scaffold }",
      cost: "{ lines, totals, retail, quality, top_drivers }",
      regulatory: "{ eu_banned, eu_restricted, cn_not_in_iecic }",
      formula: "{ type, actives, vehicle, price_tier, suggestions }",
      risk: "{ summary, block_count, warn_count, top_findings }",
    },
    lang,
  });
}
