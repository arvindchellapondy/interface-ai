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

    const udm = (result.updateMessage as Record<string, unknown>).updateDataModel as Record<string, unknown>;
    const dataModel = udm?.dataModel as Record<string, unknown> | undefined;

    try {
      const res = await fetch("/api/devices/push-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, dataModel: dataModel || {} }),
      });
      const data = await res.json();
      alert(`Pushed personalized content to ${data.pushed} device(s)`);
    } catch {
      alert("Push failed");
    }
  };

  return (
    <div className="panel">
      <div className="section-label">AI Agent — Personalize Content</div>

      <div className="mb-4">
        <label className="text-xs text-slate-400 block mb-1.5">User Context</label>
        <textarea
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          rows={3}
          className="w-full text-sm font-mono p-3 rounded-lg border border-slate-200
                     resize-y focus:border-violet-400 focus:ring-1 focus:ring-violet-100
                     outline-none transition-all duration-150"
        />
      </div>

      <button
        onClick={runAgent}
        disabled={loading || !userContext.trim()}
        className="btn-sm btn-violet mb-4"
      >
        {loading ? "Generating..." : "Personalize with AI"}
      </button>

      {error && <div className="text-sm text-rose-500 mb-3">{error}</div>}

      {result && (
        <div className="mt-3 animate-fade-in">
          <div className="text-xs text-slate-500 mb-3">
            <strong className="text-slate-600">Reasoning:</strong> {result.result.reasoning}
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Proposed Updates
            </div>
            {result.result.updates.map((u, i) => (
              <div key={i} className="text-sm font-mono mb-1">
                <span className="text-slate-400">{u.path}</span>
                <span className="text-slate-700 ml-2">{"\u2192"} &quot;{u.value}&quot;</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={applyToPreview} className="btn-sm btn-sky">
              Apply to Preview
            </button>
            <button onClick={pushToDevices} className="btn-sm btn-success">
              Push to Devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
