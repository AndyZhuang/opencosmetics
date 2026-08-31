// /api/synbio/companies — list 4 synbio companies with financials
import { loadCompanies } from "../../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const data = loadCompanies();
  if (!data) {
    return Response.json({ error: "companies.json not loaded" }, { status: 500 });
  }
  if (id) {
    const c = data.companies.find(x => x.id === id);
    if (!c) return Response.json({ error: `company ${id} not found` }, { status: 404 });
    return Response.json({ company: c, market: data.market_sizing });
  }
  // Summary list
  const summary = data.companies.map(c => ({
    id: c.id,
    ticker: c.ticker,
    exchange: c.exchange,
    name_cn: c.name_cn,
    name_en: c.name_en,
    category: c.category,
    ipo_date: c.ipo_date,
    revenue_2024_cny_b: c.financials_2024?.revenue_cny_b,
    revenue_growth_2024: c.financials_2024?.revenue_growth_yoy,
    gross_margin_2024: c.financials_2024?.gross_margin,
    brands: c.brands,
  }));
  return Response.json({
    count: summary.length,
    companies: summary,
    market: data.market_sizing,
    upstream_competitors: data.upstream_competitors,
  });
}
