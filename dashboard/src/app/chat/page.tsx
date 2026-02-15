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

      const doc = parseA2UIMessages(design.messages as A2UIMessage[]);
      const nestedOverlay = pathsToNestedDataModel(tileAction.dataModel);
      const mergedDataModel = mergeDataModel(doc.dataModel, nestedOverlay);
      const updatedDoc = { ...doc, dataModel: mergedDataModel };

      setSelectedDoc(updatedDoc);
      setSelectedDesignId(tileAction.tileId);

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
        const displayText = data.message.replace(/```json\s*\n?[\s\S]*?\n?\s*```/g, "").trim();
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: displayText || data.message,
          tileAction: data.tileAction,
        };
        setMessages([...updatedMessages, assistantMessage]);

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 h-[calc(100vh-100px)]">
      {/* Left: Chat */}
      <div className="flex flex-col min-h-0">
        <h1 className="font-heading text-xl font-bold text-slate-900 mb-4">AI Tile Assistant</h1>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-card p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-slate-400 text-center py-12">
              <div className="text-3xl mb-3 opacity-50">?</div>
              <div className="text-sm">Ask me to show a tile or personalize content</div>
              <div className="text-xs text-slate-300 mt-2">
                Try: &quot;Show me a weather tile for NYC&quot; or &quot;Show a greeting for the morning&quot;
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] ${msg.role === "user" ? "self-end" : "self-start animate-fade-in"}`}
            >
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.tileAction && (
                <div className="mt-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-[11px] text-emerald-700 border border-emerald-100">
                  Selected: <strong>{msg.tileAction.tileId}</strong> &mdash; {msg.tileAction.reasoning}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="self-start text-slate-400 text-[13px] px-4 py-2">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about tiles..."
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-full border border-slate-200 text-sm outline-none
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                       transition-all duration-150 disabled:bg-slate-50 placeholder:text-slate-300"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold
                       hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150
                       disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            Send
          </button>
        </div>
      </div>

      {/* Right: Preview Panel */}
      <div className="flex flex-col gap-4">
        {/* Tile Preview */}
        <div className="panel flex flex-col items-center min-h-[200px]">
          <div className="section-label self-start">Tile Preview</div>
          {selectedDoc ? (
            <>
              <A2UIPreviewRenderer doc={selectedDoc} />
              <div className="text-[11px] text-slate-400 mt-3">{selectedDesignId}</div>
            </>
          ) : (
            <div className="text-slate-300 py-10 text-center">
              <div className="text-2xl mb-2 opacity-50">No tile selected</div>
              <div className="text-xs">Chat with the AI to select a tile</div>
            </div>
          )}
        </div>

        {/* Connected Devices */}
        <div className="panel">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${deviceCount > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="font-semibold text-slate-500">
              {deviceCount} device{deviceCount !== 1 ? "s" : ""} connected
            </span>
          </div>
          {deviceCount > 0 && (
            <div className="text-[11px] text-slate-400 mt-1">
              Tiles auto-push to devices when AI selects them
            </div>
          )}
          {pushStatus && (
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">{pushStatus}</div>
          )}
        </div>

        {/* Available Tiles */}
        <div className="panel">
          <div className="section-label">Tile Catalog ({designs.length})</div>
          <div className="flex flex-col gap-1.5">
            {designs.map((d) => (
              <div
                key={d.id}
                className={`px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${
                  selectedDesignId === d.id
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-800"
                    : "bg-slate-50 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                <span className="font-semibold">{d.name}</span>
                <span className="text-slate-400 ml-2">{d.id}</span>
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
 * e.g. {"/aubrey_tx/text": "NYC"} -> {"aubrey_tx": {"text": "NYC"}}
 * Also handles already-nested format: {"aubrey_tx": {"text": "NYC"}} passes through.
 */
function pathsToNestedDataModel(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(input)) {
    if (key.startsWith("/")) {
      const parts = key.split("/").filter(Boolean);
      let current: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) current[parts[i]] = {};
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = val;
    } else {
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
