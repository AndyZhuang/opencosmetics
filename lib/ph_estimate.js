// lib/ph_estimate.js — 配方 pH 与产品类型推断
// 用途: 让 pH 安全规则 (PH-001..008) 能真正被触发
// 说明: pH 只能"估算" —— 酸碱同时存在时体系是缓冲的, 真实 pH 取决于配比,
//       必须实测。本模块在拿不准时明确返回 low confidence, 而不是编一个数。

// 酸的典型 pH (单独配伍时的近似值)
const ACID_PH = {
  "GLYCOLIC ACID": 3.5,
  "MANDELIC ACID": 3.6,
  "LACTIC ACID": 3.6,
  "MALIC ACID": 3.5,
  "TARTARIC ACID": 3.0,
  "CITRIC ACID": 3.0,
  "SALICYLIC ACID": 3.0,
  "ASCORBIC ACID": 3.2,
  "3-O-ETHYL ASCORBIC ACID": 4.0,
  "KOJIC ACID": 4.2,
  "AZELAIC ACID": 4.6,
  "TRANEXAMIC ACID": 4.6,
  "FERULIC ACID": 4.2,
  "GLUTATHIONE": 4.5,
  "PYRROLIDINE CARBOXYLIC ACID": 4.5,
  "GLYCERPHOSPHORIC ACID": 4.5,
  "ALPHA-HYDROXY ACIDS": 3.5,
  "AHAs": 3.5,
  "BHA": 3.2,
  "PHA": 5.0,
};

// 碱的典型 pH
const BASE_PH = {
  "TRIETHANOLAMINE": 7.2,
  "TRIETHYLAMINE": 8.5,
  "AMMONIUM HYDROXIDE": 8.2,
  "SODIUM HYDROXIDE": 9.5,
  "POTASSIUM HYDROXIDE": 9.5,
  "SODIUM BICARBONATE": 7.9,
  "POTASSIUM BICARBONATE": 7.9,
  "SODIUM BORATE": 8.4,
  "BISODIUM EDTA": 6.0,
  "DISODIUM EDTA": 6.0,
  "EDTA DISODIUM": 6.0,
  "SODIUM LACTATE": 7.4,
};

// 清洁类表活 —— 出现则大概率是淋洗类产品
const CLEANSING_SURFACTANTS = [
  "SODIUM LAURYL SULFATE", "AMMONIUM LAURYL SULFATE", "TEA-LAURYL SULFATE",
  "COCAMIDOPROPYL BETAINE", "SODIUM COCOYL GLUTAMATE", "DECYL GLUCOSIDE",
  "COCO-GLUCOSIDE", "COCAMIDOPROPYL DIMETHYLAMINE", "SODIUM METHYL COCOYL TAURATE",
  "ISODECANOL", "ISOHEXADECANE", "ISODODECANE", "MINERAL OIL",
];

const norm = (s) => String(s || "").toUpperCase().replace(/\s+/g, " ").trim();

/**
 * 估算配方 pH
 * @returns {{ph:number|null, confidence:"high"|"medium"|"low", basis:string[], note_zh:string}}
 */
export function estimatePh(ingredients = []) {
  const set = new Set(ingredients.map(norm));
  const acids = [];
  const bases = [];

  for (const ing of set) {
    if (ACID_PH[ing] != null) acids.push({ inci: ing, ph: ACID_PH[ing] });
    if (BASE_PH[ing] != null) bases.push({ inci: ing, ph: BASE_PH[ing] });
  }

  // 关键词兜底 (未收录的酸/碱)
  for (const ing of set) {
    if (acids.length || bases.length) break;
    if (/\bACID$/.test(ing) && !acids.length) acids.push({ inci: ing, ph: 4.0 });
    else if (/(HYDROXIDE|TRIETHANOLAMINE|AMMONIUM)$/.test(ing) && !bases.length) bases.push({ inci: ing, ph: 8.0 });
  }

  if (!acids.length && !bases.length) {
    return {
      ph: 5.5,
      confidence: "low",
      basis: ["未检出酸碱组分, 按常见护肤品默认值估算"],
      note_zh: "配方中没有明显的酸/碱调节组分, pH 5.5 为默认值, 实测为准。",
    };
  }

  if (acids.length && bases.length) {
    return {
      ph: null,
      confidence: "low",
      basis: [
        `酸性: ${acids.map((a) => a.inci).join(", ")}`,
        `碱性: ${bases.map((b) => b.inci).join(", ")}`,
      ],
      note_zh: "酸碱组分同时存在, 体系为缓冲体系, pH 取决于配比, 必须实测后才能判定 pH 规则。",
    };
  }

  if (acids.length) {
    const min = Math.min(...acids.map((a) => a.ph));
    const max = Math.max(...acids.map((a) => a.ph));
    const ph = Math.round((min + max) / 2 * 10) / 10;
    return {
      ph,
      confidence: acids.length === 1 ? "medium" : "low",
      basis: acids.map((a) => `${a.inci} (≈pH ${a.ph})`),
      note_zh:
        acids.length === 1
          ? `含 ${acids[0].inci}, 体系偏酸, 估算 pH ≈ ${ph}。实际值受中和剂与浓度影响, 实测为准。`
          : `含 ${acids.length} 种酸性组分, 估算 pH ≈ ${ph} (区间 ${min}–${max})。多酸体系必须实测。`,
    };
  }

  const min = Math.min(...bases.map((b) => b.ph));
  const max = Math.max(...bases.map((b) => b.ph));
  const ph = Math.round((min + max) / 2 * 10) / 10;
  return {
    ph,
    confidence: "low",
    basis: bases.map((b) => `${b.inci} (≈pH ${b.ph})`),
    note_zh: `含碱性组分 ${bases.map((b) => b.inci).join(", ")}, 估算 pH ≈ ${ph}。浓度未知, 必须实测。`,
  };
}

/**
 * 推断产品类型 (驻留 / 淋洗)
 */
export function inferProductContext(ingredients = []) {
  const set = new Set(ingredients.map(norm));
  const cleansing = CLEANSING_SURFACTANTS.filter((s) => set.has(s));
  if (cleansing.length) {
    return { kind: "rinse_off", label: "淋洗类", basis: cleansing, label_zh: "淋洗类 (清洁产品)" };
  }
  return { kind: "leave_on", label: "驻留类", basis: [], label_zh: "驻留类 (涂抹后停留)" };
}

/**
 * pH 规则的 context 匹配
 * context 形如: "驻留类成人" / "淋洗类成人" / "儿童驻留类 (0-12)" / "儿童淋洗类 (0-12)"
 */
export function phContextApplies(ruleContext = "", { productKind = "leave_on", population = "adult" } = {}) {
  const ctx = String(ruleContext);
  // 尿布区等特殊部位无法从配方推断, 不下发
  if (/尿布|鼻腔|口腔|私密/.test(ctx)) return false;
  if (ctx.includes("儿童")) {
    if (!["child", "children", "儿童", "kids"].includes(population)) return false;
  } else if (ctx.includes("成人")) {
    if (["child", "children", "儿童", "kids"].includes(population)) return false;
  }
  if (ctx.includes("淋洗类")) return productKind === "rinse_off";
  if (ctx.includes("驻留类")) return productKind === "leave_on";
  return true;
}
