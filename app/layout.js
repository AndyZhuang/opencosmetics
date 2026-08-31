import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Open Cosmetics — 开放美妆数据",
  description: "5 个公开源拼起来的 50K+ 美妆成分库 + EU 监管标识 + 配方映射",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <nav style={{
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 24px",
          display: "flex",
          gap: "20px",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <Link href="/" style={{ color: "var(--accent)", fontWeight: 600, fontSize: "16px" }}>
            🧪 Open Cosmetics
          </Link>
          <Link href="/ingredients" style={{ color: "var(--text)" }}>成分库 (50K)</Link>
          <Link href="/regulatory" style={{ color: "var(--text)" }}>EU 监管 (1,927)</Link>
          <Link href="/fda" style={{ color: "var(--text)" }}>FDA (85K)</Link>
          <Link href="/china" style={{ color: "var(--orange)" }}>🇨🇳 中国 (8.9K)</Link>
          <Link href="/synbio" style={{ color: "var(--green)" }}>🧬 合成生物</Link>
          <Link href="/risk" style={{ color: "var(--red)" }}>⚖️ 风险审查</Link>
          <Link href="/api/mcp" style={{ color: "var(--accent)" }}>🤖 MCP</Link>
          <Link href="/sources" style={{ color: "var(--text)" }}>数据源</Link>
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "12px" }}>
            快照: 2026-08-25 · MCP v0.1
          </span>
        </nav>
        <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
