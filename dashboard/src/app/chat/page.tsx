"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { A2UIDocument, A2UIMessage, parseA2UIMessages } from "@/lib/a2ui-types";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  tileAction?: {
    action: string;
    tileId: string;
    dataModel: Record<string, unknown>;
    reasoning: string;
  };
}

interface DesignData {
  id: string;
  name: string;
  messages: unknown[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState<DesignData[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<A2UIDocument | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load designs catalog
  useEffect(() => {
    fetch("/api/designs")
      .then((res) => res.json())
      .then((data) => setDesigns(data))
      .catch(() => {});
  }, []);

  // Poll connected devices
  useEffect(() => {
    const poll = () =>
      fetch("/api/devices")
        .then((res) => res.json())
        .then((data) => setDeviceCount(data.length))
        .catch(() => {});
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushDesignToDevices = useCallback(
    (designId: string, dataModel: Record<string, unknown>) => {
      // Server-side push: reads design from disk and sends full messages
      // (createSurface + updateComponents + personalized updateDataModel)
      // This avoids client-side SVG serialization issues
      fetch("/api/devices/push-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, dataModel }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pushed > 0) {
            setPushStatus(`Pushed to ${data.pushed} device(s)`);
            setTimeout(() => setPushStatus(null), 3000);
          }
        })
        .catch(() => {});
    },
    []
  );

  const applyTileAction = useCallback(
    (tileAction: ChatMessage["tileAction"]) => {
      if (!tileAction || tileAction.action !== "show_tile") return;

      const design = designs.find((d) => d.id === tileAction.tileId);
      if (!design) return;

      // Parse the design and apply personalized data model
      const doc = parseA2UIMessages(design.messages as A2UIMessage[]);
      // Convert AI's flat path format to nested data model
      const nestedOverlay = pathsToNestedDataModel(tileAction.dataModel);
      const mergedDataModel = mergeDataModel(doc.dataModel, nestedOverlay);
      const updatedDoc = { ...doc, dataModel: mergedDataModel };

      setSelectedDoc(updatedDoc);
      setSelectedDesignId(tileAction.tileId);

      // Push full design with personalized data to all connected devices
      pushDesignToDevices(tileAction.tileId, mergedDataModel);
    },
    [designs, pushDesignToDevices]
  );

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        // Strip the JSON block from displayed message
        const displayText = data.message.replace(/```json\s*\n?[\s\S]*?\n?\s*```/g, "").trim();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: displayText || data.message,
          tileAction: data.tileAction,
        };
        setMessages([...updatedMessages, assistantMessage]);

        // Apply tile action if present
        if (data.tileAction) {
          applyTileAction(data.tileAction);
        }
      }
    } catch {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Failed to connect to AI service." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24, height: "calc(100vh - 100px)" }}>
      {/* Left: Chat */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 22 }}>AI Tile Assistant</h1>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#999", textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>?</div>
              <div style={{ fontSize: 14 }}>Ask me to show a tile or personalize content</div>
              <div style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>
                Try: &quot;Show me a weather tile for NYC&quot; or &quot;Show a greeting for the morning&quot;
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              <div
                style={{
                  background: msg.role === "user" ? "#007aff" : "#f0f0f0",
                  color: msg.role === "user" ? "#fff" : "#333",
                  padding: "10px 14px",
                  borderRadius: 16,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                  fontSize: 14,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
              {msg.tileAction && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    background: "#e8f5e9",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "#2e7d32",
                  }}
                >
                  Selected: <strong>{msg.tileAction.tileId}</strong> — {msg.tileAction.reasoning}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: "#999", fontSize: 13, padding: "8px 14px" }}>
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about tiles..."
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 24,
              border: "1px solid #ddd",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: 24,
              border: "none",
              background: loading || !input.trim() ? "#ccc" : "#007aff",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* Right: Preview Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tile Preview */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 12, alignSelf: "flex-start" }}>
            TILE PREVIEW
          </div>
          {selectedDoc ? (
            <>
              <A2UIPreviewRenderer doc={selectedDoc} />
              <div style={{ fontSize: 11, color: "#999", marginTop: 12 }}>
                {selectedDesignId}
              </div>
            </>
          ) : (
            <div style={{ color: "#ccc", padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>No tile selected</div>
              <div style={{ fontSize: 12 }}>Chat with the AI to select a tile</div>
            </div>
          )}
        </div>

        {/* Connected Devices */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: deviceCount > 0 ? "#4CAF50" : "#ccc",
              }}
            />
            <span style={{ fontWeight: 600, color: "#666" }}>
              {deviceCount} device{deviceCount !== 1 ? "s" : ""} connected
            </span>
          </div>
          {deviceCount > 0 && (
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              Tiles auto-push to devices when AI selects them
            </div>
          )}
          {pushStatus && (
            <div style={{ fontSize: 11, color: "#4CAF50", marginTop: 4, fontWeight: 600 }}>
              {pushStatus}
            </div>
          )}
        </div>

        {/* Available Tiles */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
            TILE CATALOG ({designs.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {designs.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: "6px 10px",
                  background: selectedDesignId === d.id ? "#e3f2fd" : "#fafafa",
                  borderRadius: 6,
                  fontSize: 12,
                  border: selectedDesignId === d.id ? "1px solid #90caf9" : "1px solid #eee",
                }}
              >
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <span style={{ color: "#999", marginLeft: 8 }}>{d.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert AI's flat path format to nested data model.
 * e.g. {"/aubrey_tx/text": "NYC"} → {"aubrey_tx": {"text": "NYC"}}
 * Also handles already-nested format: {"aubrey_tx": {"text": "NYC"}} passes through.
 */
function pathsToNestedDataModel(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    if (key.startsWith("/")) {
      // Flat path format: "/aubrey_tx/text" → nested
      const parts = key.split("/").filter(Boolean);
      let current: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) current[parts[i]] = {};
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = val;
    } else {
      // Already nested format
      result[key] = val;
    }
  }
  return result;
}

/** Deep merge AI's data model over the design's default data model */
function mergeDataModel(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(base));
  for (const [key, val] of Object.entries(overlay)) {
    if (typeof val === "object" && val !== null && !Array.isArray(val) && typeof result[key] === "object") {
      result[key] = mergeDataModel(
        result[key] as Record<string, unknown>,
        val as Record<string, unknown>
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}
