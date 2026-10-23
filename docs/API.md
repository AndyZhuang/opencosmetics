# FormulaLab API

Base URL: `https://opencosmetics.top/api` · 本地开发 `http://localhost:3010/api`

所有接口 **免注册、免 key**。响应体统一 UTF-8 JSON。

---

## 1. 配方工作台全量分析

`POST /api/workbench/analyze`

一次调用给出:配方结构、角色画像、相位建议、成本、法规状态、风险命中。

### 请求
```jsonc
{
  // 三选一
  "ingredients": "AQUA, GLYCERIN, NIACINAMIDE, ...",   // INCI 文本
  "ingredients": ["AQUA", "GLYCERIN"],                    // 或数组
  "lines": [                                            // 或带用量的配方行
    { "inci_name": "AQUA", "pct": 70, "phase": "A相 (水相)" }
  ],

  "context": {
    "region": "CN",          // CN | EU | US | KR | JP | ASEAN
    "population": "adult",   // adult | pregnant | child | sensitive
    "pH": 5.5                // 可选: 实测 pH。填了则 pH 规则按实测判 block
  },

  "model": {                 // 可选: 成本模型
    "batch_kg": 100,
    "net_content_g": 30,
    "gross_margin": 0.55,
    "distributor_markup": 0.35,
    "oem_markup": 0.8,
    "packaging_per_unit": 2.2,
    "processing_per_kg": 3.5,
    "loss_rate": 0.03
  },

  "lang": "zh"               // 可选
}
```

### 响应(节选)
```jsonc
{
  "ok": true,
  "formula": {
    "type": ["精华液 / Essence / Serum", "化妆水 / Toner"],
    "type_zh": "精华液 + 化妆水",
    "actives": { "total_count": 3, "categories": ["hydrating", "whitening", "soothing"], "top3": [...] },
    "vehicle": { "primary": "水基 / Water-based", "humectants": [...], "emollients": [...], "preservatives": [...] },
    "target_demographic": { "primary": "20-40 女性", "concern": "美白淡斑", "region": "东亚" },
    "price_tier": { "tier_zh": "中端", "price_range_cny": "¥150-400 (30ml)", "score": 35 },
    "suggestions": [{ "severity": "warn", "message_zh": "..." }],
    "stats": { "total_ingredients": 8, "eu_banned": 0, "risk_blocks": 0, "risk_warns": 0 }
  },

  "lines": [{
    "index": 1,
    "inci_name": "NIACINAMIDE",
    "chinese_name": "烟酰胺",
    "role": "active",              // solvent|humectant|emollient|emulsifier|surfactant|thickener|
                                   // preservative|antioxidant|uv_filter|active|extract|film_former|
                                   // ph_adjuster|chelator|colorant|optical|fragrance|conditioner|other
    "role_is_estimated": false,    // true = 画像库里没有, 靠模式推断
    "pct": 4,                      // 未提供时为 null
    "use_min": 1, "use_max": 10,   // 典型使用浓度区间 %
    "phase": "A相 (水相)",
    "price_lo": 85, "price_hi": 160,// CNY/kg
    "eu_status": "allowed",        // allowed | restricted | banned
    "cn_status": "iecic_i_included",// iecic_i_included | iecic_ii_included | not_in_iecic
    "function": "SKIN CONDITIONER",
    "function_translated": "皮肤调理剂",
    "is_banned_eu": false, "is_restricted_eu": false, "is_in_iecic": true
  }],

  "structure": {
    "role_breakdown": { "solvent": 1, "active": 2 },
    "phase_breakdown": { "A相 (水相)": 6, "B相 (油相)": 1 },
    "total_pct_declared": 82.8,
    "scaffold": [                  // 未提供用量时的典型用量骨架
      { "inci_name": "AQUA", "chinese_name": "水", "role": "solvent", "pct": 92.2 }
    ]
  },

  "cost": {
    "lines": [{
      "inci_name": "SQUALANE", "pct": 3,
      "price_cny_per_kg": 230, "price_low": 140, "price_high": 320,
      "price_source": "profile",    // profile | role_estimate
      "cost_per_kg": 6.9, "cost_share": 43.01,
      "cost_impact_10pct": 0.69, "impact_pct_of_total": 35.3
    }],
    "totals": {
      "raw_material_per_kg": 16.04, "processing_per_kg": 3.5, "total_per_kg": 19.54,
      "batch_kg": 100, "batch_cost": 2013.1, "units_per_batch": 3233.3,
      "net_content_g": 30,
      "cost_per_unit_raw": 0.62, "packaging_per_unit": 2.2, "cost_per_unit": 2.82
    },
    "retail": {
      "gross_margin": 0.55, "distributor_markup": 0.35, "oem_markup": 0.8,
      "ex_factory_price": 5.08, "suggested_price": 8.47,
      "suggested_price_method": "margin_model",
      "price_range_low": 7.2, "price_range_high": 10.16
    },
    "quality": {
      "priced_count": 8, "unknown_count": 0, "coverage_pct": 100,
      "total_pct_declared": 82.8, "balanced": false,
      "note_zh": "全部成分命中价格库。"
    },
    "top_drivers": [{ "inci_name": "SQUALANE", "cost_share": 43.01, "cost_per_kg": 6.9 }],
    "estimated_from_typical_levels": true
  },

  "regulatory": {
    "eu_banned": [{ "inci_name": "...", "chinese_name": "..." }],
    "eu_restricted": [],
    "cn_not_in_iecic": [],
    "cn_not_in_iecic_count": 0
  },

  "risk": {
    "summary": "PASS",              // PASS | REVIEW | REJECT
    "block_count": 0, "warn_count": 0, "info_count": 1,
    "ph_report": {
      "ph": 5.5, "estimated_ph": 5.5, "confidence": "low",
      "basis": ["未检出酸碱组分, 按常见护肤品默认值估算"],
      "note_zh": "...",
      "product_context": "leave_on", "product_context_zh": "驻留类 (涂抹后停留)"
    },
    "top_findings": [{
      "severity": "block",            // block | warn | info
      "category": "compatibility",   // compatibility|ph_safety|concentration|special_population|
                                    // regulatory|synbio|fda_event
      "rule_id": "COMP-001",
      "rationale": "酸度冲突 (低 pH 维 C 破坏视黄醇活性…)",
      "matched": ["RETINOL", "ASCORBIC ACID"],
      "needs_measurement": false
    }]
  }
}
```

---

## 2. 成分检索

`GET /api/ingredients/search`

| 参数 | 说明 |
|---|---|
| `q` | 关键词。INCI 名或中文名都支持(例 `niacinamide` / `烟酰胺`) |
| `limit` | 默认 30,上限 200 |
| `offset` | 分页 |
| `role` | 按角色过滤(例 `active`) |
| `only` | `cn` 已入 IECIC / `priced` 命中价格库 / `banned` EU 禁用 |

三源合并:**画像库 + EU CosIng + CN IECIC**,排序为 精确匹配 > 前缀 > 词中 > 中文名命中。

```jsonc
{
  "ok": true, "query": "niacinamide",
  "total": 15, "total_in_db": 30,
  "items": [{
    "inci_name": "NIACINAMIDE", "chinese_name": "烟酰胺",
    "function": "SKIN CONDITIONER", "cas_no": "98-92-0",
    "role": "active", "use_min": 1, "use_max": 10,
    "price_lo": 85, "price_hi": 160,
    "cn_status": "iecic_i_included", "eu_status": "allowed",
    "sources": ["EU CosIng", "CN IECIC I"]
  }]
}
```

---

## 3. 成本估算

`POST /api/formula/cost`

```jsonc
{ "lines": [{ "inci_name": "AQUA", "pct": 70 }], "model": { "batch_kg": 100 } }
```

返回结构同 `workbench/analyze` 的 `cost` 字段。

---

## 4. 版本对比

`POST /api/formula/compare`

```jsonc
{ "a": { "lines": [...] }, "b": { "lines": [...] } }
```

```jsonc
{
  "ok": true,
  "diffs": [{ "inci_name": "NIACINAMIDE", "a_pct": 2, "b_pct": 4, "delta_pct": 2, "status": "changed" }],
  "added": 1, "removed": 0, "changed": 2,
  "cost": { "a": {...}, "b": {...}, "delta_per_kg": 3.2, "delta_pct": 16.4 }
}
```

`status`:`added` / `removed` / `changed`

---

## 5. 配方草稿

设备维度,靠 `x-device-id` header 区分(客户端生成 UUID 存本地)。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/formulas` | 列表 |
| `POST` | `/api/formulas` | 保存 / 更新(带 `id` 即更新, version 自增) |
| `GET` | `/api/formulas/{id}` | 详情 |
| `PUT` | `/api/formulas/{id}` | 更新 |
| `DELETE` | `/api/formulas/{id}` | 删除 |

```jsonc
// POST body
{
  "name": "烟酰胺修护精华 v1",
  "product_type": "精华液",
  "region": "CN",
  "note": "",
  "model": { ... },
  "lines": [{ "inci_name": "AQUA", "pct": 70, "phase": "A相 (水相)" }]
}
```

---

## 6. 导出

`POST /api/formula/export` — body `{ "format": "csv" | "md" | "html", "name", "lines", "cost" }`

返回文件内容,带 `Content-Disposition: attachment` 头。CSV 带 UTF-8 BOM(Excel 直接打开不乱码)。

---

## 既有接口

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/formula/analyze` | POST | 经典配方反查(类型/活性/基质/价位/目标人群) |
| `/api/risk/check` | POST | 65 条规则明细(含全部 findings) |
| `/api/substitute` | POST | 成分替代 |
| `/api/claim` | POST | 目标反推配方 |
| `/api/reference` | GET | 参考配方库 |
| `/api/trends` | GET | 行业趋势 |
| `/api/regions` | GET | 各地法规概览 |
| `/api/china/ingredient` | GET | 中国 IECIC 检索 |
| `/api/stats` | GET | 数据规模统计 |
| `/api/mcp` | GET | MCP server(stdio + HTTP) |
