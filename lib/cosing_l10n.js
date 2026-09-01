// lib/cosing_l10n.js — CosIng function / restriction translation
// Maps EU CosIng's 80+ official cosmetic functions to Chinese

// Map normalized key -> { zh, en }
const FUNCTIONS = {
  // 大类
  "SKIN CONDITIONING":         { zh: "皮肤调理",            en: "Skin Conditioning" },
  "SKIN CONDITIONING - EMOLLIENT":{ zh: "皮肤调理 - 润肤",  en: "Skin Conditioning - Emollient" },
  "SKIN CONDITIONING - HUMECTANT":{ zh: "皮肤调理 - 保湿",  en: "Skin Conditioning - Humectant" },
  "SKIN CONDITIONING - MISCELLANEOUS":{ zh: "皮肤调理 - 其他", en: "Skin Conditioning - Misc" },
  "SKIN CONDITIONING - OCCLUSIVE":{ zh: "皮肤调理 - 封闭剂", en: "Skin Conditioning - Occlusive" },
  "SKIN PROTECTING":           { zh: "皮肤保护",            en: "Skin Protecting" },
  "SKIN BLEACHING":            { zh: "美白",                en: "Skin Bleaching" },
  "SKIN BLEACHING AGENT":      { zh: "美白剂",              en: "Skin Bleaching Agent" },
  "TONIC":                     { zh: "爽肤",                en: "Tonic" },
  "ASTRINGENT":                { zh: "收敛",                en: "Astringent" },
  "SOOTHING":                  { zh: "舒缓",                en: "Soothing" },
  "REFRESHING":                { zh: "清凉",                en: "Refreshing" },
  "ANTI-SEBUM":                { zh: "控油",                en: "Anti-Sebum" },
  "ANTISEBORRHOEIC":           { zh: "抗脂溢",              en: "Antiseborrhoeic" },
  "KERATOLYTIC":               { zh: "角质溶解",            en: "Keratolytic" },
  "ANTIWRINKLE":               { zh: "抗皱",                en: "Anti-wrinkle" },
  "ANTI-AGING":                { zh: "抗衰老",              en: "Anti-aging" },
  "FIRMMING":                  { zh: "紧致",                en: "Firming" },
  "LIPOTROPIC":                { zh: "溶脂",                en: "Lipotropic" },
  "CELLULITE":                 { zh: "抗橘皮",              en: "Cellulite" },
  "DEODORANT":                 { zh: "除臭",                en: "Deodorant" },
  "ANTIPERSPIRANT":            { zh: "止汗",                en: "Antiperspirant" },
  "DEPILATORY":                { zh: "脱毛",                en: "Depilatory" },
  "SHAVING":                   { zh: "剃须",                en: "Shaving" },

  // 头发
  "HAIR CONDITIONING":         { zh: "头发调理",            en: "Hair Conditioning" },
  "HAIR DYEING":               { zh: "染发",                en: "Hair Dyeing" },
  "HAIR WAVING OR STRAIGHTENING":{ zh: "烫/直发",           en: "Hair Waving/Straightening" },
  "HAIR FIXING":               { zh: "头发定型",            en: "Hair Fixing" },
  "HAIR BLEACHING":            { zh: "头发漂白",            en: "Hair Bleaching" },
  "ANTI-DANDRUFF":             { zh: "去屑",                en: "Anti-dandruff" },
  "ANTIDANDRUFF":              { zh: "去屑",                en: "Antidandruff" },

  // 清洁
  "CLEANSING":                 { zh: "清洁",                en: "Cleansing" },
  "FOAMING":                   { zh: "起泡",                en: "Foaming" },
  "SURFACTANT":                { zh: "表面活性剂",          en: "Surfactant" },
  "SURFACTANT - CLEANSING":    { zh: "表面活性剂 - 清洁",  en: "Surfactant - Cleansing" },
  "SURFACTANT - EMULSIFYING":  { zh: "表面活性剂 - 乳化",  en: "Surfactant - Emulsifying" },
  "SURFACTANT - SOLUBILIZING": { zh: "表面活性剂 - 增溶",  en: "Surfactant - Solubilizing" },
  "EMULSIFYING":               { zh: "乳化",                en: "Emulsifying" },
  "EMULSION STABILISING":      { zh: "乳化稳定",            en: "Emulsion Stabilising" },
  "SOLVENT":                   { zh: "溶剂",                en: "Solvent" },
  "DETERGENT":                 { zh: "洗涤剂",              en: "Detergent" },

  // 防腐/保护
  "PRESERVATIVE":              { zh: "防腐剂",              en: "Preservative" },
  "ANTIMICROBIAL":             { zh: "抗菌",                en: "Antimicrobial" },
  "ANTIOXIDANT":               { zh: "抗氧化",              en: "Antioxidant" },
  "ANTICORROSIVE":             { zh: "防腐(防锈)",         en: "Anticorrosive" },
  "CHELATING":                 { zh: "螯合",                en: "Chelating" },
  "CHELATING AGENT":           { zh: "螯合剂",              en: "Chelating Agent" },
  "SEQUESTRANT":               { zh: "多价螯合",            en: "Sequestrant" },
  "REDUCING":                  { zh: "还原",                en: "Reducing" },

  // 质感/感官
  "EMOLLIENT":                 { zh: "润肤",                en: "Emollient" },
  "HUMECTANT":                 { zh: "保湿",                en: "Humectant" },
  "MOISTURISING":              { zh: "保湿",                en: "Moisturising" },
  "MOISTURIZER":               { zh: "保湿",                en: "Moisturiser" },
  "PERFUMING":                 { zh: "芳香",                en: "Perfuming" },
  "FRAGRANCE":                 { zh: "香精",                en: "Fragrance" },
  "MASKING":                   { zh: "掩盖气味",            en: "Masking" },
  "OPACIFYING":                { zh: "遮光",                en: "Opacifying" },
  "PEARLESCENT":               { zh: "珠光",                en: "Pearlescent" },
  "PEARLING":                  { zh: "珠光",                en: "Pearling" },
  "GLOSSING":                  { zh: "增光",                en: "Glossing" },

  // 着色
  "COLORANT":                  { zh: "着色剂",              en: "Colorant" },
  "COLOURING":                 { zh: "着色",                en: "Colouring" },
  "HAIR DYE":                  { zh: "染发剂",              en: "Hair Dye" },
  "BLEACHING":                 { zh: "漂白",                en: "Bleaching" },

  // 物理
  "BINDING":                   { zh: "粘合",                en: "Binding" },
  "BULKING":                   { zh: "填充",                en: "Bulking" },
  "VISCOSITY CONTROLLING":     { zh: "黏度控制",            en: "Viscosity Controlling" },
  "GEL FORMING":               { zh: "胶凝",                en: "Gel Forming" },
  "FILM FORMING":              { zh: "成膜",                en: "Film Forming" },
  "PLASTICISER":               { zh: "增塑",                en: "Plasticiser" },
  "SLIP MODIFIER":             { zh: "滑感调节",            en: "Slip Modifier" },
  "ABRASIVE":                  { zh: "磨砂",                en: "Abrasive" },
  "ABSORBENT":                 { zh: "吸附",                en: "Absorbent" },
  "ANTICAKING":                { zh: "防结块",              en: "Anticaking" },
  "DEFOAMING":                 { zh: "消泡",                en: "Defoaming" },
  "FOAM BOOSTING":             { zh: "增效起泡",            en: "Foam Boosting" },
  "STABILISING":               { zh: "稳定",                en: "Stabilising" },
  "STABILIZER":                { zh: "稳定剂",              en: "Stabiliser" },
  "PROPELLANT":                { zh: "推进剂",              en: "Propellant" },
  "NAIL CONDITIONING":         { zh: "指甲调理",            en: "Nail Conditioning" },
  "NAIL PEARLING":             { zh: "指甲珠光",            en: "Nail Pearling" },

  // 紫外
  "UV ABSORBER":               { zh: "紫外吸收剂",          en: "UV Absorber" },
  "UV FILTER":                 { zh: "紫外过滤剂(防晒)",    en: "UV Filter" },
};

// pH / 条件 / 限量
const REGEX_TERMS = [
  // 浓度描述
  { pattern: /leave-on products/gi,    zh: "驻留类产品",         en: "leave-on products" },
  { pattern: /rinse-off products/gi,   zh: "淋洗类产品",         en: "rinse-off products" },
  { pattern: /oral products/gi,        zh: "口腔产品",           en: "oral products" },
  { pattern: /eye area/gi,             zh: "眼部",               en: "eye area" },
  { pattern: /lip products?/gi,        zh: "唇部产品",           en: "lip products" },
  { pattern: /facial products?/gi,     zh: "面部产品",           en: "facial products" },
  { pattern: /body products?/gi,       zh: "身体产品",           en: "body products" },
  { pattern: /children/gi,             zh: "儿童",               en: "children" },
  { pattern: /baby products?/gi,       zh: "婴幼儿产品",         en: "baby products" },
  { pattern: /sensitive skin/gi,       zh: "敏感肌",             en: "sensitive skin" },
  // 浓度单位
  { pattern: /\bmax\.?\s*(\d+[.,]?\d*)\s*%/gi, zh: "最大 $1%", en: "max $1%" },
  { pattern: /\bnot more than\s*(\d+[.,]?\d*)\s*%/gi, zh: "不超过 $1%", en: "not more than $1%" },
  { pattern: /\bmaximum\s*(\d+[.,]?\d*)\s*%/gi, zh: "最高 $1%", en: "maximum $1%" },
  // 状态词
  { pattern: /not to be used/gi,       zh: "不得使用",           en: "not to be used" },
  { pattern: /is prohibited/gi,        zh: "禁止使用",           en: "is prohibited" },
  { pattern: /prohibited/gi,           zh: "禁用",               en: "prohibited" },
  { pattern: /restricted/gi,           zh: "限用",               en: "restricted" },
  { pattern: /permitted/gi,            zh: "允许",               en: "permitted" },
  { pattern: /in a concentration/gi,   zh: "在浓度",             en: "in a concentration" },
  { pattern: /on condition/gi,         zh: "条件",               en: "on condition" },
  { pattern: /for other uses/gi,       zh: "其他用途",           en: "for other uses" },
  { pattern: /other than/gi,           zh: "除...之外",          en: "other than" },
];

// Translate a CosIng function string
// Input: "EMOLLIENT, SKIN CONDITIONING" or "SKIN CONDITIONING - HUMECTANT"
export function translateFunctions(fnStr, lang = "zh") {
  if (!fnStr) return "";
  const parts = String(fnStr).split(",").map(s => s.trim()).filter(Boolean);
  const translated = parts.map(p => {
    const entry = FUNCTIONS[p.toUpperCase()];
    if (entry) return lang === "en" ? entry.en : entry.zh;
    return p; // unknown — keep as-is (it's a data point)
  });
  return translated.join(lang === "en" ? ", " : "、");
}

// Translate a CosIng restriction/conditions string
// Input: EU regulation freeform English text
export function translateRestriction(restStr, lang = "zh") {
  if (!restStr) return "";
  let result = String(restStr);
  if (lang === "en") return result; // en mode: keep original
  // zh mode: replace known terms
  for (const { pattern, zh } of REGEX_TERMS) {
    result = result.replace(pattern, zh);
  }
  return result;
}

// Get the underlying English function name (for tooltips)
export function functionEnglish(fnStr) {
  return String(fnStr || "").trim();
}

// All known functions
export const KNOWN_FUNCTIONS = Object.keys(FUNCTIONS);
