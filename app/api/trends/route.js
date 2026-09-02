// /api/trends — Industry trends feed
import { listTrends, getTrend, getTrendsMeta, getTrendActivesSummary } from "../../../lib/trends";
import { getLangFromCookies } from "../../../lib/i18n";
import { cookies } from "next/headers";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || await getLangFromCookies(cookies());
  const id = searchParams.get("id");
  const summary = searchParams.get("summary") === "1";

  if (id) {
    const t = getTrend(id);
    if (!t) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ trend: t, lang });
  }

  if (summary) {
    return Response.json({
      actives_summary: getTrendActivesSummary(),
      meta: getTrendsMeta(),
      lang,
    });
  }

  return Response.json({
    count: listTrends().length,
    trends: listTrends(),
    meta: getTrendsMeta(),
    description: lang === "en"
      ? "Industry trends feed: ingredient growth signals, K-beauty/C-beauty launches, biotech actives. Scaffold for future automated collection."
      : "行业趋势 feed: 成分增长信号 / K-beauty/C-beauty 新品 / 生物科技活性物。未来自动采集的脚手架。",
    lang,
  });
}
