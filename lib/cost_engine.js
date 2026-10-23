// lib/cost_engine.js — 配方成本估算引擎
// 输入: 配方行 [{ inci_name, pct }] + 批量/成本参数
// 输出: 单公斤成本、批次成本、每支成本、建议零售价、成本结构与敏感度
// 价格基准: data/ingredient_profiles.json (估算参考价, 须按供应商报价校准)

import { getProfile, enrichIngredient, normalizeKey } from "./ingredient_profiles.js";

// ============================================================================
// 角色缺省价格 (CNY/kg) — 当成分不在价格库中时按角色取保守估值
// ============================================================================
const ROLE_FALLBACK_PRICE = {
  solvent: 15,
  humectant: 40,
  emollient: 60,
  emulsifier: 45,
  surfactant: 40,
  thickener: 70,
  preservative: 60,
  antioxidant: 90,
  uv_filter: 300,
  active: 300,
  extract: 150,
  film_former: 80,
  ph_adjuster: 20,
  chelator: 50,
  colorant: 250,
  optical: 120,
  fragrance: 300,
  conditioner: 130,
  other: 60,
};

// 行业默认成本模型
export const DEFAULT_COST_MODEL = {
  batch_kg: 100,            // 批量 (kg)
  loss_rate: 0.03,          // 投料损耗 3%
  processing_per_kg: 3.5,   // 加工/搅拌/灌装 (CNY/kg)
  packaging_per_unit: 2.2,  // 包材 (CNY/支)
  net_content_g: 30,        // 净含量 (g)
  gross_margin: 0.55,       // 品牌毛利率 (成本占零售价 45%)
  distributor_markup: 0.35, // 渠道加价
  oem_markup: 0.8,          // 代工/出厂毛利
  target_retail_multiple: 0, // >0 时覆盖毛利+渠道算法
};

const round = (n, d = 2) => {
  if (!Number.isFinite(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// ============================================================================
// 价格解析: 返回 { price, source, low, high }
// source: "profile" 精确命中 | "role_estimate" 角色估值 | "default" 兜底
// ============================================================================
export function resolvePrice(inciName) {
  const p = getProfile(inciName);
  if (p && Number.isFinite(p.price_lo) && Number.isFinite(p.price_hi)) {
    const low = p.price_lo;
    const high = p.price_hi;
    return { price: (low + high) / 2, low, high, source: "profile", role: p.role };
  }
  const meta = enrichIngredient(inciName);
  const fb = ROLE_FALLBACK_PRICE[meta.role] ?? ROLE_FALLBACK_PRICE.other;
  return {
    price: fb,
    low: fb * 0.6,
    high: fb * 1.6,
    source: "role_estimate",
    role: meta.role,
  };
}

// ============================================================================
// 主计算
// ============================================================================
export function calculateCost(lines = [], model = {}) {
  const m = { ...DEFAULT_COST_MODEL, ...model };
  const norm = [];

  for (const raw of lines) {
    if (!raw || !raw.inci_name) continue;
    const pct = Number(raw.pct);
    if (!Number.isFinite(pct) || pct <= 0) continue;
    const info = enrichIngredient(raw.inci_name);
    const pr = resolvePrice(raw.inci_name);
    const costPerKg = (pct / 100) * pr.price;
    norm.push({
      inci_name: info.inci_name,
      chinese_name: info.chinese_name,
      role: info.role,
      pct: round(pct, 4),
      phase: raw.phase || null,
      price_cny_per_kg: round(pr.price),
      price_low: round(pr.low),
      price_high: round(pr.high),
      price_source: pr.source,
      cost_per_kg: round(costPerKg, 4),
      cost_share: 0, // filled below
      pct_of_budget: 0, // filled below
    });
  }

  const totalPct = norm.reduce((s, l) => s + l.pct, 0);
  const rawPerKg = norm.reduce((s, l) => s + l.cost_per_kg, 0);

  // 成本占比
  for (const l of norm) {
    l.cost_share = rawPerKg > 0 ? round((l.cost_per_kg / rawPerKg) * 100, 2) : 0;
  }

  // 实际投料总量校验
  const totalCostPerKg = rawPerKg + (m.processing_per_kg || 0);
  const batchRaw = totalCostPerKg * (m.batch_kg || 0) * (1 + (m.loss_rate || 0));
  const unitsPerBatch = (m.batch_kg * 1000 * (1 - (m.loss_rate || 0))) / (m.net_content_g || 30);
  const costPerUnitRaw = unitsPerBatch > 0 ? batchRaw / unitsPerBatch : null;
  // 每支成本 = 原料+加工 + 包材
  const costPerUnit = costPerUnitRaw == null ? null : costPerUnitRaw + (m.packaging_per_unit || 0);

  // 定价三档
  const unitCost = costPerUnit ?? 0;
  // 出厂价 (代工/品牌方给工厂的报价): 成本 x (1 + 代工毛利)
  const exFactory = unitCost * (1 + (m.oem_markup ?? 0.8));
  // 建议零售价: 成本 / (1 - 品牌毛利率) x (1 + 渠道加价)
  const retailFromMargin = (unitCost / (1 - m.gross_margin)) * (1 + m.distributor_markup);
  const retailFromMultiple = m.target_retail_multiple > 0 ? unitCost * m.target_retail_multiple : null;
  const suggestedRetail = retailFromMultiple || retailFromMargin;

  // 敏感度: 该成分每涨价 10%, 总成本变动多少
  for (const l of norm) {
    const bump = l.cost_per_kg * 0.1;
    l.cost_impact_10pct = round(bump, 4);
    l.impact_pct_of_total = totalCostPerKg > 0 ? round((bump / totalCostPerKg) * 100, 2) : 0;
  }

  const topDrivers = [...norm].sort((a, b) => b.cost_per_kg - a.cost_per_kg).slice(0, 5);
  const unknownCount = norm.filter((l) => l.price_source !== "profile").length;
  const pricedCount = norm.length - unknownCount;

  return {
    lines: norm,
    totals: {
      raw_material_per_kg: round(rawPerKg, 4),
      processing_per_kg: round(m.processing_per_kg, 4),
      total_per_kg: round(totalCostPerKg, 4),
      batch_kg: m.batch_kg,
      batch_cost: round(batchRaw, 2),
      units_per_batch: round(unitsPerBatch, 1),
      net_content_g: m.net_content_g,
      cost_per_unit_raw: round(costPerUnitRaw, 3),
      packaging_per_unit: round(m.packaging_per_unit, 3),
      cost_per_unit: round(costPerUnit, 3),
    },
    retail: {
      gross_margin: m.gross_margin,
      distributor_markup: m.distributor_markup,
      oem_markup: m.oem_markup ?? 0.8,
      ex_factory_price: round(exFactory, 2),
      suggested_price: round(suggestedRetail, 2),
      suggested_price_method: retailFromMultiple ? "target_multiple" : "margin_model",
      price_range_low: round(suggestedRetail * 0.85, 2),
      price_range_high: round(suggestedRetail * 1.2, 2),
      note_zh: "出厂价 = 单支成本 x (1+代工毛利); 建议零售价 = 单支成本 / (1-品牌毛利率) x (1+渠道加价)。原料成本通常只占零售价的个位数百分比, 定价主要由品牌与渠道决定。",
      note_en: "Ex-factory = unit cost x (1+OEM margin); suggested retail = unit cost / (1-brand margin) x (1+channel markup). Raw material cost is typically a single-digit percentage of retail price.",
    },
    quality: {
      priced_count: pricedCount,
      unknown_count: unknownCount,
      coverage_pct: norm.length ? round((pricedCount / norm.length) * 100, 1) : 0,
      total_pct_declared: round(totalPct, 3),
      balanced: Math.abs(totalPct - 100) < 5,
      note_zh: unknownCount
        ? `${unknownCount} 个成分未在价格库中, 已按角色估值, 建议用供应商报价替换。`
        : "全部成分命中价格库。",
      note_en: unknownCount
        ? `${unknownCount} ingredient(s) not in price book, estimated by role. Replace with supplier quotes.`
        : "All ingredients priced from the price book.",
    },
    top_drivers: topDrivers.map((l) => ({
      inci_name: l.inci_name,
      chinese_name: l.chinese_name,
      pct: l.pct,
      price_cny_per_kg: l.price_cny_per_kg,
      cost_per_kg: l.cost_per_kg,
      cost_share: l.cost_share,
    })),
    model: m,
  };
}

// ============================================================================
// 缺量补全: 给定成分列表, 依角色典型用量生成一版起始配方 (骨架)
// 规则: 水/主溶剂吃掉剩余量, 其余成分按典型用量上限分配; 超额则等比压缩
// ============================================================================
const ROLE_TARGET_PCT = {
  active: 1,
  uv_filter: 3,
  preservative: 0.8,
  emulsifier: 2,
  surfactant: 2,
  thickener: 0.5,
  colorant: 1,
  fragrance: 0.5,
  humectant: 3,
  emollient: 3,
  antioxidant: 0.2,
  chelator: 0.1,
  ph_adjuster: 0.3,
  extract: 1,
  film_former: 1,
  optical: 2,
  conditioner: 0.5,
  solvent: 2,
  other: 0.5,
};

export function scaffoldFormula(ingredients = []) {
  const rows = [];
  const seen = new Set();

  for (const name of ingredients) {
    const key = normalizeKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const info = enrichIngredient(name);
    // 水/主溶剂单独处理
    if (["AQUA", "WATER"].includes(key)) {
      rows.push({ inci_name: info.inci_name, chinese_name: info.chinese_name, role: info.role, pct: 0, is_solvent_base: true });
      continue;
    }
    const target = Math.min(info.use_max ?? ROLE_TARGET_PCT[info.role] ?? 0.5, ROLE_TARGET_PCT[info.role] ?? 0.5);
    const pct = Math.max(0.05, Math.min(target, 15));
    rows.push({ inci_name: info.inci_name, chinese_name: info.chinese_name, role: info.role, pct: round(pct, 3) });
  }

  // 非水成分合计
  let others = rows.filter((r) => !r.is_solvent_base).reduce((s, r) => s + r.pct, 0);
  const WATER_MAX = 80;

  if (others > WATER_MAX) {
    const k = WATER_MAX / others;
    for (const r of rows) if (!r.is_solvent_base) r.pct = round(r.pct * k, 3);
    others = WATER_MAX;
  }

  const waterRemainder = Math.max(0, 100 - others);
  const base = rows.find((r) => r.is_solvent_base);
  if (base) {
    base.pct = round(waterRemainder, 3);
  } else {
    // 没有水, 补一个水相基底
    rows.unshift({ inci_name: "AQUA", chinese_name: "水", role: "solvent", pct: round(waterRemainder, 3), is_solvent_base: true });
  }

  // 按用量降序排列 (INCI 降序惯例: 含量从高到低)
  rows.sort((a, b) => (b.pct || 0) - (a.pct || 0));
  return rows;
}

// ============================================================================
// 配方对比: 成本 + 成分差异
// ============================================================================
export function compareFormulas(a = { lines: [] }, b = { lines: [] }) {
  const mapA = new Map((a.lines || []).map((l) => [normalizeKey(l.inci_name), l]));
  const mapB = new Map((b.lines || []).map((l) => [normalizeKey(l.inci_name), l]));
  const keys = [...new Set([...mapA.keys(), ...mapB.keys()])];

  const diffs = [];
  for (const k of keys) {
    const la = mapA.get(k);
    const lb = mapB.get(k);
    const pa = la?.pct ?? 0;
    const pb = lb?.pct ?? 0;
    if (Math.abs(pa - pb) < 0.001 && la && lb) continue;
    diffs.push({
      inci_name: (la || lb).inci_name,
      chinese_name: (la || lb).chinese_name ?? null,
      a_pct: round(pa, 3),
      b_pct: round(pb, 3),
      delta_pct: round(pb - pa, 3),
      status: !la ? "added" : !lb ? "removed" : "changed",
    });
  }
  diffs.sort((x, y) => Math.abs(y.delta_pct) - Math.abs(x.delta_pct));

  const costA = calculateCost(a.lines || [], a.model);
  const costB = calculateCost(b.lines || [], b.model);
  const delta = (costB.totals.total_per_kg ?? 0) - (costA.totals.total_per_kg ?? 0);

  return {
    diffs,
    added: diffs.filter((d) => d.status === "added").length,
    removed: diffs.filter((d) => d.status === "removed").length,
    changed: diffs.filter((d) => d.status === "changed").length,
    cost: {
      a: costA.totals,
      b: costB.totals,
      delta_per_kg: round(delta, 4),
      delta_pct: costA.totals.total_per_kg
        ? round((delta / costA.totals.total_per_kg) * 100, 2)
        : 0,
    },
  };
}
