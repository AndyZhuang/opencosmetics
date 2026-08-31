# MCP (Model Context Protocol) 集成

## 架构

```
┌────────────────────────────────────────────────────────────┐
│  Claude Desktop / GPT-4 / Cursor / Continue.dev            │
│                                                            │
│  "分析这个孕妇护肤配方" → tool_call(formula_review, [...]) │
└──────────────────────┬─────────────────────────────────────┘
                       │ stdio / HTTP
                       ▼
┌────────────────────────────────────────────────────────────┐
│  open-cosmetics MCP Server (TypeScript)                    │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ingredient_  │  │  formula_    │  │ compliance_  │     │
│  │ query        │  │  review      │  │ check        │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────┴─────────────────┴─────────────────┴───────┐     │
│  │  DuckDB singleton (lib/db.js)                    │     │
│  │  - 14 MB v4.duckdb (12 表)                       │     │
│  │  - companies.json (4 合成生物)                    │     │
│  │  - rules.json (65 规则 × 7 类)                   │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

## 5 个工具

### 1. `ingredient_query(q: string)`
跨源查询 (CN + EU + INCI):

```json
{
  "tool": "ingredient_query",
  "args": { "q": "RETINOL" }
}
```

返回:
- `cn_iecic_i`: NMPA 已使用 (8,985 检索)
- `cn_iecic_ii`: NMPA 新原料 (2 检索)
- `eu_cosing`: EU CosIng (50K 检索)
- `eu_annex_ii`: EU 禁用 匹配 (1,431 检索)

### 2. `formula_review(ingredients, context)`
65 规则审查 (compatibility / pH / concentration / population):

```json
{
  "tool": "formula_review",
  "args": {
    "ingredients": ["RETINOL", "AHA", "VITAMIN_C", "NIACINAMIDE"],
    "context": { "population": "pregnant", "region": "CN" }
  }
}
```

返回:
- `summary`: "PASS" / "REVIEW" / "REJECT"
- `block_count`: 强规则触发数
- `warn_count`: 警告规则触发数
- `findings[]`: 详细匹配规则

### 3. `compliance_check(ingredient, regions)`
多地区合规扫描 (CN / EU / US / KR / JP / ASEAN):

```json
{
  "tool": "compliance_check",
  "args": {
    "ingredient": "HYDROQUINONE",
    "regions": ["CN", "EU", "US", "JP"]
  }
}
```

返回每个地区状态: 禁用 / 限用 / 准用 / 收录 / 未申报 + 浓度限制

### 4. `synbio_company(id?)`
4 上市公司元数据:

```json
{
  "tool": "synbio_company",
  "args": { "id": "jinbo-bio" }
}
```

返回完整财务 + 产品 + 监管 + 里程碑

### 5. `list_tools` (implicit)
MCP 标准工具发现。

## Transport 模式

### stdio (推荐 - Claude Desktop)

```json
{
  "mcpServers": {
    "opencosmetics": {
      "command": "node",
      "args": ["/path/to/opencosmetics/mcp-server/dist/index.js"]
    }
  }
}
```

### HTTP (用于自定义客户端)

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "ingredient_query", "args": {"q": "RETINOL"}}'
```

## Tier 收费

| Tier | 价格 | req/mo | 工具 | 数据 |
|---|---|---|---|---|
| **Free** | $0 | 1K | 全部 | 公开 DuckDB (CC-BY 4.0) |
| **Pro** | $99/mo | 100K | 全部 + 增量 | + 1,284 禁用 (CC-BY 4.0) |
| **Enterprise** | $999/mo | 无限 | 自定义 + SLA | + 私有 BEBD / 客户数据 |

## 安全

- API key (HMAC) 或 JWT (jose)
- tier 通过 Stripe webhook 升档
- rate limit 100 req/min (Pro), 1000 req/min (Enterprise)

## 监控

- 健康检查: `GET /api/stats`
- 错误率 / 延迟: 自建 + Sentry
- 反馈: GitHub Issues / Discussion
