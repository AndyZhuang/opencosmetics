import { query } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const stats = await query(`
    SELECT
      (SELECT COUNT(*) FROM cosing_lite) AS beauteeru,
      (SELECT COUNT(*) FROM cosing_walkowskis) AS walkowskis,
      (SELECT COUNT(*) FROM cosing_obf) AS obf_full,
      (SELECT COUNT(*) FROM annex_ii_prohibited) AS prohibited,
      (SELECT COUNT(*) FROM annex_iii_restricted) AS restricted,
      (SELECT COUNT(*) FROM annex_iv_colorants) AS colorants,
      (SELECT COUNT(*) FROM annex_v_preservatives) AS preservatives,
      (SELECT COUNT(*) FROM annex_vi_uv_filters) AS uv_filters,
      (SELECT COUNT(*) FROM incidb_brands) AS incidb_brands,
      (SELECT COUNT(*) FROM incidb_ingredients) AS incidb_ing,
      (SELECT COUNT(*) FROM incidb_products) AS incidb_prod,
      (SELECT COUNT(*) FROM incidb_product_ingredients) AS incidb_pi
  `);
  const s = stats[0];

  return (
    <div>
      <h1>🗺️ 数据源</h1>
      <p style={{ color: "var(--muted)" }}>所有 5 个数据源都是公开/robots.txt 允许/jsDelivr 镜像,零法律风险</p>

      <h2>🟢 已落库 (5 源, 80K+ records)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>源</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>表</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>记录数</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>字段</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>walkowskis</td><td>cosing_walkowskis</td><td>{Number(s.walkowskis).toLocaleString()}</td><td>INCI + CAS + EC + Function + Restriction + INN + PhEur</td></tr>
          <tr><td>beauteeru</td><td>cosing_lite</td><td>{Number(s.beauteeru).toLocaleString()}</td><td>INCI + CAS + EC + PubChem CID</td></tr>
          <tr><td>OBF CosIng full</td><td>cosing_obf</td><td>{Number(s.obf_full).toLocaleString()}</td><td>INCI + Function + Restriction (全 EU 字段)</td></tr>
          <tr><td>OBF Annex II</td><td>annex_ii_prohibited</td><td>{Number(s.prohibited).toLocaleString()}</td><td>EU 禁用清单</td></tr>
          <tr><td>OBF Annex III</td><td>annex_iii_restricted</td><td>{Number(s.restricted).toLocaleString()}</td><td>EU 限用清单</td></tr>
          <tr><td>OBF Annex IV</td><td>annex_iv_colorants</td><td>{Number(s.colorants).toLocaleString()}</td><td>EU 着色剂</td></tr>
          <tr><td>OBF Annex V</td><td>annex_v_preservatives</td><td>{Number(s.preservatives).toLocaleString()}</td><td>EU 防腐剂</td></tr>
          <tr><td>OBF Annex VI</td><td>annex_vi_uv_filters</td><td>{Number(s.uv_filters).toLocaleString()}</td><td>EU 防晒剂</td></tr>
          <tr><td>INCIDB</td><td>incidb_*</td><td>9 brands + {Number(s.incidb_ing)} ing + {Number(s.incidb_prod)} prod + {Number(s.incidb_pi)} mappings</td><td>INCI + 17 source join + comedogenic + FDA warning</td></tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>🟡 待办</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>源</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>期望</th>
            <th style={{ textAlign: "left", padding: "8px 12px" }}>阻塞原因</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>INCIDB 全量</td><td>43K 成分 + 19K 商品 + 320K 映射</td><td>公开仅 130, 余下在付费墙后</td></tr>
          <tr><td>NMPA 备案</td><td>4M+ 中国数据</td><td>DNS 拦, 需 Playwright + IP 轮换</td></tr>
          <tr><td>FDA VCRP</td><td>2M 美国商品</td><td>未启动</td></tr>
          <tr><td>Wikidata SPARQL</td><td>结构化标签 + 跨语言</td><td>SSL 拦截</td></tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>🛡️ 法律边界</h2>
      <p>所有数据源:</p>
      <ul>
        <li>EU CosIng: <a href="https://ec.europa.eu/growth/tools-databases/cosing/" target="_blank">欧盟公开数据库</a> (Regulation 1223/2009)</li>
        <li>OBF Annexes: <a href="https://github.com/openfoodfacts/openbeautyfacts" target="_blank">Open Beauty Facts</a> 公开镜像</li>
        <li>INCIDB sample: <a href="https://github.com/INCIDB/cosmetics-skincare-inci-database" target="_blank">GitHub</a> 公开</li>
        <li>BEBD sitemap: <a href="https://bebd.bevol.com/sitemap.xml" target="_blank">bebd.bevol.com/sitemap.xml</a> (robots.txt 真空允许)</li>
      </ul>
    </div>
  );
}
