// lib/claim_to_formula.js — Reverse-derive a starter formula from consumer claim
// Input: "敏感肌 + 修护 + ¥300 价位" or structured { concerns, population, price_tier }
// Output: recommended actives + concentrations + vehicle + reference formulas

// (no i18n import needed for this module)

// ============================================================================
// CLAIM CATALOG — 15 大护肤目标 + 推荐活性组合
// ============================================================================
const CLAIMS = [
  {
    id: "sensitive_repair",
    name_zh: "敏感肌修护",
    name_en: "Sensitive Repair",
    icon: "🛡️",
    target_demo: "20-45 敏感肌, 屏障受损",
    key_actives: [
      { inci: "CENTELLA ASIATICA EXTRACT", pct: "2-5%", role_zh: "主修复", role_en: "primary repair" },
      { inci: "MADECASSOSIDE", pct: "0.1-0.5%", role_zh: "纯化活性", role_en: "purified active" },
      { inci: "PANTHENOL", pct: "3-5%", role_zh: "B5 修复", role_en: "B5 repair" },
      { inci: "ALLANTOIN", pct: "0.3-0.5%", role_zh: "舒缓", role_en: "soothing" },
      { inci: "CERAMIDE NP", pct: "0.3-1%", role_zh: "屏障", role_en: "barrier" },
    ],
    avoid: ["AHA", "BHA", "RETINOL", "FRAGRANCE", "ETHANOL"],
    vehicle: "乳液 / 面霜 (屏障友好)",
    notes_zh: "避免酸类 / 视黄醇 / 香精 / 高浓度酒精, 优先修护活性物 + 模拟皮脂的车载",
    notes_en: "Avoid acids/retinol/fragrance/high-ethanol. Use repair actives + skin-mimic vehicle.",
    price_tier: ["mid", "premium"],
  },
  {
    id: "whitening_brightening",
    name_zh: "美白淡斑",
    name_en: "Whitening / Brightening",
    icon: "✨",
    target_demo: "20-40 暗沉 / 痘印 / 色斑",
    key_actives: [
      { inci: "NIACINAMIDE", pct: "2-10%", role_zh: "主活性", role_en: "primary" },
      { inci: "TRANEXAMIC ACID", pct: "1-3%", role_zh: "抑黑", role_en: "anti-melanin" },
      { inci: "ARBUTIN", pct: "1-2%", role_zh: "温和美白", role_en: "gentle" },
      { inci: "ASCORBIC ACID", pct: "5-20%", role_zh: "VC 抑黑抗氧化", role_en: "VC anti-melanin" },
      { inci: "TETRAHEXYLDECYL ASCORBATE", pct: "2-5%", role_zh: "稳定 VC", role_en: "stable VC" },
    ],
    avoid: ["HYDROQUINONE", "MERCURY"],
    vehicle: "精华液 (清爽水基) + 防晒 (白天必须)",
    notes_zh: "美白需配合防晒, 否则越用越黑。VC 早上用, 烟酰胺早晚可用。",
    notes_en: "Pair with sunscreen (mandatory) to prevent rebound. VC in AM, niacinamide AM/PM.",
    price_tier: ["mid", "premium"],
  },
  {
    id: "anti_aging",
    name_zh: "抗衰老 / 抗皱",
    name_en: "Anti-aging / Anti-wrinkle",
    icon: "🌟",
    target_demo: "30+ 细纹 / 弹性下降",
    key_actives: [
      { inci: "RETINOL", pct: "0.025-0.1%", role_zh: "A 醇金标准", role_en: "gold standard" },
      { inci: "RETINAL", pct: "0.05-0.1%", role_zh: "A 醛更快", role_en: "faster" },
      { inci: "BAKUCHIOL", pct: "0.5-1%", role_zh: "植物 A 醇 孕妇可用", role_en: "plant retinol" },
      { inci: "ASCORBIC ACID", pct: "10-20%", role_zh: "VC 抗氧化 + 胶原", role_en: "VC antioxidant + collagen" },
      { inci: "PEPTIDE", pct: "2-5%", role_zh: "胜肽信号", role_en: "peptide signal" },
      { inci: "TOCOPHEROL", pct: "0.5-1%", role_zh: "VE 协同", role_en: "VE synergy" },
    ],
    avoid: ["孕妇禁用 A 醇/水杨酸/对苯二酚"],
    vehicle: "精华液 (油基或水基) + 晚霜",
    notes_zh: "A 醇必须晚上用 + 配合防晒。孕妇改 bakuchiol。",
    notes_en: "Retinol PM only + sunscreen mandatory. Pregnant: switch to bakuchiol.",
    price_tier: ["mid", "premium", "luxury"],
  },
  {
    id: "anti_acne",
    name_zh: "祛痘 / 控油",
    name_en: "Anti-acne / Oil Control",
    icon: "🧹",
    target_demo: "15-30 油痘肌",
    key_actives: [
      { inci: "SALICYLIC ACID", pct: "0.5-2%", role_zh: "BHA 脂溶, 溶解黑头", role_en: "BHA oil-soluble" },
      { inci: "BENZOYL PEROXIDE", pct: "2.5-5%", role_zh: "杀菌", role_en: "antibacterial" },
      { inci: "AZELAIC ACID", pct: "10-15%", role_zh: "壬二酸, 痘印 + 抗炎", role_en: "azelaic" },
      { inci: "NIACINAMIDE", pct: "4-5%", role_zh: "控油", role_en: "oil control" },
      { inci: "ZINC PCA", pct: "1-2%", role_zh: "抑菌 + 控油", role_en: "antibact + oil" },
      { inci: "ADAPALENE", pct: "0.1%", role_zh: "处方级 (Rx)", role_en: "Rx-grade" },
    ],
    avoid: ["重油矿脂", "椰子油 (致痘)", "MIT"],
    vehicle: "凝胶 / 精华液 (清爽无油)",
    notes_zh: "BPO 和 BHA 不要同时用, 容易刺激。早 BPO 晚 BHA 是常见方案。",
    notes_en: "Don't layer BPO + BHA. Common: BPO AM, BHA PM.",
    price_tier: ["drugstore", "mid"],
  },
  {
    id: "hydrating",
    name_zh: "保湿补水",
    name_en: "Hydration",
    icon: "💧",
    target_demo: "全龄 干燥 / 缺水",
    key_actives: [
      { inci: "GLYCERIN", pct: "3-10%", role_zh: "基础保湿", role_en: "base humectant" },
      { inci: "HYALURONIC ACID", pct: "0.1-1%", role_zh: "抓水", role_en: "water-binding" },
      { inci: "SODIUM HYALURONATE", pct: "0.1-2%", role_zh: "稳定 HA", role_en: "stable HA" },
      { inci: "POLYGLUTAMIC ACID", pct: "0.1-0.5%", role_zh: "PGA 强抓水", role_en: "PGA strong" },
      { inci: "BUTYLENE GLYCOL", pct: "3-8%", role_zh: "溶剂保湿", role_en: "solvent humectant" },
      { inci: "SQUALANE", pct: "2-5%", role_zh: "锁水", role_en: "water-locking" },
    ],
    avoid: ["高浓度酒精 (挥发带水)"],
    vehicle: "化妆水 / 精华液 / 乳液",
    notes_zh: "保湿 = 抓水 (HA/Glycerin) + 锁水 (Squalane/Ceramide), 两步都要有。",
    notes_en: "Hydration = humectants (HA/Glycerin) + occlusives (Squalane/Ceramide). Both needed.",
    price_tier: ["drugstore", "mid"],
  },
  {
    id: "barrier_repair",
    name_zh: "屏障修复",
    name_en: "Barrier Repair",
    icon: "🏰",
    target_demo: "屏障受损 / 玫瑰痤疮 / 激素脸",
    key_actives: [
      { inci: "CERAMIDE NP", pct: "0.3-1%", role_zh: "神经酰胺 3", role_en: "ceramide 3" },
      { inci: "CHOLESTEROL", pct: "0.3-1%", role_zh: "胆固醇", role_en: "cholesterol" },
      { inci: "SQUALANE", pct: "2-5%", role_zh: "角鲨烷", role_en: "squalane" },
      { inci: "PANTHENOL", pct: "3-5%", role_zh: "B5 修护", role_en: "B5" },
      { inci: "MADECASSOSIDE", pct: "0.1-0.5%", role_zh: "积雪草苷", role_en: "centella" },
      { inci: "ALLANTOIN", pct: "0.3-0.5%", role_zh: "舒缓", role_en: "soothing" },
    ],
    avoid: ["AHA", "BHA", "RETINOL", "FRAGRANCE", "高浓度酒精"],
    vehicle: "面霜 (含矿脂或神经酰胺仿生脂质)",
    notes_zh: "模拟皮肤脂质: 神经酰胺 + 胆固醇 + 脂肪酸, 1:1:1 摩尔比最接近皮肤。",
    notes_en: "Mimic skin lipids: ceramide + cholesterol + fatty acids 1:1:1 molar ratio.",
    price_tier: ["mid", "premium"],
  },
  {
    id: "antioxidant_anti_pollution",
    name_zh: "抗氧化 / 抗污染",
    name_en: "Antioxidant / Anti-pollution",
    icon: "🛡️",
    target_demo: "城市通勤 / 25+ 抗光老",
    key_actives: [
      { inci: "ASCORBIC ACID", pct: "10-20%", role_zh: "VC 主力", role_en: "VC main" },
      { inci: "TOCOPHEROL", pct: "0.5-1%", role_zh: "VE 协同", role_en: "VE synergy" },
      { inci: "FERULIC ACID", pct: "0.5%", role_zh: "稳定 + 增效", role_en: "stabilize + boost" },
      { inci: "UBIQUINONE", pct: "0.5-1%", role_zh: "CoQ10", role_en: "CoQ10" },
      { inci: "RESVERATROL", pct: "0.5-1%", role_zh: "白藜芦醇", role_en: "resveratrol" },
      { inci: "GREEN TEA EXTRACT", pct: "1-3%", role_zh: "绿茶多酚", role_en: "tea polyphenol" },
    ],
    avoid: [],
    vehicle: "精华液 (早 C 晚 A 经典)",
    notes_zh: "经典组合: 10% VC + 1% VE + 0.5% 阿魏酸 (修丽可 CE Ferulic)。早 C 晚 A = 早抗氧化, 晚修护。",
    notes_en: "Classic combo: 10% VC + 1% VE + 0.5% Ferulic (Skinceuticals CE Ferulic). AM C, PM A.",
    price_tier: ["mid", "premium", "luxury"],
  },
  {
    id: "sunscreen",
    name_zh: "防晒 (SPF 30+)",
    name_en: "Sunscreen (SPF 30+)",
    icon: "☀️",
    target_demo: "全龄 / 每天必备",
    key_actives: [
      { inci: "OCTINOXATE", pct: "5-7.5%", role_zh: "UVB 主力", role_en: "UVB main" },
      { inci: "AVOBENZONE", pct: "2-3%", role_zh: "UVA 主力", role_en: "UVA main" },
      { inci: "OCTOCRYLENE", pct: "2-10%", role_zh: "稳定剂", role_en: "stabilizer" },
      { inci: "HOMOSALATE", pct: "5-15%", role_zh: "UVB 辅助", role_en: "UVB boost" },
      { inci: "TINOSORB S", pct: "1-3%", role_zh: "广谱稳定", role_en: "broad spectrum" },
      { inci: "TITANIUM DIOXIDE", pct: "2-25%", role_zh: "物理 UV", role_en: "physical UV" },
    ],
    avoid: [],
    vehicle: "乳液 (无油或含油, 看肤质)",
    notes_zh: "每天用, 阴天也要。SPF30+ / PA+++ 是底线。2mg/cm^2 用量, 脸约 1.25ml。",
    notes_en: "Daily use, even on cloudy days. SPF30+ / PA+++ minimum. 2mg/cm^2, face ~1.25ml.",
    price_tier: ["drugstore", "mid", "premium"],
  },
  {
    id: "exfoliation",
    name_zh: "焕肤 / 去角质",
    name_en: "Exfoliation / Resurfacing",
    icon: "🌿",
    target_demo: "耐受肌 / 暗沉 / 痘印",
    key_actives: [
      { inci: "GLYCOLIC ACID", pct: "5-10%", role_zh: "甘醇酸 剥脱最强", role_en: "glycolic strongest" },
      { inci: "LACTIC ACID", pct: "5-10%", role_zh: "乳酸 保湿 + 剥脱", role_en: "lactic + hydrate" },
      { inci: "MANDELIC ACID", pct: "5-10%", role_zh: "杏仁酸 大分子温和", role_en: "mandelic gentle" },
      { inci: "SALICYLIC ACID", pct: "1-2%", role_zh: "BHA 脂溶", role_en: "BHA oil-soluble" },
      { inci: "PHA", pct: "5-15%", role_zh: "葡糖酸内酯 温和", role_en: "PHA gentle" },
      { inci: "RETINOL", pct: "0.025-0.05%", role_zh: "加速代谢", role_en: "metabolism" },
    ],
    avoid: ["敏感肌", "玫瑰痤疮", "孕妇"],
    vehicle: "精华液 / 棉片",
    notes_zh: "从低浓度 (5%) 开始, 每周 2-3 次, 慢慢建立耐受。务必防晒!",
    notes_en: "Start low (5%), 2-3x/week, build tolerance. SUNSCREEN MANDATORY.",
    price_tier: ["mid", "premium"],
  },
  {
    id: "anti_hair_loss",
    name_zh: "防脱 / 生发",
    name_en: "Anti Hair Loss",
    icon: "💆",
    target_demo: "25-50 男女脱发",
    key_actives: [
      { inci: "MINOXIDIL", pct: "2-5%", role_zh: "米诺地尔, 唯一 FDA 批准", role_en: "Minoxidil, only FDA-approved" },
      { inci: "CAFFEINE", pct: "0.5-2%", role_zh: "防脱辅助", role_en: "anti-loss support" },
      { inci: "BIOTIN", pct: "0.1-0.5%", role_zh: "生物素", role_en: "biotin" },
      { inci: "NIACINAMIDE", pct: "1-5%", role_zh: "促循环", role_en: "circulation" },
      { inci: "ZINC PCA", pct: "1-2%", role_zh: "控油", role_en: "oil control" },
      { inci: "PANTHENOL", pct: "2-5%", role_zh: "修护", role_en: "repair" },
    ],
    avoid: ["孕妇/哺乳禁用米诺地尔"],
    vehicle: "头皮精华液 / 精华乳",
    notes_zh: "米诺地尔是黄金标准, 中国属于 OTC 药品, 需备案。其他成分辅助。",
    notes_en: "Minoxidil is gold standard. In China, Rx only. Other actives are supportive.",
    price_tier: ["mid", "premium"],
  },
];

const PRICE_TIER_LABEL = {
  drugstore: { zh: "平价 ¥10-80", en: "Drugstore" },
  mid: { zh: "中端 ¥150-400", en: "Mid-range" },
  premium: { zh: "高端 ¥400-1500", en: "Premium" },
  luxury: { zh: "奢华 ¥1500+", en: "Luxury" },
};

// ============================================================================
// 主函数: 根据 claim 找推荐
// ============================================================================
export function suggestFormulaFromClaim(input) {
  const { claim_id, concerns, population, price_tier, lang = "zh" } = input;

  // 1. 直接按 claim_id 匹配
  let matched = null;
  if (claim_id) {
    matched = CLAIMS.find(c => c.id === claim_id);
  }

  // 2. 按 concerns 关键词匹配
  if (!matched && concerns) {
    const lower = String(concerns).toLowerCase();
    matched = CLAIMS.find(c => {
      const zh = (c.name_zh || "").toLowerCase();
      const en = (c.name_en || "").toLowerCase();
      const id = c.id || "";
      return zh.includes(lower) || en.includes(lower) || id.includes(lower);
    });
  }

  if (!matched) {
    return {
      found: false,
      message_zh: `未找到 "${concerns || claim_id}" 对应的护肤目标。试试: ${CLAIMS.map(c => c.name).slice(0, 5).join("、")} 等`,
      message_en: `No claim found for "${concerns || claim_id}". Try: ${CLAIMS.map(c => c.name_en).slice(0, 5).join(", ")} etc.`,
      available_claims: CLAIMS.map(c => ({ id: c.id, name: c.name, name_en: c.name_en, icon: c.icon })),
    };
  }

  // 3. 按价位过滤
  let priceTiers = matched.price_tier;
  if (price_tier && !priceTiers.includes(price_tier)) {
    // 调整到最近的
    const order = ["drugstore", "mid", "premium", "luxury"];
    const want = order.indexOf(price_tier);
    priceTiers = matched.price_tier.filter(t => Math.abs(order.indexOf(t) - want) <= 1);
    if (priceTiers.length === 0) priceTiers = matched.price_tier;
  }

  return {
    found: true,
    claim: {
      id: matched.id,
      name: matched.name,
      name_en: matched.name_en,
      icon: matched.icon,
      target_demo: matched.target_demo,
    },
    actives: matched.key_actives,
    avoid: matched.avoid,
    vehicle: matched.vehicle,
    notes: lang === "en" ? matched.notes_en : matched.notes_zh,
    price_tiers_available: matched.price_tier.map(t => ({ tier: t, label: PRICE_TIER_LABEL[t][lang === "en" ? "en" : "zh"] })),
    price_tiers_filtered: priceTiers,
    population_note: population && population !== "adult" ? {
      pregnant: "孕妇: 禁用 A 醇/A 醛/水杨酸/对苯二酚, 改 bakuchiol/azelaic",
      child: "儿童: 简化配方, 避免香精/色素, 选 pH 4.5-7.5 温和产品",
      sensitive: "敏感肌: 减半所有活性浓度, 增加屏障修护成分",
    }[population] : null,
    lang,
  };
}

export function listClaims() {
  return CLAIMS.map(c => ({
    id: c.id,
    name: c.name,
    name_en: c.name_en,
    icon: c.icon,
    target_demo: c.target_demo,
    actives_count: c.key_actives.length,
  }));
}
