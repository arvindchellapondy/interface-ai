"use client";

import React from "react";
import { DesignToken } from "@/lib/a2ui-types";

interface TokenInspectorProps {
  tokens: Record<string, DesignToken>;
}

export default function TokenInspector({ tokens }: TokenInspectorProps) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return null;

  return (
    <div className="panel">
      <div className="section-label">Design Tokens ({entries.length})</div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-xs font-mono">
        {entries.map(([name, token]) => (
          <React.Fragment key={name}>
            <span className="text-slate-700">{name}</span>
            <span className="text-slate-400">{token.collection}</span>
            <span className="flex items-center gap-1">
              {token.value.startsWith("#") && (
                <span
                  className="w-3 h-3 rounded-sm border border-slate-200 inline-block"
                  style={{ backgroundColor: token.value }}
                />
              )}
              <span className="text-slate-500">{token.value}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
