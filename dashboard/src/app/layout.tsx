import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interface AI Dashboard",
  description: "A2UI design management and preview",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: "#f5f5f5",
          color: "#333",
        }}
      >
        <nav
          style={{
            background: "#fff",
            borderBottom: "1px solid #e0e0e0",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 16 }}>Interface AI</span>
          <a href="/" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>
            Dashboard
          </a>
        </nav>
        <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
