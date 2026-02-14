"use client";

import React, { useState } from "react";

interface AIAgentPanelProps {
  designId: string;
  messages: unknown[];
  onApplyUpdate: (updateMessage: unknown) => void;
}

export default function AIAgentPanel({ designId, messages, onApplyUpdate }: AIAgentPanelProps) {
  const [userContext, setUserContext] = useState("Returning user named Arvind, interested in technology and design tools");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    result: { updates: Array<{ path: string; value: string }>; reasoning: string };
    updateMessage: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAgent = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, userContext }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Request failed");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Failed to reach AI agent");
    } finally {
      setLoading(false);
    }
  };

  const applyToPreview = () => {
    if (result?.updateMessage) {
      onApplyUpdate(result.updateMessage);
    }
  };

  const pushToDevices = async () => {
    if (!result?.updateMessage) return;

    try {
      const res = await fetch("/api/devices/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [result.updateMessage] }),
      });
      const data = await res.json();
      alert(`Pushed personalized content to ${data.pushed} device(s)`);
    } catch {
      alert("Push failed");
    }
  };

  return (
    <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
        AI AGENT — PERSONALIZE CONTENT
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>
          User Context
        </label>
        <textarea
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            fontSize: 12,
            fontFamily: "monospace",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ddd",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={runAgent}
        disabled={loading || !userContext.trim()}
        style={{
          fontSize: 12,
          padding: "6px 16px",
          borderRadius: 4,
          border: "1px solid #9C27B0",
          background: loading ? "#ccc" : "#9C27B0",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 8,
        }}
      >
        {loading ? "Generating..." : "Personalize with AI"}
      </button>

      {error && (
        <div style={{ fontSize: 12, color: "#f44336", marginBottom: 8 }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
            <strong>Reasoning:</strong> {result.result.reasoning}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
              padding: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>
              PROPOSED UPDATES
            </div>
            {result.result.updates.map((u, i) => (
              <div key={i} style={{ fontSize: 12, fontFamily: "monospace", marginBottom: 2 }}>
                <span style={{ color: "#666" }}>{u.path}</span>
                <span style={{ color: "#333", marginLeft: 8 }}>→ "{u.value}"</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={applyToPreview}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid #2196F3",
                background: "#2196F3",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Apply to Preview
            </button>
            <button
              onClick={pushToDevices}
              style={{
                fontSize: 11,
                padding: "4px 12px",
                borderRadius: 4,
                border: "1px solid #4CAF50",
                background: "#4CAF50",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Push to Devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
