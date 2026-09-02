// lib/formula_analyzer.js — Reverse-engineer a cosmetic formula from INCI list
// Input: paste INCI list (comma/newline separated)
// Output: structured analysis (formula type, top actives, vehicle, risk, regulatory,
//         price tier, target demographic, suggestions)
// Used by: /formula page, /api/formula/analyze, MCP tool formula_analyze

import { query, queryOne, checkFormulaRisk } from "./db";
import { translateFunctions } from "./cosing_l10n";

// ============================================================================
// FORMULA TYPE PATTERNS — based on order of ingredients + key markers
// ============================================================================
const FORMULA_PATTERNS = [
  {
    type: "防晒霜 / Sunscreen",
    type_zh: "防晒霜",
    type_en: "Sunscreen",
    markers: ["UV", "sunscreen", "SPF", "PA"],
    required: ["OCTINOXATE", "OXYBENZONE", "AVOBENZONE", "HOMOSALATE", "TITANIUM DIOXIDE", "ZINC OXIDE", "OCTOCRYLENE", "MEXORYL"],
    weight: 100,
  },
  {
    type: "洁面 / Cleanser",
    type_zh: "洁面",
    type_en: "Cleanser",
    required: ["SODIUM LAURYL SULFATE", "SODIUM COCOYL", "COCAMIDOPROPYL", "DECYL GLUCOSIDE", "COCO-GLUCOSIDE"],
    surface_active_count: true,
    weight: 80,
  },
  {
    type: "卸妆 / Makeup Remover",
    type_zh: "卸妆",
    type_en: "Makeup Remover",
    required: ["MINERAL OIL", "ISODODECANE", "ISOHEXADECANE", "CYCLOPENTASILOXANE"],
    weight: 75,
  },
  {
    type: "面膜 / Mask",
    type_zh: "面膜",
    type_en: "Mask",
    markers: ["MASK", "CLAY", "KAOLIN", "BENTONITE"],
    required_any: ["KAOLIN", "BENTONITE", "DIATOMACEOUS EARTH", "CHARCOAL"],
    weight: 70,
  },
  {
    type: "化妆水 / Toner",
    type_zh: "化妆水",
    type_en: "Toner",
    water_first: true,
    humectant_count: true,
    no_oil: true,
    weight: 60,
  },
  {
    type: "精华液 / Essence / Serum",
    type_zh: "精华液",
    type_en: "Essence / Serum",
    water_first: true,
    actives_concentrated: true,
    weight: 50,
  },
  {
    type: "乳液 / Lotion",
    type_zh: "乳液",
    type_en: "Lotion",
    water_first: true,
    light_emollient: true,
    weight: 40,
  },
  {
    type: "面霜 / Cream",
    type_zh: "面霜",
    type_en: "Cream",
    water_first: true,
    rich_emollient: true,
    weight: 35,
  },
  {
    type: "眼霜 / Eye Cream",
    type_zh: "眼霜",
    type_en: "Eye Cream",
    water_first: true,
    caffeine_peptides: true,
    weight: 30,
  },
];

// ============================================================================
// ACTIVE CATEGORY MAP — known actives by function group
// (used for Top 3 active detection + price tier estimation)
// ============================================================================
const ACTIVE_CATEGORIES = {
  whitening: {
    name: "美白 / Whitening",
    name_zh: "美白",
    ingredients: ["NIACINAMIDE", "TRANEXAMIC ACID", "ARBUTIN", "ALPHA-ARBUTIN", "ASCORBIC ACID", "TETRAHEXYLDECYL ASCORBATE", "MAGNESIUM ASCORBYL PHOSPHATE", "GLUTATHIONE", "KOJIC ACID", "ELLAGIC ACID", "DIPOTASSIUM GLYCYRRHIZATE", "ETHYL ASCORBIC ACID", "ASCORBYL GLUCOSIDE", "MAP", "SAP"],
    premium_indicator: true,
  },
  anti_aging: {
    name: "抗衰老 / Anti-aging",
    name_zh: "抗衰老",
    ingredients: ["RETINOL", "RETINAL", "RETINOIC ACID", "BAKUCHIOL", "VITAMIN C", "ASCORBIC ACID", "TETRAHEXYLDECYL ASCORBATE", "TOCOPHEROL", "TOCOTRIENOL", "VITAMIN E", "PEPTIDE", "ARGIRELINE", "MATRIXYL", "COPPER PEPTIDE", "COPPER TRIPEPTIDE-1", "PALMITOYL PENTAPEPTIDE", "PALMITOYL TRIPEPTIDE", "NIACINAMIDE", "DMAE", "UBIQUINONE", "COQ10", "RESVERATROL", "FERULIC ACID", "TRETINOIN"],
    premium_indicator: true,
  },
  anti_acne: {
    name: "祛痘 / Anti-acne",
    name_zh: "祛痘",
    ingredients: ["SALICYLIC ACID", "BHA", "BENZOYL PEROXIDE", "AZELAIC ACID", "SULFUR", "ZINC", "ZINC PCA", "TEA TREE", "MELALEUCA ALTERNIFOLIA", "CENTELLA", "MADECASSOSIDE", "NIACINAMIDE", "RETINOL", "ADAPALENE"],
  },
  soothing: {
    name: "舒缓 / Soothing",
    name_zh: "舒缓",
    ingredients: ["CENTELLA ASIATICA", "MADECASSOSIDE", "ASIATICOSIDE", "ALLANTOIN", "PANTHENOL", "B5", "BISABOLOL", "CHAMOMILE", "MATRICARIA", "ALOE", "ALOE BARBADENSIS", "SQUALANE", "CERAMIDE", "OAT", "AVENA SATIVA", "GLYCYRRHIZINATE", "DIPOTASSIUM GLYCYRRHIZATE", "LICORICE", "PORTULACA", "GREEN TEA", "CAMELLIA SINENSIS", "EPIGALLOCATECHIN", "AZULENE"],
  },
  barrier: {
    name: "屏障修复 / Barrier Repair",
    name_zh: "屏障修复",
    ingredients: ["CERAMIDE", "CERAMIDE NP", "CERAMIDE AP", "CERAMIDE EOP", "PHYTOSPHINGOSINE", "CHOLESTEROL", "SQUALANE", "SQUALENE", "PANTHENOL", "MADECASSOSIDE", "CENTELLA", "B5", "NIACINAMIDE", "ECTOIN", "ALLANTOIN"],
    premium_indicator: true,
  },
  hydrating: {
    name: "保湿 / Hydration",
    name_zh: "保湿",
    ingredients: ["HYALURONIC ACID", "SODIUM HYALURONATE", "GLYCERIN", "BUTYLENE GLYCOL", "PROPANEDIOL", "PROPYLENE GLYCOL", "PENTYLENE GLYCOL", "SORBITOL", "PANTHENOL", "B5", "UREA", "PCA", "SODIUM PCA", "LACTIC ACID", "POLYGLUTAMIC ACID", "BETAINE", "GLYCERYL", "ALGAE", "TREHALOSE", "HYDROLYZED COLLAGEN"],
  },
  exfoliating: {
    name: "角质 / Exfoliation",
    name_zh: "角质护理",
    ingredients: ["GLYCOLIC ACID", "LACTIC ACID", "SALICYLIC ACID", "AHA", "BHA", "PHA", "MANDELIC ACID", "MALIC ACID", "TARTARIC ACID", "CITRIC ACID", "LACTIC ACID", "PAPAIN", "BROMELAIN", "UREA", "RETINOL", "RETINAL", "BHA"],
  },
  antioxidant: {
    name: "抗氧化 / Antioxidant",
    name_zh: "抗氧化",
    ingredients: ["VITAMIN C", "ASCORBIC ACID", "VITAMIN E", "TOCOPHEROL", "FERULIC ACID", "RESVERATROL", "UBIQUINONE", "COQ10", "GREEN TEA", "POLYPHENOL", "EGCG", "GLUTATHIONE", "LIPOIC ACID"],
  },
  sun_protection: {
    name: "防晒 / Sun Protection",
    name_zh: "防晒",
    ingredients: ["TITANIUM DIOXIDE", "ZINC OXIDE", "OCTINOXATE", "OXYBENZONE", "AVOBENZONE", "HOMOSALATE", "OCTOCRYLENE", "MEXORYL SX", "MEXORYL XL", "TINOSORB", "ENSULIZOLE", "PADIMATE O", "BENZOPHENONE", "ETHYLHEXYL METHOXYCINNAMATE", "ETHYLHEXYL DIMETHYL PABA"],
  },
  anti_hair_loss: {
    name: "防脱 / Anti Hair Loss",
    name_zh: "防脱",
    ingredients: ["MINOXIDIL", "CAFFEINE", "BIOTIN", "NIACINAMIDE", "ZINC PCA", "CAPSICUM", "PANTHENOL", "ADENOSINE"],
  },
};

// Premium bio-tech actives that push price up
const PREMIUM_BIO_INGREDIENTS = [
  "RECOMBINANT COLLAGEN", "RH-POLYPEPTIDE", "ENGINEERED GROWTH FACTOR",
  "EGF", "BFGF", "POLYPEPTIDE-1", "POLYPEPTIDE-3", "POLYPEPTIDE-157",
  "OLIGOPEPTIDE-1", "ARGIRELINE", "MATRIXYL 3000", "SNAP-8",
  "SYN-AKE", "SYN-COLL", "TRYLAGEN", "PEPTIDE",
];

// ============================================================================
// DEMOGRAPHIC MAPPING — based on actives found
// ============================================================================
const DEMOGRAPHIC_MAP = {
  whitening: { primary: "20-40 女性", concern: "美白淡斑", region: "东亚 (中国/日韩)" },
  anti_aging: { primary: "30+ 女性", concern: "抗老/抗皱", region: "全球" },
  anti_acne: { primary: "15-30 男女", concern: "祛痘/控油", region: "全球" },
  soothing: { primary: "敏感肌 20-45", concern: "舒缓泛红", region: "全球" },
  barrier: { primary: "屏障受损 20-40", concern: "屏障修复", region: "全球" },
  hydrating: { primary: "所有肌肤 15+", concern: "保湿补水", region: "全球" },
  exfoliating: { primary: "25+ 耐受肌", concern: "焕肤/去角质", region: "全球" },
  antioxidant: { primary: "25+ 抗光老", concern: "抗氧化", region: "全球" },
  sun_protection: { primary: "全龄", concern: "防晒", region: "全球" },
  anti_hair_loss: { primary: "25-50 男女", concern: "防脱生发", region: "全球" },
};

// ============================================================================
// PRICE TIER ESTIMATION
// ============================================================================
function estimatePriceTier(analysis) {
  const { actives, types, ingredients_count, has_premium_actives } = analysis;
  let score = 0;

  // Premium actives boost score
  if (has_premium_actives) score += 30;

  // Number of unique active categories
  score += Math.min(actives.categories.length * 5, 25);

  // Sunscreen: usually mid-range unless mineral-only
  if (types.includes("防晒霜 / Sunscreen")) score += 5;

  // Multi-functional = premium
  if (actives.categories.length >= 4) score += 10;

  // Essence/serum = usually higher than lotion
  if (types.includes("精华液 / Essence / Serum")) score += 10;

  // Tier mapping
  if (score >= 50) return { tier: "高端 / Premium", tier_zh: "高端", price_range_cny: "¥400-1500 (30ml)", score };
  if (score >= 30) return { tier: "中端 / Mid-range", tier_zh: "中端", price_range_cny: "¥150-400 (30ml)", score };
  if (score >= 15) return { tier: "大众 / Mass market", tier_zh: "大众", price_range_cny: "¥30-150 (30ml)", score };
  return { tier: "平价 / Drugstore", tier_zh: "平价", price_range_cny: "¥10-80 (30ml)", score };
}

// ============================================================================
// PARSE INCI TEXT
// ============================================================================
export function parseINCIText(text) {
  if (!text || typeof text !== "string") return [];
  // Split on commas, semicolons, newlines; trim; dedupe
  const items = text
    .split(/[,;\n]+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
  // Dedupe while preserving order
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }
  return unique;
}

// ============================================================================
// LOOKUP INGREDIENT — get full info from DB
// ============================================================================
async function lookupIngredient(inciName) {
  const out = {
    inci_name: inciName,
    chinese_name: null,
    function: null,
    cas_no: null,
    ec_no: null,
    inn_name: null,
    restriction: null,
    cn_status: "not_in_iecic",
    eu_status: "allowed",
    sources: [],
  };

  // Lookup in cosing (EU CosIng)
  const cosing = await queryOne(
    `SELECT inci_name, function, cas_no, ec_no, inn_name, restriction
     FROM cosing WHERE UPPER(inci_name) = ? LIMIT 1`,
    [inciName]
  );
  if (cosing) {
    out.function = cosing.function;
    out.cas_no = cosing.cas_no;
    out.ec_no = cosing.ec_no;
    out.inn_name = cosing.inn_name;
    out.restriction = cosing.restriction;
    out.sources.push("EU CosIng");
  }

  // Lookup in cn_iecic_i
  const cn = await queryOne(
    `SELECT chinese_name, note FROM cn_iecic_i WHERE UPPER(inci_name) = ? LIMIT 1`,
    [inciName]
  );
  if (cn) {
    out.chinese_name = cn.chinese_name;
    out.cn_status = "iecic_i_included";
    out.sources.push("CN IECIC I");
  } else {
    // Check IECIC II
    const cn2 = await queryOne(
      `SELECT chinese_name FROM cn_iecic_ii WHERE UPPER(inci_name) = ? LIMIT 1`,
      [inciName]
    );
    if (cn2) {
      out.chinese_name = cn2.chinese_name;
      out.cn_status = "iecic_ii_included";
      out.sources.push("CN IECIC II");
    }
  }

  // Check EU Annex II (prohibited) — only exact match, no LIKE to avoid false positives
  // (e.g. "BIFIDA FERMENT LYSATE" shouldn't match random Annex II substances)
  const banned = await queryOne(
    `SELECT "Reference Number" AS ref FROM annex_ii_prohibited
     WHERE UPPER("Chemical name / INN") = UPPER(?)
        OR UPPER(?) = ANY(string_split(UPPER("Chemical name / INN"), ', '))
     LIMIT 1`,
    [inciName, inciName]
  );
  if (banned) {
    out.eu_status = "banned";
    out.eu_banned_ref = banned.ref;
  }

  // Check EU Annex III (restricted) — same strict matching
  const restricted = await queryOne(
    `SELECT "Reference number" AS ref FROM annex_iii_restricted
     WHERE UPPER("Chemical name / INN") = UPPER(?)
        OR UPPER(?) = ANY(string_split(UPPER("Chemical name / INN"), ', '))
     LIMIT 1`,
    [inciName, inciName]
  );
  if (restricted) {
    out.eu_status = "restricted";
    out.eu_restricted_ref = restricted.ref;
  }

  return out;
}

// ============================================================================
// IDENTIFY FORMULA TYPE
// ============================================================================
function identifyFormulaType(ingredients, ingredientsInfo) {
  const scores = [];

  for (const pattern of FORMULA_PATTERNS) {
    let score = 0;

    // Has required ingredients
    if (pattern.required) {
      const hasReq = pattern.required.some(r => ingredients.includes(r));
      if (!hasReq && pattern.required.length > 0) continue;
      score += pattern.weight;
    }

    // Has any of required_any
    if (pattern.required_any) {
      const hasAny = pattern.required_any.some(r => ingredients.includes(r));
      if (!hasAny) continue;
      score += pattern.weight;
    }

    // Water first
    if (pattern.water_first && ingredients[0] !== "AQUA" && ingredients[0] !== "WATER") {
      continue;
    }

    // No oil (silicone, plant oil)
    if (pattern.no_oil) {
      const hasOil = ingredients.some(i =>
        /SILICONE|DIMETHICONE|CYCLOMETHICONE|MINERAL OIL|ISONONYL|PLANT OIL|SEED OIL/i.test(i)
      );
      if (hasOil) continue;
    }

    // Humectant count
    if (pattern.humectant_count) {
      const humectants = ["GLYCERIN", "BUTYLENE GLYCOL", "PROPANEDIOL", "PROPYLENE GLYCOL", "PENTYLENE GLYCOL"];
      const count = humectants.filter(h => ingredients.includes(h)).length;
      if (count < 1) continue;
      score += count * 5;
    }

    // Surface active count
    if (pattern.surface_active_count) {
      const surfactants = ingredients.filter(i =>
        /SULFATE|SULFONATE|COCAMID|COCO-GLUCOSIDE|DECYL GLUCOSIDE|BETAINE/i.test(i)
      );
      if (surfactants.length === 0) continue;
      score += surfactants.length * 5;
    }

    // Actives concentrated (Top 5 has known actives)
    if (pattern.actives_concentrated) {
      const topFive = ingredients.slice(0, 5);
      const hasActive = topFive.some(i =>
        Object.values(ACTIVE_CATEGORIES).some(cat => cat.ingredients.includes(i))
      );
      if (!hasActive) continue;
      score += 10;
    }

    // Light/rich emollient
    const emollients = ingredients.filter(i =>
      /SQUALANE|SQUALENE|CETEARYL|GLYCERYL STEARATE|STEARIC|PALMITIC|ISOPROPYL|MINERAL OIL|DIMETHICONE/i.test(i)
    );
    if (pattern.light_emollient && emollients.length < 1) continue;
    if (pattern.rich_emollient && emollients.length < 2) continue;
    if (pattern.light_emollient) score += emollients.length * 3;
    if (pattern.rich_emollient) score += emollients.length * 5;

    // Caffeine/peptides (eye cream marker)
    if (pattern.caffeine_peptides) {
      const hasCaffeine = ingredients.includes("CAFFEINE");
      const hasPeptide = ingredients.some(i => /PEPTIDE/i.test(i));
      if (!hasCaffeine && !hasPeptide) continue;
      score += 15;
    }

    scores.push({ type: pattern.type, type_zh: pattern.type_zh, type_en: pattern.type_en, score });
  }

  // Return top 2 types
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, 2).map(s => s.type);
}

// ============================================================================
// IDENTIFY TOP ACTIVES
// ============================================================================
function identifyTopActives(ingredients) {
  const found = []; // { category, name, ingredient, position }
  const seenIngredient = new Set();

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    for (const [catKey, cat] of Object.entries(ACTIVE_CATEGORIES)) {
      if (cat.ingredients.includes(ing) && !seenIngredient.has(ing)) {
        found.push({
          category: catKey,
          category_name: cat.name,
          category_name_zh: cat.name_zh,
          ingredient: ing,
          position: i + 1, // 1-indexed INCI position
        });
        seenIngredient.add(ing);
      }
    }
  }

  // Sort by INCI position (earlier = higher concentration usually)
  found.sort((a, b) => a.position - b.position);

  return found;
}

// ============================================================================
// IDENTIFY KEY VEHICLE
// ============================================================================
function identifyVehicle(ingredients) {
  const vehicle = { primary: null, secondary: [], humectants: [], emollients: [], preservatives: [] };
  if (ingredients[0] === "AQUA" || ingredients[0] === "WATER") {
    vehicle.primary = "水基 / Water-based";
  } else {
    vehicle.primary = "油基或无水 / Oil or anhydrous";
  }

  // Humectants
  const humectants = ["GLYCERIN", "BUTYLENE GLYCOL", "PROPANEDIOL", "PROPYLENE GLYCOL", "PENTYLENE GLYCOL", "SORBITOL", "BETAINE", "SODIUM PCA", "UREA"];
  vehicle.humectants = humectants.filter(h => ingredients.includes(h));

  // Emollients
  const emollientPatterns = [/SQUALANE/, /SQUALENE/, /DIMETHICONE/, /CYCLOMETHICONE/, /CETYL/, /STEARYL/, /CETEARYL/, /GLYCERYL STEARATE/, /STEARIC ACID/, /PALMITIC ACID/, /MINERAL OIL/, /ISOPROPYL/, /COCOA BUTTER/, /SHEA BUTTER/, /MANGO BUTTER/, /SEED OIL$/, /NUT OIL/, /FRUIT OIL/, /VEGETABLE OIL/];
  vehicle.emollients = ingredients.filter(i => emollientPatterns.some(p => p.test(i))).slice(0, 5);

  // Preservatives
  const preservatives = ["PHENOXYETHANOL", "ETHYLHEXYLGLYCERIN", "SODIUM BENZOATE", "POTASSIUM SORBATE", "METHYLISOTHIAZOLINONE", "METHYLCHLOROISOTHIAZOLINONE", "BENZYL ALCOHOL", "CHLORPHENESIN", "DIAZOLIDINYL UREA", "IMIDAZOLIDINYL UREA", "SODIUM DEHYDROACETATE", "TOCOPHEROL", "BHT", "BHA"];
  vehicle.preservatives = preservatives.filter(p => ingredients.includes(p));

  return vehicle;
}

// ============================================================================
// SUGGEST IMPROVEMENTS — based on findings
// ============================================================================
function suggestImprovements(analysis) {
  const { ingredients, ingredientsInfo, risk, type, actives, vehicle } = analysis;
  const suggestions = [];

  // Banned in EU
  const euBanned = ingredientsInfo.filter(i => i.eu_status === "banned");
  if (euBanned.length > 0) {
    suggestions.push({
      type: "critical",
      severity: "block",
      message_zh: `${euBanned.length} 个成分在 EU 禁用 (Annex II): ${euBanned.map(i => i.chinese_name || i.inci_name).join(", ")}。如要卖欧盟, 必须替换。`,
      message_en: `${euBanned.length} ingredient(s) banned in EU (Annex II): ${euBanned.map(i => i.inci_name).join(", ")}. Must replace for EU market.`,
    });
  }

  // No preservative
  if (vehicle.preservatives.length === 0) {
    suggestions.push({
      type: "warning",
      severity: "warn",
      message_zh: "配方中没有发现常见防腐剂, 如不含水可以接受, 含水配方建议补充。",
      message_en: "No common preservatives detected. Acceptable if anhydrous, otherwise add preservative for water-containing formula.",
    });
  }

  // Sunscreen without UV filter
  if (type.includes("防晒霜 / Sunscreen")) {
    const hasUVFilter = ingredientsInfo.some(i => ACTIVE_CATEGORIES.sun_protection.ingredients.includes(i.inci_name));
    if (!hasUVFilter) {
      suggestions.push({
        type: "critical",
        severity: "block",
        message_zh: "标注防晒但未检测到常见 UV 过滤剂, 可能无法提供有效 SPF/PA 防护。",
        message_en: "Marked as sunscreen but no common UV filters detected. May not provide effective SPF/PA protection.",
      });
    }
  }

  // Whitening without niacinamide or vitamin C
  if (actives.categories.includes("whitening")) {
    const hasStrongWhitening = ingredientsInfo.some(i =>
      ["NIACINAMIDE", "TRANEXAMIC ACID", "ARBUTIN", "ALPHA-ARBUTIN", "ASCORBIC ACID"].includes(i.inci_name)
    );
    if (hasStrongWhitening && ingredients.indexOf("NIACINAMIDE") > 7) {
      suggestions.push({
        type: "info",
        severity: "info",
        message_zh: "美白活性物排名靠后 (第 8 位以后), 推测浓度可能 < 1%, 美白效果可能有限。",
        message_en: "Whitening active appears too low in INCI list (after position 8), estimated concentration may be <1%.",
      });
    }
  }

  // No humectant in skin care
  if (!type.includes("防晒") && !type.includes("洁面") && !type.includes("卸妆") && vehicle.humectants.length === 0) {
    suggestions.push({
      type: "info",
      severity: "info",
      message_zh: "配方中未检测到常见保湿剂 (甘油/丁二醇等), 保湿力可能不足。",
      message_en: "No common humectants detected (glycerin/butylene glycol). Hydration may be insufficient.",
    });
  }

  // High actives count = good
  if (actives.categories.length >= 3) {
    suggestions.push({
      type: "good",
      severity: "info",
      message_zh: `配方包含 ${actives.categories.length} 类活性物 (${actives.categories.map(c => ACTIVE_CATEGORIES[c]?.name_zh).filter(Boolean).join("、")}), 多效合一。`,
      message_en: `Formula covers ${actives.categories.length} active categories (${actives.categories.join(", ")}). Multi-functional.`,
    });
  }

  return suggestions;
}

// ============================================================================
// MAIN ANALYZER
// ============================================================================
export async function analyzeFormula(input, options = {}) {
  const { context = {}, lang = "zh" } = options;

  // 1. Parse INCI
  const ingredients = parseINCIText(input);
  if (ingredients.length === 0) {
    return { error: "未检测到成分, 请粘贴 INCI 列表 (逗号或换行分隔)" };
  }

  // 2. Lookup each ingredient (parallel)
  const ingredientsInfo = await Promise.all(ingredients.map(lookupIngredient));

  // 3. Run risk check
  const risk = checkFormulaRisk(ingredients, { ...context, lang });

  // 4. Identify formula type
  const type = identifyFormulaType(ingredients, ingredientsInfo);

  // 5. Identify top actives
  const activesRaw = identifyTopActives(ingredients);
  const actives = {
    total_count: activesRaw.length,
    top3: activesRaw.slice(0, 3),
    categories: [...new Set(activesRaw.map(a => a.category))],
  };

  // 6. Identify vehicle
  const vehicle = identifyVehicle(ingredients);

  // 7. Premium bio actives check
  const has_premium_actives = ingredients.some(i =>
    PREMIUM_BIO_INGREDIENTS.some(p => i.includes(p) || p.includes(i))
  );

  // 8. Estimate price tier
  const analysis = { ingredients, ingredients_count: ingredients.length, types: type, actives, has_premium_actives, vehicle };
  const priceTier = estimatePriceTier(analysis);

  // 9. Target demographic
  const primaryCategory = actives.categories[0] || "hydrating";
  const targetDemo = DEMOGRAPHIC_MAP[primaryCategory] || {
    primary: "全龄",
    concern: ACTIVE_CATEGORIES[primaryCategory]?.name_zh || "日常护肤",
    region: "全球",
  };

  // 10. Generate suggestions
  const suggestions = suggestImprovements({ ingredients, ingredientsInfo, risk, type, actives, vehicle });

  // 11. Build per-ingredient detail (for UI)
  const ingredientDetails = ingredientsInfo.map((info, i) => ({
    position: i + 1,
    inci_name: info.inci_name,
    chinese_name: info.chinese_name,
    function: info.function,
    function_translated: lang === "en" ? info.function : translateFunctions(info.function, lang),
    cas_no: info.cas_no,
    eu_status: info.eu_status,
    cn_status: info.cn_status,
    sources: info.sources,
    is_banned_eu: info.eu_status === "banned",
    is_restricted_eu: info.eu_status === "restricted",
    is_in_iecic: info.cn_status !== "not_in_iecic",
  }));

  // 12. Summary stats
  const stats = {
    total_ingredients: ingredients.length,
    recognized_in_cosng: ingredientsInfo.filter(i => i.function).length,
    recognized_in_iecic: ingredientsInfo.filter(i => i.cn_status !== "not_in_iecic").length,
    eu_banned: ingredientsInfo.filter(i => i.eu_status === "banned").length,
    eu_restricted: ingredientsInfo.filter(i => i.eu_status === "restricted").length,
    risk_blocks: risk.block_count,
    risk_warns: risk.warn_count,
  };

  return {
    input: { ingredient_count: ingredients.length, context },
    stats,
    type,            // ["精华液 / Essence / Serum", "化妆水 / Toner"]
    type_zh: type.map(t => t.split(" / ")[0]).join(" + "),
    type_en: type.map(t => t.split(" / ")[1] || t).join(" + "),
    actives,
    vehicle,
    target_demographic: targetDemo,
    target_demographic_zh: targetDemo.primary,
    price_tier: priceTier,
    price_tier_zh: priceTier.tier_zh,
    risk_summary: {
      summary: risk.summary,
      block_count: risk.block_count,
      warn_count: risk.warn_count,
      top_findings: (risk.findings || []).slice(0, 5).map(f => ({
        severity: f.severity,
        category: f.category,
        rule_id: f.id,
        rationale: typeof f.rationale === "object" ? (lang === "en" ? f.rationale.en : f.rationale.zh) : f.rationale,
        matched: f.matched,
      })),
    },
    ingredients: ingredientDetails,
    suggestions,
    lang,
    timestamp: new Date().toISOString(),
  };
}
