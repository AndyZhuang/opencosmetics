# 🧪 Open Cosmetics / 开放美妆数据

> **B2B 化妆品数据 MCP + Next.js** — 中国 + 欧盟 + 美国 + 合成生物 · 8 维度原料数据库 · 65 风险规则 · Claude / GPT 可直接调用的 MCP server
>
> **B2B cosmetics data MCP + Next.js** — China + EU + US + synthetic biology · 8-dim ingredient DB · 65 risk rules · MCP server callable from Claude / GPT

[![DuckDB](https://img.shields.io/badge/DuckDB-v4.0-yellow)]()
[![Next.js](https://img.shields.io/badge/Next.js-15-black)]()
[![MCP](https://img.shields.io/badge/MCP-v0.2-green)]()
[![License: CC-BY 4.0](https://img.shields.io/badge/License-CC--BY%204.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub stars](https://img.shields.io/github/stars/AndyZhuang/opencosmetics)](https://github.com/AndyZhuang/opencosmetics)
[![i18n](https://img.shields.io/badge/i18n-中%2FEN-purple)]()

---

## 🌍 Bilingual / 双语

The site supports **3 display modes**, switchable from the nav bar:
- 🌐 **中+EN** (default) — both languages
- 🇨🇳 **中文** — Chinese only
- 🇺🇸 **EN** — English only

API responses include a `lang` field; pass `?lang=en` or `?lang=zh` (or `Cookie: opencosmetics_lang=...`) to switch.

---

## ✨ Features / 特性

| | EN | 中 |
|---|---|---|
| 🇪🇺 **EU 法规** | 50,169 CosIng + 1,927 regulatory (Annex II/III/IV/V/VI) | 50,169 CosIng + 1,927 监管 (Annex II/III/IV/V/VI) |
| 🇨🇳 **中国法规** | 8,985 NMPA IECIC I + 2 IECIC II + 113 paragraphs adjustments | 8,985 NMPA IECIC I + 2 IECIC II + 113 段调整 |
| 🇺🇸 **FDA 事件** | 85,511 cosmetic events + 4-dim aggregation | 85,511 化妆品事件 + 4 维度聚合 |
| 🧬 **合成生物** | 4 listed companies (Juzi/Jinbo/Huaxi/Chuangjian) | 4 上市 (巨子/锦波/华熙/创健) |
| ⚖️ **风险规则** | 65 rules × 7 categories (compat/pH/conc/pop/region/synbio/FDA) | 65 规则 × 7 类 (兼容/pH/浓度/特殊人群/区域/合成生物/FDA) |
| 📋 **多地区合规** | CN / EU / US / KR / JP / ASEAN | CN / EU / US / KR / JP / ASEAN |
| 🛡️ **GB 7916-2026** | First mandatory national standard (effective 2028-01-01) | 首个强制性国标 (2028-01-01 实施) |
| 🤖 **MCP** | TypeScript SDK stdio + HTTP, 4 tools | TypeScript SDK stdio + HTTP, 4 工具 |

## 🚀 Quick Start / 快速开始

### 1. Web (5 minutes / 5 分钟)
```bash
git clone https://github.com/AndyZhuang/opencosmetics.git
cd opencosmetics
npm install
npm run dev
# → http://localhost:3000
```

### 2. MCP server (Claude Desktop)
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "opencosmetics": {
      "command": "node",
      "args": ["/path/to/opencosmetics/mcp-server/dist/index.js"]
    }
  }
}
```

### 3. Direct DuckDB
```bash
duckdb data/bebd.duckdb
> SELECT * FROM cn_iecic_i WHERE inci_name ILIKE '%RETINOL%' LIMIT 5;
> SELECT * FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE '%nitroglycerin%';
```

## 📊 Data Scale / 数据规模

| Table | Records | Source |
|---|---|---|
| `cosing` | 50,169 | EU CosIng (unified) |
| `cosing_lite` | 28,354 | beauteeru (PubChem) |
| `cosing_obf` | 24,127 | OBF CosIng full |
| `annex_ii_prohibited` | 1,431 | EU Banned |
| `annex_iii_restricted` | 309 | EU Restricted |
| `annex_iv_colorants` | 153 | EU Colorants |
| `annex_v_preservatives` | 56 | EU Preservatives |
| `annex_vi_uv_filters` | 31 | EU UV Filters |
| **`cn_iecic_i`** | **8,985** | **NMPA Existing** |
| **`cn_iecic_ii`** | **2** | **NMPA New Ingredients** |
| **`cn_iecic_adjustments`** | **113 paragraphs** | **NMPA 2025-06-23** |
| `fda_cosmetic_events_*` | 85,511 | FDA Cosmetic Events |
| `companies.json` | 4 | 巨子/锦波/华熙/创健 |
| `rules.json` | 65 rules | compat/pH/conc/pop/region/synbio/FDA |

**Total: ~130K+ records** + 65 risk rules + 4 companies

## 🤖 MCP Tools / 4 工具

| Tool | Args | EN | 中 |
|---|---|---|---|
| `ingredient_query` | `q: string` | Cross-source query (CN + EU + INCI) | 跨源查询 (CN + EU + INCI) |
| `formula_review` | `ingredients: string[], context: {population, region}` | 65-rule review | 65 规则审查 |
| `compliance_check` | `ingredient: string, regions: string[]` | Multi-region compliance | 多地区合规扫描 |
| `synbio_company` | `id?: string` | 4 listed companies metadata | 4 上市公司元数据 |

**Example / 示例 (curl):**
```bash
# Formula review / 配方风险审查
curl -X POST http://localhost:3000/api/risk/check \
  -H "Content-Type: application/json" \
  -d '{"ingredients": ["RETINOL", "AHA", "VITAMIN_C"], "context": {"population": "pregnant", "region": "CN"}}'
# → {"summary": "REJECT", "block_count": 3, "warn_count": 5, "findings": [...], "lang": "both"}
```

## 📂 Project Structure / 项目结构

```
opencosmetics/
├── app/                          # Next.js 15 App Router
│   ├── page.js                   # Home: 5 sources + Killer Finding
│   ├── ingredients/              # Ingredients (50K)
│   ├── regulatory/               # EU Regulatory
│   ├── fda/                      # FDA 85K events
│   ├── china/                    # 🇨🇳 NMPA 8,985 + GB 7916-2026
│   ├── synbio/                   # 🧬 Juzi/Jinbo/Huaxi/Chuangjian
│   ├── risk/                     # ⚖️ 65-rule review
│   └── api/
│       ├── mcp/route.js          # MCP HTTP entry
│       ├── china/ingredient/     # Chinese ingredient query
│       ├── synbio/companies/     # Synbio companies
│       ├── risk/check/           # Risk review
│       ├── regions/              # Multi-region compliance
│       └── stats/                # Aggregate stats
├── lib/
│   ├── db.js                     # DuckDB singleton + risk engine
│   └── i18n.js                   # i18n dictionary (zh/en/both)
├── components/
│   ├── LangSwitcher.js           # 3-state language switcher
│   └── Bilingual.js              # Bilingual field component
├── data/
│   ├── bebd.duckdb               # 17 MB — 25 tables (EU+CN+US)
│   ├── companies.json            # 4 synbio companies
│   └── rules.json                # 65 risk rules
├── mcp-server/                   # TypeScript stdio MCP server
│   ├── src/index.ts              # 4 tools
│   ├── dist/index.js             # 11.3 KB compiled
│   └── package.json
├── scripts/                      # Data ingest pipeline
│   ├── 01_download_sources.py
│   └── 02_merge_duckdb.py
└── docs/
    ├── ARCHITECTURE.md
    └── MCP.md
```

## 🔗 Links / 链接

- GitHub: https://github.com/AndyZhuang/opencosmetics
- Demo: deployment in progress
- MCP: TypeScript SDK, stdio + HTTP

## 🛣️ Roadmap / 路线图

### Q3 2026 (v0.2.0 — DONE / 已完成 ✅)
- [x] 5 sources EU + NMPA + FDA + 4 synbio companies + 65 rules (v0.2.0)
- [x] **Bilingual UI (zh + en) + 3-mode language switcher (v0.2.1)**

### Q4 2026
- [ ] 1,284 banned + 109 plant/animal prohibited + STSC 2015 4 tables
- [ ] KR KCID 20,530 / JP JCIA 16,152 / ASEAN 1,870
- [ ] MCP Pro tier auth ($99/mo 100K req)
- [ ] Enterprise tier ($999/mo SLA)

### Q1 2027
- [ ] LLM-based auto-formulation
- [ ] Market-comp analysis + differentiation suggestions

## 📜 License / 许可证

- **Data / 数据**: CC-BY 4.0 (per-source attribution in `data/sources.csv`)
- **Code / 代码**: MIT
- **Docs / 文档**: CC-BY 4.0

## 🙋 Maintainer / 维护

- [AndyZhuang](https://github.com/AndyZhuang) + [Mavis AI agent](https://MiniMax.com)
- Feedback: GitHub Issues / Discussion
