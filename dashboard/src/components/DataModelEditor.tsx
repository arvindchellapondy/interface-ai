"use client";

import React from "react";

interface DataModelEditorProps {
  dataModel: Record<string, unknown>;
  onChange: (newModel: Record<string, unknown>) => void;
}

function renderValue(
  path: string,
  value: unknown,
  onChange: (path: string, newValue: string) => void
): React.ReactNode {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return (
      <div style={{ marginLeft: 16 }}>
        {Object.entries(obj).map(([key, val]) => (
          <div key={key} style={{ marginBottom: 4 }}>
            <span style={{ color: "#666", fontFamily: "monospace", fontSize: 12 }}>{key}: </span>
            {renderValue(`${path}/${key}`, val, onChange)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(path, e.target.value)}
      style={{
        border: "1px solid #ddd",
        borderRadius: 4,
        padding: "2px 6px",
        fontSize: 12,
        fontFamily: "monospace",
        width: 200,
      }}
    />
  );
}

export default function DataModelEditor({ dataModel, onChange }: DataModelEditorProps) {
  const handleChange = (path: string, newValue: string) => {
    const parts = path.split("/").filter(Boolean);
    const newModel = JSON.parse(JSON.stringify(dataModel));
    let current: Record<string, unknown> = newModel;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = newValue;
    onChange(newModel);
  };

  return (
    <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
        DATA MODEL
      </div>
      {Object.entries(dataModel).map(([key, val]) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>{key}</div>
          {renderValue(key, val, handleChange)}
        </div>
      ))}
    </div>
  );
}
