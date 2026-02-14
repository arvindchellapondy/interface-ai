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
    <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
        DESIGN TOKENS ({entries.length})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "4px 12px", fontSize: 12, fontFamily: "monospace" }}>
        {entries.map(([name, token]) => (
          <React.Fragment key={name}>
            <span style={{ color: "#333" }}>{name}</span>
            <span style={{ color: "#666" }}>{token.collection}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {token.value.startsWith("#") && (
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: token.value,
                    border: "1px solid #ccc",
                    display: "inline-block",
                  }}
                />
              )}
              {token.value}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
