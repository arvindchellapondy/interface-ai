import { listDesigns } from "@/lib/design-store";
import { parseA2UIMessages, A2UIMessage } from "@/lib/a2ui-types";
import Link from "next/link";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const designs = listDesigns();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Designs</h1>
        <span style={{ color: "#888", fontSize: 14 }}>{designs.length} design(s)</span>
      </div>

      {designs.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            border: "1px solid #e0e0e0",
          }}
        >
          <p style={{ color: "#888", fontSize: 16 }}>No designs yet.</p>
          <p style={{ color: "#aaa", fontSize: 14 }}>
            Export A2UI JSON from the Figma plugin and save it to the examples/ folder,
            or POST to /api/designs.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280, 1fr))", gap: 16 }}>
          {designs.map((design) => {
            const doc = parseA2UIMessages(design.messages as A2UIMessage[]);
            return (
              <Link
                key={design.id}
                href={`/designs/${design.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 20,
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
                    <A2UIPreviewRenderer doc={doc} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{design.name}</div>
                  <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                    {doc.components.length} components · {Object.keys(doc.designTokens).length} tokens
                  </div>
                  <div style={{ color: "#aaa", fontSize: 11, marginTop: 4 }}>
                    {new Date(design.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
