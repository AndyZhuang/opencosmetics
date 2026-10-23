// lib/ingredient_profiles.js — 原料配方角色画像
// 提供: 角色(role)、典型用量区间、常见商品类别、以及对未知成分的角色推断
// 数据源: data/ingredient_profiles.json

import fs from "node:fs";
import path from "node:path";
import { readJsonFirst, dataPath } from "./json_io";

let _profiles = null;
let _index = null;

function loadRaw() {
  if (_profiles) return _profiles;
  const raw = readJsonFirst(dataPath("ingredient_profiles.json"));
  if (!raw) return null;
  const index = new Map();
  for (const row of raw.rows || []) {
    const [inci, zh, role, use, price, tags] = row;
    const key = normalizeKey(inci);
    if (!key) continue;
    index.set(key, {
      inci_name: inci,
      chinese_name: zh,
      role,
      use_min: use?.[0] ?? null,
      use_max: use?.[1] ?? null,
      price_lo: price?.[0] ?? null,
      price_hi: price?.[1] ?? null,
      tags: tags || [],
    });
  }
  _profiles = raw;
  _index = index;
  return raw;
}

export function normalizeKey(name) {
  if (!name) return "";
  return String(name)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[（(].*?[)）]/g, "")
    .replace(/[.,]/g, "")
    .trim();
}

export function loadProfileIndex() {
  loadRaw();
  return _index;
}

export function getProfile(inciName) {
  loadRaw();
  if (!_index) return null;
  return _index.get(normalizeKey(inciName)) || null;
}

// ============================================================================
// ROLE INFERENCE — for ingredients not in the curated profile list
// Pattern-based fallback so unknown INCI still gets a sensible role.
// ============================================================================
const ROLE_PATTERNS = [
  ["preservative", /PHENOXYETHANOL|ETHYLHEXYLGLYCERIN|BENZOATE|SORBATE|IMIDAZOLIDINYL|DIAZOLIDINYL|CHLORPHENESIN|METHYLISOTHIAZOLINONE|METHYLCHLOROISOTHIAZOLINONE|IMIDAZOLIDINYL UREA|DMDM HYDANTOIN|BENZYL ALCOHOL|PRESERVATIV/i],
  ["antioxidant", /TOCOPHEROL|VITAMIN E|BHT|ASCORBYL PALMITATE|THIAMETHOXAZINE|QUATERNIUM-80|L-ASCORB|ASCORBIC ACID|SODIUM ASCORBATE/i],
  ["chelator", /EDTA|GLUCONIC ACID|CITRIC ACID.*CHEL/i],
  ["ph_adjuster", /TRIETHANOLAMINE|AMMONIUM HYDROXIDE|SODIUM HYDROXIDE|POTASSIUM HYDROXIDE|HYDROCHLORIC ACID|PHOSPHORIC ACID|SODIUM BICARBONATE|AMMONIUM CHLORIDE/i],
  ["uv_filter", /AVOBENZONE|OCTINOXATE|OCTOCRYLENE|HOMOSALATE|MEXORYL|TINOSORB|METHYLENE BIS-BENZOTRIAZINYL|BIS-ETHYLHEXYLOXYPHENOL|DIETHYLHEXYL BUTAMIDOTRIPIONATE|ETHYLHEXYL METHOXYCINNAMATE|BUTYL METHOXYCINNAMATE|PABA|IMIDAZOLINE|PHenylbenzimidazole/i],
  ["colorant", /^CI\s?\d|CI\s?\d{5}|^TINCTURE|CARMINE|IRON OXIDE|ULTRAMARINE|TITANIUM DIOXIDE/i],
  ["optical", /MICA|BOROSILICATE|POLYBUTENE|PVP.*SHEEN|SILICA.*AMORPHOUS/i],
  ["fragrance", /PARFUM|FRAGRANCE|AROMA|ESSENCE OIL/i],
  ["surfactant", /SULFATE|SULFONATE|COCAMID|DECYL GLUCOSIDE|COCO-GLUCOSIDE|BETAINE|LAURETH|COCETH|POLYSORBATE|PEG-\d+.*(?:OLEATE|LAURATE|MONOSTEARATE)|TEA-DODECANOYL/i],
  ["emulsifier", /GLYCERYL STEARATE|CETEARYL ALCOHOL|CETEARYL STEARATE|GLYCERIL OLEATE|POLYGLYCEROL|POLYSORBATE|PEG-\d+.*(?:STEARATE|COCONUT)|SORBITAN (?:MONO|LAURATE|STEARATE)|LECITHIN|MONOGLYCERIDE|GLYCERYL OLEATE|PROPYLENE GLYCOL MONO.*STEARATE/i],
  ["thickener", /CARBOMER|XANTHAN|CELLULOSE|PVP|GUM |HECTORITE|BENTONITE|KAOLIN|TALC|SILICA|MAGNESIUM ALUMINUM SILICATE|TRIHYDROXYSTEARATE|PENTAERYTHRITYL|DISTEARDIMONIUM/i],
  ["film_former", /PVP|POLYVINYL|VA COPOLYMER|ACRYLATES COPOLYMER|POLYQUATERNIUM|SILICONE.*COPOLYMER|PROPYLENE GLYCOL.*VINYL/i],
  ["humectant", /GLYCERIN|GLYCEROL|BUTYLENE GLYCOL|PROPYLENE GLYCOL|PENTYLENE GLYCOL|PROPANEDIOL|SORBITOL|PCA|UREA|HYALURONIC|MUCOPOLYSACCHARIDE|TREHALOSE|GLYCERYL.*HYDROXYETHYL/i],
  ["emollient", /SQUALANE|SQU ALENE|DIMETHICONE|SILOXANE|CETEA|GLYCERYL STEARATE|STEARIC|ISOPROPYL|ETHYLHEXYL|OLEATE|OIL$|LANOLIN|LANOLIN|SPHINGOLIPID|CHOLESTEROL|SHEA|MANGO|COCOA BUTTER|MYRISTATE|PALMITATE/i],
  ["solvent", /AQUA|WATER|ETHANOL|ALCOHOL|PROPYLENE GLYCOL|BUTYLENE GLYCOL|HEXANE|ISOPROPYL ALCOHOL|ACETONE|TOLUENE|STYRENE|BENZENE|PROPYLENE GLYCOL DIPRIVATE|C10-16 ALKANE|DODECANE|UNDECANE/i],
  ["extract", /EXTRACT$|EXTRACT,|LEAF EXTRACT|ROOT EXTRACT|FRUIT EXTRACT|SEED OIL$/i],
  ["active", /PEPTIDE|RETINOL|RETINAL|RETINOIC|VITAMIN C|ASCORBIC|NIACINAMIDE|TRANEXAMIC|ARBUTIN|SALICYLIC|GLYCOLIC|LA[CT]IC|AHA|BHA|PHA|CENTELLA|MADECASSOSIDE|ASIATICOSIDE|CERAMIDE|PHYTOSPHINGOSINE|ADENOSINE|CAFFEINE|HYALURONIC|COLLAGEN|ELASTIN|KERATIN|BIFIDA|LACTOBACILLUS|GLUTATHIONE|RESVERATROL|FERULIC|UBIQUINONE|COQ10|BAKUCHIOL|SQUALENE|TRIS\(HYDROXYMETHYL\)|PANTHENOL|ALLANTOIN|BISABOLOL|GLYCYRRHIZINATE|TEA POLYPHENOL/i],
  ["conditioner", /BEHENTRIMONIUM|CETRIMONIUM|DISTEARDIMONIUM|POLYQUATERNIUM|CAMPHOROCHLORIDINE|AMMONIUM.*CHLORIDE/i],
];

export function inferRole(inciName) {
  const key = normalizeKey(inciName);
  if (!key) return "other";
  for (const [role, re] of ROLE_PATTERNS) {
    if (re.test(key)) return role;
  }
  return "other";
}

// ============================================================================
// Enrich an ingredient record with role / use levels / price band
// ============================================================================
export function enrichIngredient(inciName, extra = {}) {
  const profile = getProfile(inciName);
  const role = profile?.role || inferRole(inciName);
  return {
    inci_name: profile?.inci_name || String(inciName || "").toUpperCase().trim(),
    chinese_name: profile?.chinese_name || null,
    role,
    role_is_estimated: !profile,
    use_min: profile?.use_min ?? null,
    use_max: profile?.use_max ?? null,
    price_lo: profile?.price_lo ?? null,
    price_hi: profile?.price_hi ?? null,
    tags: profile?.tags || [],
    ...extra,
  };
}

export function profileMeta() {
  const raw = loadRaw();
  if (!raw) return null;
  return { version: raw._meta?.version, last_updated: raw._meta?.last_updated, roles: raw._meta?.roles, count: (_index?.size) || 0 };
}
