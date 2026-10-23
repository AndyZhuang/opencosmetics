// lib/rule_aliases.js — 规则简写成分名 → 真实 INCI 的映射
//
// 背景: rules.json 里的兼容性/浓度规则用的是"简写" (VITAMIN_C, AHA, BHA,
// VITAMIN_A_PALMITATE...), 而配方里写的是真实 INCI (ASCORBIC ACID,
// SALICYLIC ACID, RETINYL PALMITATE...)。两者不映射, 这些规则永远不命中。
//
// 同时修正两类数据缺陷:
//  1) 成分名里的下划线要还原成空格 (GLYCOLIC_ACID → GLYCOLIC ACID)
//  2) 含错拼的成分名 (IODOPROPYNYL → IODOPROPYLENYL, HYDROQUINONE_p_ → HYDROQUINONE)

// 简写 → 真实 INCI 候选列表
export const RULE_INGREDIENT_ALIASES = {
  VITAMIN_C: [
    "ASCORBIC ACID",
    "3-O-ETHYL ASCORBIC ACID",
    "ETHYL ASCORBIC ACID",
    "TETRAHEXYLDECYL ASCORBATE",
    "ASCORBYL GLUCOSIDE",
    "MAGNESIUM ASCORBYL PHOSPHATE",
    "ASCORBIC ACID PALMITATE",
    "ASCORBYL PALMITATE",
  ],
  VITAMIN_C_AM: ["MAGNESIUM ASCORBYL PHOSPHATE", "ASCORBYL PALMITATE", "TETRAHEXYLDECYL ASCORBATE"],
  AHA: [
    "GLYCOLIC ACID",
    "LACTIC ACID",
    "MANDELIC ACID",
    "MALIC ACID",
    "TARTARIC ACID",
    "CITRIC ACID",
    "GLUCONOLACTONE",
    "BETA-HYDROXYBUTYRIC ACID",
  ],
  BHA: ["SALICYLIC ACID", "CAPRYLOYL SALICYLIC ACID", "BETA-HYDROXY SALICYLIC ACID", "SUCCINIC ACID"],
  BHA_SALICYLIC_ACID: ["SALICYLIC ACID", "CAPRYLOYL SALICYLIC ACID"],
  PHAS: ["GLUCONOLACTONE", "GLUCURONIC ACID", "CAPRYLOYL GLUCONIC ACID"],
  BENZOYL_PEROXIDE: ["BENZOYL PEROXIDE"],
  VITAMIN_A_PALMITATE: ["RETINYL PALMITATE", "RETINYL ACETATE"],
  VITAMIN_A: ["RETINOL", "RETINYL PALMITATE", "RETINYL ACETATE", "RETINAL", "RETINOIC ACID"],
  COPPER_PEPTIDES: ["COPPER TRIPEPTIDE-1", "COPPER TRIPEPTIDE-2", "COPPER PCA", "COPPER GLYCINE", "COPPER HYDROXYPHOSPHATE"],
  HYDROQUINONE_p_: ["HYDROQUINONE"],
  IODOPROPYNYL_BUTYLCARBAMATE: ["IODOPROPYLENYL BUTYLCARBAMATE"],
  METHYLCHLOROISOTHIAZOLINONE_METHYLISOTHIAZOLINONE: ["METHYLCHLOROISOTHIAZOLINONE", "METHYLISOTHIAZOLINONE"],
  RETINOL: ["RETINOL"],
  RETINOIDS: ["RETINOL", "RETINAL", "RETINOIC ACID", "TRETINOIN", "ADAPALENE", "RETINYL PALMITATE"],
  TITANIUM_DIOXIDE: ["TITANIUM DIOXIDE"],
  SALICYLIC_ACID: ["SALICYLIC ACID", "CAPRYLOYL SALICYLIC ACID"],
  GLYCOLIC_ACID: ["GLYCOLIC ACID"],
  TALC_BASED_POWDER: ["TALC"],
  CLEANSER_AND_SOAP: [],
  RECOMBINANT_HUMAN_COLLAGEN_III: ["RECOMBINANT COLLAGEN"],
  RECOMBINANT_COLLAGEN: ["RECOMBINANT COLLAGEN", "RECOMBINANT COLLAGEN POLYPEPTIDE"],
  COLLAGEN: ["HYDROLYZED COLLAGEN", "COLLAGEN", "RECOMBINANT COLLAGEN", "COLLAGEN HYDROLYZATE"],
};

const STOP_TOKENS = new Set([
  "AND", "THE", "BASED", "WITH", "OF", "FOR", "POWDER", "SOAP", "CLASS", "TYPE",
  "PRODUCTS", "PRODUCT", "OIL", "WAX", "WATER", "SALT", "RESIN", "PIGMENT",
  "SOLUTION", "EXTRACT", "LIQUID", "CREAM", "GEL", "FOAM",
]);

const norm = (s) => String(s || "").toUpperCase().replace(/\s+/g, " ").trim();

/** 展开一个规则成分名 → 候选真实 INCI 列表 */
export function expandRuleIngredient(raw) {
  const key = norm(raw);
  if (!key) return [];
  if (RULE_INGREDIENT_ALIASES[key]) return [...RULE_INGREDIENT_ALIASES[key]];
  // 下划线还原成空格
  const spaced = key.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const out = new Set([spaced]);
  // 去掉尾部修饰 (HYDROQUINONE P -> HYDROQUINONE)
  const trimmed = spaced.replace(/\s+[A-Z]$/, "").trim();
  if (trimmed) out.add(trimmed);
  return [...out];
}

function tokens(raw) {
  return expandRuleIngredient(raw)
    .flatMap((c) => c.split(/\s+/))
    .filter((t) => t && t.length > 2 && !STOP_TOKENS.has(t));
}

/**
 * 把规则里的成分名匹配到配方中真实存在的成分
 * @returns {string|null} 命中的真实 INCI
 */
export function matchRuleIngredient(raw, ingSet) {
  // 1) 精确/别名命中
  for (const cand of expandRuleIngredient(raw)) {
    if (ingSet.has(cand)) return cand;
  }
  // 2) token 命中 (所有 token 落在同一个成分里)
  const toks = tokens(raw);
  if (!toks.length) return null;
  for (const ing of ingSet) {
    if (toks.every((t) => ing.includes(t))) return ing;
  }
  // 3) 首个 token 命中
  const first = toks[0];
  if (first && first.length >= 4) {
    for (const ing of ingSet) {
      if (ing.includes(first)) return ing;
    }
  }
  return null;
}

/**
 * 兼容性规则: 规则的每个成分名都要在配方里找到对应, 命中 >= 2 个才成立
 * @returns {{rule_ingredient:string, matched:string}[]}
 */
export function matchRulePair(ruleIngredients = [], ingSet) {
  const hits = [];
  const used = new Set();
  for (const ri of ruleIngredients) {
    const hit = matchRuleIngredient(ri, ingSet);
    if (!hit || used.has(hit)) continue;
    used.add(hit);
    hits.push({ rule_ingredient: ri, matched: hit });
  }
  return hits;
}
