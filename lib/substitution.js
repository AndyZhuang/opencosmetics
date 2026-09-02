// lib/substitution.js — 成分替代引擎
// 给定一个 INCI, 推荐 3-5 个同功能替代 + 浓度/法规/价格信息

import { query } from "./db";
import { translateFunctions } from "./cosing_l10n";

// ============================================================================
// 替代组: 同功能成分 (基于 ACTIVE_CATEGORIES 倒排)
// ============================================================================
// 这是 substitution 的核心数据 — 每组是"可互换的同功能成分"
const SUBSTITUTION_GROUPS = [
  // 美白
  {
    function: "whitening",
    name: "美白",
    name_en: "Whitening",
    alternatives: [
      { inci: "TRANEXAMIC ACID", tier: "高端", price_index: 4, notes_zh: "抑制黑色素生成, 适合炎症后色沉", notes_en: "Inhibits melanin synthesis, ideal for post-inflammatory hyperpigmentation" },
      { inci: "ARBUTIN", tier: "中端", price_index: 3, notes_zh: "氢醌衍生物, 温和美白", notes_en: "Hydroquinone derivative, gentle whitening" },
      { inci: "ALPHA-ARBUTIN", tier: "中端", price_index: 3, notes_zh: "熊果苷升级版, 抑黑效果 10x", notes_en: "Upgraded arbutin, 10x melanin inhibition" },
      { inci: "ASCORBIC ACID", tier: "高端", price_index: 4, notes_zh: "原型 VC, 抗氧化同时美白, 易氧化", notes_en: "Pure vitamin C, antioxidant + whitening, unstable" },
      { inci: "TETRAHEXYLDECYL ASCORBATE", tier: "高端", price_index: 4, notes_zh: "酯化 VC, 稳定不刺激", notes_en: "Esterified VC, stable and non-irritating" },
      { inci: "MAGNESIUM ASCORBYL PHOSPHATE", tier: "中端", price_index: 3, notes_zh: "MAP, 水溶性 VC 衍生物", notes_en: "MAP, water-soluble VC derivative" },
      { inci: "NIACINAMIDE", tier: "大众", price_index: 2, notes_zh: "烟酰胺, 美白多效, 性价比高", notes_en: "Niacinamide, multi-functional whitening, cost-effective" },
      { inci: "GLUTATHIONE", tier: "高端", price_index: 4, notes_zh: "谷胱甘肽, 口服 + 外用, 抗氧化抑黑", notes_en: "Glutathione, oral + topical, antioxidant + anti-melanin" },
      { inci: "KOJIC ACID", tier: "中端", price_index: 3, notes_zh: "曲酸, 经典美白但有刺激", notes_en: "Kojic acid, classic but can irritate" },
      { inci: "ELLAGIC ACID", tier: "高端", price_index: 4, notes_zh: "鞣花酸, 来自石榴, 温和抑黑", notes_en: "Ellagic acid, from pomegranate, gentle" },
    ],
  },
  // 抗老 / 视黄醇
  {
    function: "anti_aging_retinoid",
    name: "抗老 (A 醇家族)",
    name_en: "Anti-aging (Retinoid)",
    alternatives: [
      { inci: "RETINOL", tier: "中端", price_index: 3, notes_zh: "经典 A 醇, 需转化, 孕妇禁用", notes_en: "Classic retinol, needs conversion, not for pregnant" },
      { inci: "RETINAL", tier: "高端", price_index: 4, notes_zh: "A 醛, 转化更快, 效力约 11x retinol", notes_en: "Retinal, faster conversion, ~11x potency of retinol" },
      { inci: "RETINOIC ACID", tier: "处方", price_index: 5, notes_zh: "A 酸, 处方药级, 中国禁用 (护肤品)", notes_en: "Tretinoin, Rx-grade, banned in China cosmetics" },
      { inci: "BAKUCHIOL", tier: "中端", price_index: 3, notes_zh: "补骨脂酚, 植物来源, 孕妇可用, 效力约 retinol 的 50%", notes_en: "Bakuchiol, plant-derived, pregnancy-safe, ~50% retinol potency" },
      { inci: "RETINOL PALMITATE", tier: "大众", price_index: 2, notes_zh: "A 醇棕榈酸酯, 温和, 效力低", notes_en: "Retinol palmitate, gentle, lower potency" },
      { inci: "HYDROXYPINACOLONE RETINOATE", tier: "高端", price_index: 4, notes_zh: "HPR, 视黄醇酯无需转化, 温和有效", notes_en: "HPR, retinol ester that doesn't need conversion" },
      { inci: "ADAPALENE", tier: "处方", price_index: 5, notes_zh: "阿达帕林, 祛痘处方, 偶用于抗老", notes_en: "Adapalene, Rx for acne, sometimes used for anti-aging" },
    ],
  },
  // 抗老 / VC
  {
    function: "anti_aging_vitamin_c",
    name: "抗老 (VC 家族)",
    name_en: "Anti-aging (Vitamin C)",
    alternatives: [
      { inci: "ASCORBIC ACID", tier: "高端", price_index: 4, notes_zh: "原型 VC, 效力最强但易氧化, pH < 3.5", notes_en: "L-ascorbic acid, strongest but unstable, pH < 3.5" },
      { inci: "TETRAHEXYLDECYL ASCORBATE", tier: "高端", price_index: 4, notes_zh: "THD 抗坏血酸酯, 油溶稳定, 渗透好", notes_en: "THD ascorbate, oil-soluble, stable, good penetration" },
      { inci: "MAGNESIUM ASCORBYL PHOSPHATE", tier: "中端", price_index: 3, notes_zh: "MAP, 水溶温和", notes_en: "MAP, water-soluble, gentle" },
      { inci: "SODIUM ASCORBYL PHOSPHATE", tier: "中端", price_index: 3, notes_zh: "SAP, 稳定性更好", notes_en: "SAP, better stability" },
      { inci: "ETHYL ASCORBIC ACID", tier: "中端", price_index: 3, notes_zh: "EAC, 3-O-乙基抗坏血酸, 稳定易渗透", notes_en: "EAC, 3-O-ethyl ascorbic acid, stable and penetrating" },
      { inci: "ASCORBYL GLUCOSIDE", tier: "中端", price_index: 3, notes_zh: "AA2G, 葡萄糖苷 VC", notes_en: "AA2G, glucosylated VC" },
      { inci: "ASCORBYL PALMITATE", tier: "大众", price_index: 2, notes_zh: "A 酯棕榈酸, 油溶稳定但效力较弱", notes_en: "Ascorbyl palmitate, oil-soluble, weaker" },
    ],
  },
  // 祛痘 / 酸类
  {
    function: "anti_acne_acid",
    name: "祛痘 (酸类)",
    name_en: "Anti-acne (Acids)",
    alternatives: [
      { inci: "SALICYLIC ACID", tier: "大众", price_index: 2, notes_zh: "BHA 水杨酸, 脂溶性, 溶解黑头", notes_en: "BHA salicylic acid, oil-soluble, dissolves blackheads" },
      { inci: "GLYCOLIC ACID", tier: "中端", price_index: 3, notes_zh: "AHA 甘醇酸, 分子最小, 剥脱最强", notes_en: "AHA glycolic acid, smallest molecule, strongest peel" },
      { inci: "LACTIC ACID", tier: "中端", price_index: 3, notes_zh: "AHA 乳酸, 温和保湿 + 剥脱", notes_en: "AHA lactic acid, gentle + hydrating" },
      { inci: "MANDELIC ACID", tier: "中端", price_index: 3, notes_zh: "AHA 杏仁酸, 大分子, 温和, 适合敏感肌", notes_en: "Mandelic acid, large molecule, gentle for sensitive" },
      { inci: "AZELAIC ACID", tier: "高端", price_index: 4, notes_zh: "壬二酸, 抗炎抑菌淡化痘印", notes_en: "Azelaic acid, anti-inflammatory + brightening" },
      { inci: "BENZOYL PEROXIDE", tier: "大众", price_index: 2, notes_zh: "过氧化苯甲酰, 杀菌强, 易干燥脱皮", notes_en: "BPO, strong antibacterial, can dry out skin" },
      { inci: "PHA", tier: "中端", price_index: 3, notes_zh: "葡糖酸内酯, 温和新一代 AHA", notes_en: "PHA, next-gen gentle AHA" },
    ],
  },
  // 舒缓 / 抗炎
  {
    function: "soothing",
    name: "舒缓 / 抗炎",
    name_en: "Soothing / Anti-inflammatory",
    alternatives: [
      { inci: "CENTELLA ASIATICA EXTRACT", tier: "中端", price_index: 3, notes_zh: "积雪草, 老虎草, 修护 + 抗炎", notes_en: "Centella asiatica, tiger grass, repair + anti-inflammatory" },
      { inci: "MADECASSOSIDE", tier: "高端", price_index: 4, notes_zh: "羟基积雪草苷, 积雪草纯化活性物", notes_en: "Madecassoside, purified centella active" },
      { inci: "ALLANTOIN", tier: "大众", price_index: 1, notes_zh: "尿囊素, 经典舒缓, 性价比高", notes_en: "Allantoin, classic soothing, cost-effective" },
      { inci: "PANTHENOL", tier: "大众", price_index: 2, notes_zh: "B5 泛醇, 修护屏障 + 保湿", notes_en: "B5 panthenol, barrier repair + hydration" },
      { inci: "BISABOLOL", tier: "中端", price_index: 3, notes_zh: "红没药醇, 来自洋甘菊, 抗炎", notes_en: "Bisabolol, from chamomile, anti-inflammatory" },
      { inci: "ALOE BARBADENSIS LEAF JUICE", tier: "大众", price_index: 1, notes_zh: "芦荟, 舒缓保湿", notes_en: "Aloe vera, soothing + hydrating" },
      { inci: "DIPOTASSIUM GLYCYRRHIZATE", tier: "中端", price_index: 3, notes_zh: "甘草酸二钾, 抗炎 + 美白", notes_en: "Dipotassium glycyrrhizinate, anti-inflammatory + whitening" },
      { inci: "ECTOIN", tier: "高端", price_index: 4, notes_zh: "依克多因, 极端环境修护", notes_en: "Ectoine, extreme environment protection" },
    ],
  },
  // 屏障修复
  {
    function: "barrier",
    name: "屏障修复",
    name_en: "Barrier Repair",
    alternatives: [
      { inci: "CERAMIDE NP", tier: "高端", price_index: 4, notes_zh: "神经酰胺 3, 皮肤脂质主力", notes_en: "Ceramide NP, main skin lipid" },
      { inci: "SQUALANE", tier: "中端", price_index: 3, notes_zh: "角鲨烷, 模拟皮脂", notes_en: "Squalane, mimics sebum" },
      { inci: "CHOLESTEROL", tier: "中端", price_index: 3, notes_zh: "胆固醇, 神经酰胺配方中必需", notes_en: "Cholesterol, essential in ceramide formulas" },
      { inci: "PANTHENOL", tier: "大众", price_index: 2, notes_zh: "B5 泛醇, 屏障修复基石", notes_en: "B5 panthenol, barrier repair cornerstone" },
      { inci: "ALLANTOIN", tier: "大众", price_index: 1, notes_zh: "尿囊素, 屏障 + 舒缓", notes_en: "Allantoin, barrier + soothing" },
      { inci: "MADECASSOSIDE", tier: "高端", price_index: 4, notes_zh: "积雪草苷, 修护 + 抗炎", notes_en: "Madecassoside, repair + anti-inflammatory" },
    ],
  },
  // 保湿
  {
    function: "hydrating",
    name: "保湿",
    name_en: "Hydration",
    alternatives: [
      { inci: "GLYCERIN", tier: "平价", price_index: 1, notes_zh: "甘油, 保湿性价比之王", notes_en: "Glycerin, hydration king of cost-effectiveness" },
      { inci: "BUTYLENE GLYCOL", tier: "平价", price_index: 1, notes_zh: "丁二醇, 保湿 + 溶剂", notes_en: "Butylene glycol, hydration + solvent" },
      { inci: "PROPANEDIOL", tier: "中端", price_index: 2, notes_zh: "丙二醇 (天然), 玉米来源, 温和", notes_en: "Propanediol, natural corn-derived, gentle" },
      { inci: "HYALURONIC ACID", tier: "中端", price_index: 3, notes_zh: "透明质酸, 抓水王者", notes_en: "Hyaluronic acid, water-binding champion" },
      { inci: "SODIUM HYALURONATE", tier: "中端", price_index: 3, notes_zh: "透明质酸钠, 稳定版 HA", notes_en: "Sodium hyaluronate, stable HA" },
      { inci: "POLYGLUTAMIC ACID", tier: "高端", price_index: 4, notes_zh: "聚谷氨酸, 抓水力是 HA 的 4-10x", notes_en: "PGA, 4-10x water-binding vs HA" },
      { inci: "SQUALANE", tier: "中端", price_index: 3, notes_zh: "角鲨烷, 锁水 + 模拟皮脂", notes_en: "Squalane, water-locking + mimics sebum" },
      { inci: "PANTHENOL", tier: "大众", price_index: 2, notes_zh: "B5 泛醇, 保湿 + 修护", notes_en: "B5, hydration + repair" },
      { inci: "BETAINE", tier: "大众", price_index: 2, notes_zh: "甜菜碱, 保湿 + 抗刺激", notes_en: "Betaine, hydrating + anti-irritant" },
      { inci: "CERAMIDE", tier: "高端", price_index: 4, notes_zh: "神经酰胺, 保湿 + 屏障", notes_en: "Ceramide, hydration + barrier" },
    ],
  },
  // 抗氧化
  {
    function: "antioxidant",
    name: "抗氧化",
    name_en: "Antioxidant",
    alternatives: [
      { inci: "TOCOPHEROL", tier: "大众", price_index: 2, notes_zh: "VE 生育酚, 经典抗氧化", notes_en: "Vitamin E tocopherol, classic antioxidant" },
      { inci: "UBIQUINONE", tier: "高端", price_index: 4, notes_zh: "辅酶 Q10, 协同 VE 抗氧化", notes_en: "CoQ10, synergistic with VE" },
      { inci: "FERULIC ACID", tier: "中端", price_index: 3, notes_zh: "阿魏酸, 增强 VC/VE 效力 2x", notes_en: "Ferulic acid, doubles VC/VE efficacy" },
      { inci: "RESVERATROL", tier: "高端", price_index: 4, notes_zh: "白藜芦醇, 来自葡萄/红酒, 抗氧化", notes_en: "Resveratrol, from grape/wine, antioxidant" },
      { inci: "GREEN TEA EXTRACT", tier: "中端", price_index: 3, notes_zh: "绿茶提取物, EGCG 抗氧化", notes_en: "Green tea, EGCG antioxidant" },
      { inci: "GLUTATHIONE", tier: "高端", price_index: 4, notes_zh: "谷胱甘肽, 体内主力抗氧化", notes_en: "Glutathione, body's master antioxidant" },
      { inci: "BHT", tier: "平价", price_index: 1, notes_zh: "BHT, 配方抗氧化剂 (低浓度)", notes_en: "BHT, formula antioxidant (low %)" },
    ],
  },
  // 防晒 (UV 过滤)
  {
    function: "uv_filter_chemical",
    name: "化学防晒剂",
    name_en: "UV Filter (Chemical)",
    alternatives: [
      { inci: "OCTINOXATE", tier: "大众", price_index: 2, notes_zh: "OMC, UVB 主流", notes_en: "OMC, mainstream UVB" },
      { inci: "AVOBENZONE", tier: "中端", price_index: 3, notes_zh: "Parsol 1789, UVA 主流", notes_en: "Parsol 1789, mainstream UVA" },
      { inci: "HOMOSALATE", tier: "大众", price_index: 2, notes_zh: "HMS, UVB, 常配OMC", notes_en: "HMS, UVB, often paired with OMC" },
      { inci: "OCTOCRYLENE", tier: "中端", price_index: 3, notes_zh: "OCR, UVA + UVB, 稳定", notes_en: "OCR, UVA + UVB, stable" },
      { inci: "TINOSORB S", tier: "高端", price_index: 4, notes_zh: "Bemotrizinol, 全波段稳定", notes_en: "Bemotrizinol, full-spectrum stable" },
      { inci: "MEXORYL SX", tier: "高端", price_index: 4, notes_zh: "Ecamsule, UVA 短波, 理肤泉专利", notes_en: "Ecamsule, short UVA, L'Oreal patent" },
      { inci: "MEXORYL XL", tier: "高端", price_index: 4, notes_zh: "Drometrizole, UVA + UVB", notes_en: "Drometrizole, UVA + UVB" },
    ],
  },
];

// ============================================================================
// 浓度估算 (基于 rule_categories/concentration_limits)
// ============================================================================
async function getMaxConcentration(inciName) {
  const rules = (await import("./db")).loadRules();
  if (!rules || !rules.rule_categories?.concentration_limits) return null;
  const upper = inciName.toUpperCase();
  for (const r of rules.rule_categories.concentration_limits.rules) {
    if (r.ingredient && r.ingredient.toUpperCase() === upper) {
      return {
        max_pct: r.max_pct,
        leave_on_max_pct: r.leave_on_max_pct,
        rinse_off_max_pct: r.rinse_off_max_pct,
        note: r.note,
      };
    }
  }
  return null;
}

// ============================================================================
// 法规检查 (复用 analyzer.js 思路)
// ============================================================================
async function checkRegulatory(inciName) {
  const cn = await query(
    `SELECT chinese_name, inci_name FROM cn_iecic_i WHERE UPPER(inci_name) = ? LIMIT 1`,
    [inciName]
  );
  const banned = await query(
    `SELECT "Reference Number" AS ref, "Chemical name / INN" AS name FROM annex_ii_prohibited
     WHERE UPPER("Chemical name / INN") = UPPER(?)
     LIMIT 1`,
    [inciName]
  );
  const restricted = await query(
    `SELECT "Reference number" AS ref FROM annex_iii_restricted
     WHERE UPPER("Chemical name / INN") = UPPER(?)
     LIMIT 1`,
    [inciName]
  );
  return {
    cn_iecic: cn.length > 0 ? { chinese_name: cn[0].chinese_name } : null,
    eu_banned: banned.length > 0,
    eu_banned_ref: banned[0]?.ref,
    eu_restricted: restricted.length > 0,
  };
}

// ============================================================================
// 主函数: 给定一个 INCI, 推荐 3-5 个替代
// ============================================================================
export async function findSubstitutes(inciName, options = {}) {
  const { max_results = 5, lang = "zh" } = options;
  const upper = inciName.toUpperCase().trim();

  // 1. 在替代组里查找包含这个成分的组
  const targetGroup = SUBSTITUTION_GROUPS.find(g =>
    g.alternatives.some(a => a.inci.toUpperCase() === upper)
  );

  if (!targetGroup) {
    // 没找到 = 不在替代库中, 返回空 + 建议
    return {
      query: inciName,
      found: false,
      message_zh: `暂未收录 "${inciName}" 的替代库。常见替代分类: ${SUBSTITUTION_GROUPS.map(g => g.name).join("、")}`,
      message_en: `"${inciName}" not in substitution library. Common categories: ${SUBSTITUTION_GROUPS.map(g => g.name_en).join(", ")}`,
      groups_available: SUBSTITUTION_GROUPS.map(g => g.name),
      suggestions: [],
    };
  }

  // 2. 找到的组: 排除自己, 取其他作为候选
  const candidates = targetGroup.alternatives.filter(a => a.inci.toUpperCase() !== upper);

  // 3. 为每个候选查法规 + 浓度
  const enriched = await Promise.all(candidates.slice(0, max_results * 2).map(async (c) => {
    const reg = await checkRegulatory(c.inci);
    const conc = await getMaxConcentration(c.inci);
    return {
      inci_name: c.inci,
      tier: c.tier,
      price_index: c.price_index,
      notes_zh: c.notes_zh,
      notes_en: c.notes_en,
      regulatory: reg,
      concentration: conc,
    };
  }));

  // 4. 排序: 法规干净 > 价格指数低
  enriched.sort((a, b) => {
    // 法规: 无禁用 > 无限用 > 限用 > 禁用
    const regScore = (x) => {
      if (x.regulatory.eu_banned) return 3;
      if (x.regulatory.eu_restricted) return 2;
      return 1;
    };
    const sa = regScore(a);
    const sb = regScore(b);
    if (sa !== sb) return sa - sb;
    return a.price_index - b.price_index;
  });

  return {
    query: inciName,
    found: true,
    group: targetGroup.name,
    group_en: targetGroup.name_en,
    group_function: targetGroup.function,
    candidates_count: enriched.length,
    suggestions: enriched.slice(0, max_results),
    lang,
  };
}

// ============================================================================
// 列出所有替代组 (用于 UI 导航)
// ============================================================================
export function listGroups() {
  return SUBSTITUTION_GROUPS.map(g => ({
    function: g.function,
    name: g.name,
    name_en: g.name_en,
    count: g.alternatives.length,
    sample: g.alternatives.slice(0, 3).map(a => a.inci),
  }));
}
