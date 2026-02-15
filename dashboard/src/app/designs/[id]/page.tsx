"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { A2UIDocument, A2UIMessage, parseA2UIMessages } from "@/lib/a2ui-types";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";
import TreeView from "@/components/TreeView";
import DataModelEditor from "@/components/DataModelEditor";
import TokenInspector from "@/components/TokenInspector";
import ConnectedDevices from "@/components/ConnectedDevices";
import AIAgentPanel from "@/components/AIAgentPanel";
import { useParams } from "next/navigation";

export default function DesignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [doc, setDoc] = useState<A2UIDocument | null>(null);
  const [rawMessages, setRawMessages] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/designs")
      .then((res) => res.json())
      .then((designs) => {
        const design = designs.find((d: { id: string }) => d.id === id);
        if (design) {
          setDoc(parseA2UIMessages(design.messages as A2UIMessage[]));
          setRawMessages(design.messages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const pushToDevices = useCallback((messages: unknown[]) => {
    fetch("/api/devices/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }).catch(() => {});
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  if (!doc) return <div style={{ padding: 40, textAlign: "center" }}>Design not found</div>;

  const handleDataModelChange = (newModel: Record<string, unknown>) => {
    // Update local preview
    setDoc({ ...doc, dataModel: newModel });

    // Send only an incremental updateDataModel to connected devices (lightweight, no SVG)
    const updateMsg = {
      updateDataModel: {
        surfaceId: doc.surface.surfaceId,
        path: "/",
        value: newModel,
      },
    };

    // Debounce auto-push to connected devices (300ms)
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => pushToDevices([updateMsg]), 300);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/" style={{ color: "#666", textDecoration: "none", fontSize: 13 }}>
          ← Back to designs
        </a>
        <h1 style={{ margin: "8px 0 0", fontSize: 22 }}>{doc.surface.surfaceId}</h1>
        <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          {doc.components.length} components · {Object.keys(doc.designTokens).length} tokens
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Left: Preview */}
        <div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              border: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <A2UIPreviewRenderer doc={doc} />
          </div>

          <div style={{ marginTop: 16 }}>
            <DataModelEditor dataModel={doc.dataModel} onChange={handleDataModelChange} />
          </div>
        </div>

        {/* Right: Inspector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <TreeView doc={doc} />
          <TokenInspector tokens={doc.designTokens} />

          <ConnectedDevices designId={id} messages={rawMessages} />

          <AIAgentPanel
            designId={id}
            messages={rawMessages}
            onApplyUpdate={(updateMsg) => {
              // Apply AI-generated updateDataModel to the preview
              const updated = parseA2UIMessages([
                ...rawMessages,
                updateMsg,
              ] as A2UIMessage[]);
              setDoc(updated);
            }}
          />

          {/* Raw JSON */}
          <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
              RAW A2UI JSON
            </div>
            <pre
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                overflow: "auto",
                maxHeight: 300,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(doc.rawMessages, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
