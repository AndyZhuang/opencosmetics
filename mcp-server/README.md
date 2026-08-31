# open-cosmetics MCP Server

Model Context Protocol (MCP) server exposing **5 tools** for the open-cosmetics dataset:

| Tool | Description |
|---|---|
| `ingredient_query(q)` | Cross-reference ingredient across CN (IECIC) + EU (CosIng + Annex II) |
| `formula_review(ingredients, context)` | 65-rule compatibility/pH/concentration/population check |
| `compliance_check(ingredient, regions)` | Multi-region regulatory status (CN/EU/US/KR/JP/ASEAN) |
| `synbio_company(id?)` | 4 listed synthetic biology cosmetic companies (巨子/锦波/华熙/创健) |
| `list_tools` (implicit) | Standard MCP tool discovery |

## Install & Build

```bash
cd mcp-server
npm install
npm run build
```

## Run (stdio)

```bash
npm start
# or
node dist/index.js
```

## Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

## Example Usage (HTTP fallback)

The Next.js app exposes the same tools over HTTP at `/api/mcp`:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool": "formula_review", "args": {"ingredients": ["RETINOL", "AHA", "VITAMIN_C"], "context": {"population": "pregnant", "region": "CN"}}}'
```

```json
{
  "summary": "REJECT",
  "block_count": 3,
  "warn_count": 5,
  "findings": [...]
}
```

## Data Sources

- `bebd.duckdb` (14 MB) — 50K EU CosIng + 1,927 EU Annexes + 130K BEBD sitemap + 8,965 CN IECIC I + 2 CN IECIC II + FDA 85K events
- `rules.json` (12 KB) — 65 rules across 7 categories
- `companies.json` (8 KB) — 4 synbio companies with full financials

## License

CC-BY 4.0 — open source, attribution required
