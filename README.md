# 🧪 Open Cosmetics

> **B2B 化妆品数据 MCP + Next.js** — 中国 + 欧盟 + 美国 + 合成生物, 8 维度原料数据库, 65 风险规则, Claude / GPT 可直接调用的 MCP server

[![DuckDB](https://img.shields.io/badge/DuckDB-v4.0-yellow)]()
[![Next.js](https://img.shields.io/badge/Next.js-15-black)]()
[![MCP](https://img.shields.io/badge/MCP-v0.1-green)]()
[![License: CC-BY 4.0](https://img.shields.io/badge/License-CC--BY%204.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub stars](https://img.shields.io/github/stars/AndyZhuang/opencosmetics)](https://github.com/AndyZhuang/opencosmetics)

## ✨ 特性

| 维度 | 数据 | 源 |
|---|---|---|
| 🇪🇺 **EU 法规** | 50,169 CosIng + 1,927 监管 (Annex II/III/IV/V/VI) | walkowskis + beauteeru + openfoodfacts (jsDelivr) |
| 🇨🇳 **中国法规** | 8,985 IECIC I + 2 IECIC II + 113 段调整 | NMPA 2025 年第 61 号公告 (xlsx/docx) |
| 🇺🇸 **FDA 事件** | 85,511 化妆品事件 + 4 维度聚合 | openFDA `/cosmetic/event` |
| 🧬 **合成生物** | 4 上市 (巨子/锦波/华熙/创健) | HKEX 02367 / 北交所 920982 / 上交所 688363 / 新三板 873593 |
| ⚖️ **风险规则** | 65 规则 × 7 类 (兼容/pH/浓度/特殊人群/区域/合成生物/FDA) | MixMyRoutine + STSC 2015 + NIFDC |
| 📋 **多地区合规** | CN / EU / US / KR / JP / ASEAN 6 大地区 | 公开监管源 |
| 🛡️ **GB 7916-2026** | 首个强制性国标 (2028-01-01 实施) | NIFDC |
| 🤖 **MCP** | TypeScript SDK stdio + Next.js HTTP | `@modelcontextprotocol/sdk` |

## 🚀 快速开始

### 1. 直接跑 Web (5 分钟)

```bash
git clone https://github.com/AndyZhuang/opencosmetics.git
cd opencosmetics
npm install
npm run dev
# → http://localhost:3000
```

### 2. 用 MCP server (Claude Desktop)

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

### 3. 直接用 DuckDB

```bash
duckdb data/bebd.duckdb
> SELECT * FROM cn_iecic_i WHERE inci_name ILIKE '%RETINOL%' LIMIT 5;
> SELECT * FROM annex_ii_prohibited WHERE LOWER("Chemical name / INN") LIKE '%nitroglycerin%';
```

## 📊 数据规模

| 表 | 记录 | 来源 |
|---|---|---|
| `cosing` | 50,169 | EU CosIng (统一) |
| `cosing_lite` | 28,354 | beauteeru (含 PubChem) |
| `cosing_obf` | 24,127 | OBF 完整版 |
| `annex_ii_prohibited` | 1,431 | EU 禁用 |
| `annex_iii_restricted` | 309 | EU 限用 |
| `annex_iv_colorants` | 153 | EU 着色 |
| `annex_v_preservatives` | 56 | EU 防腐 |
| `annex_vi_uv_filters` | 31 | EU 防晒 |
| **`cn_iecic_i`** | **8,985** | **NMPA 已使用原料目录 Ⅰ** |
| **`cn_iecic_ii`** | **2** | **NMPA 新原料目录 Ⅱ** |
| **`cn_iecic_adjustments`** | **113 段** | **NMPA 2025-06-23 调整说明** |
| `fda_cosmetic_events_*` | 85,511 | FDA Cosmetic Events |
| `companies.json` | 4 | 巨子/锦波/华熙/创健 |
| `rules.json` | 65 规则 | 兼容/pH/浓度/特殊人群/区域 |

**总记录: ~130K+** + 风险规则 + 4 家公司

## 🤖 MCP 工具

| Tool | Args | 说明 |
|---|---|---|
| `ingredient_query` | `q: string` | CN + EU + INCI 跨源查询 |
| `formula_review` | `ingredients: string[], context: {population, region}` | 65 规则审查 |
| `compliance_check` | `ingredient: string, regions: string[]` | 多地区合规扫描 |
| `synbio_company` | `id?: string` | 4 家上市公司元数据 |
| `list_tools` | (隐式) | MCP 标准工具发现 |

**示例 (curl):**

```bash
# 配方风险审查
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "formula_review", "args": {"ingredients": ["RETINOL", "AHA", "VITAMIN_C"], "context": {"population": "pregnant", "region": "CN"}}}'
# → {"summary": "REJECT", "block_count": 3, "warn_count": 5, "findings": [...]}
```

## 📂 项目结构

```
opencosmetics/
├── app/                       # Next.js 15 App Router
│   ├── page.js                # 首页: 5 源 + Killer Finding
│   ├── ingredients/           # 成分库 (50K)
│   ├── regulatory/            # EU 监管
│   ├── fda/                   # FDA 85K 事件
│   ├── china/                 # 🇨🇳 NMPA 8,985 + GB 7916-2026
│   ├── synbio/                # 🧬 巨子/锦波/华熙/创健
│   ├── risk/                  # ⚖️ 65 规则审查
│   └── api/
│       ├── mcp/route.js       # MCP HTTP 入口
│       ├── china/ingredient/  # 中国原料查询
│       ├── synbio/companies/  # 合成生物公司
│       ├── risk/check/        # 风险审查
│       ├── regions/           # 多地区合规
│       └── stats/             # 聚合统计
├── lib/db.js                  # DuckDB singleton + 风险引擎
├── data/
│   ├── bebd.duckdb            # 14 MB — 12 表 (EU+CN+US)
│   ├── companies.json         # 4 合成生物公司
│   └── rules.json             # 65 风险规则
├── mcp-server/                # TypeScript stdio MCP server
│   ├── src/index.ts           # 4 工具
│   ├── package.json
│   └── tsconfig.json
├── scripts/                   # 数据 ingest pipeline
│   ├── 01_download_sources.py
│   └── 02_merge_duckdb.py
└── docs/
    ├── ARCHITECTURE.md
    └── MCP.md
```

## 🔗 链接

- GitHub: https://github.com/AndyZhuang/opencosmetics
- Demo: 部署中
- MCP: TypeScript SDK, stdio + HTTP
- 数据源 5 源: 全部公开 (CC-BY 4.0 / 公开 mirror)

## 📜 License

- **数据**: CC-BY 4.0 (各源归属见 `data/sources.csv`)
- **代码**: MIT
- **文档**: CC-BY 4.0

## 🛣️ Roadmap

- [x] 5 源 EU + 1 源 CN + 1 源 FDA + 4 公司 + 65 规则 (v4.0)
- [ ] MCP server v0.2 (auth + tier)
- [ ] 1,284 禁用 + 109 动植物禁用 + STSC 2015 4 表
- [ ] 韩国 KCID 20,530 / 日本 JCIA 16,152 / 东盟 1,870
- [ ] Pro tier ($99/mo 100K req)
- [ ] Enterprise tier ($999/mo SLA)

## 🙋 维护

- [AndyZhuang](https://github.com/AndyZhuang) + [Mavis AI agent](https://MiniMax.com)
- 一句话反馈: GitHub Issues / Discussion
