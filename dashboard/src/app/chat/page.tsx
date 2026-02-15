"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { A2UIDocument, A2UIMessage, parseA2UIMessages } from "@/lib/a2ui-types";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  widgetAction?: {
    action: string;
    widgetId: string;
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

  const applyWidgetAction = useCallback(
    (widgetAction: ChatMessage["widgetAction"]) => {
      if (!widgetAction || widgetAction.action !== "show_widget") return;

      const design = designs.find((d) => d.id === widgetAction.widgetId);
      if (!design) return;

      const doc = parseA2UIMessages(design.messages as A2UIMessage[]);
      const nestedOverlay = pathsToNestedDataModel(widgetAction.dataModel);
      const mergedDataModel = mergeDataModel(doc.dataModel, nestedOverlay);
      const updatedDoc = { ...doc, dataModel: mergedDataModel };

      setSelectedDoc(updatedDoc);
      setSelectedDesignId(widgetAction.widgetId);

      pushDesignToDevices(widgetAction.widgetId, mergedDataModel);
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
          widgetAction: data.widgetAction,
        };
        setMessages([...updatedMessages, assistantMessage]);

        if (data.widgetAction) {
          applyWidgetAction(data.widgetAction);
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 h-[calc(100vh-120px)]">
      {/* Left: Chat */}
      <div className="flex flex-col min-h-0">
        <h1 className="font-heading text-2xl font-bold text-slate-900 mb-5">AI Widget Assistant</h1>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-card p-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-slate-400 text-center py-14">
              <div className="text-4xl mb-4 opacity-50">?</div>
              <div className="text-base">Ask me to show a widget or personalize content</div>
              <div className="text-sm text-slate-300 mt-2">
                Try: &quot;Show me a weather widget for NYC&quot; or &quot;Show a greeting for the morning&quot;
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] ${msg.role === "user" ? "self-end" : "self-start animate-fade-in"}`}
            >
              <div
                className={`px-5 py-3 text-base leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.widgetAction && (
                <div className="mt-2 px-4 py-2 bg-emerald-50 rounded-lg text-xs text-emerald-700 border border-emerald-100">
                  Selected: <strong>{msg.widgetAction.widgetId}</strong> &mdash; {msg.widgetAction.reasoning}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="self-start text-slate-400 text-sm px-5 py-2.5">
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3 mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about widgets..."
            disabled={loading}
            className="flex-1 px-6 py-3.5 rounded-full border border-slate-200 text-base outline-none
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                       transition-all duration-150 disabled:bg-slate-50 placeholder:text-slate-300"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-8 py-3.5 rounded-full bg-indigo-600 text-white text-base font-semibold
                       hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150
                       disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            Send
          </button>
        </div>
      </div>

      {/* Right: Preview Panel */}
      <div className="flex flex-col gap-5">
        {/* Widget Preview */}
        <div className="panel flex flex-col items-center min-h-[220px]">
          <div className="section-label self-start">Widget Preview</div>
          {selectedDoc ? (
            <>
              <A2UIPreviewRenderer doc={selectedDoc} />
              <div className="text-xs text-slate-400 mt-3">{selectedDesignId}</div>
            </>
          ) : (
            <div className="text-slate-300 py-12 text-center">
              <div className="text-3xl mb-2 opacity-50">No widget selected</div>
              <div className="text-sm">Chat with the AI to select a widget</div>
            </div>
          )}
        </div>

        {/* Connected Devices */}
        <div className="panel">
          <div className="flex items-center gap-2.5 text-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${deviceCount > 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
            <span className="font-semibold text-slate-500">
              {deviceCount} device{deviceCount !== 1 ? "s" : ""} connected
            </span>
          </div>
          {deviceCount > 0 && (
            <div className="text-xs text-slate-400 mt-1.5">
              Widgets auto-push to devices when AI selects them
            </div>
          )}
          {pushStatus && (
            <div className="text-xs text-emerald-600 mt-1.5 font-semibold">{pushStatus}</div>
          )}
        </div>

        {/* Available Widgets */}
        <div className="panel">
          <div className="section-label">Widget Catalog ({designs.length})</div>
          <div className="flex flex-col gap-2">
            {designs.map((d) => (
              <div
                key={d.id}
                className={`px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
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
