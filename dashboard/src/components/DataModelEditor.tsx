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
      <div style={{ marginLeft: 20 }}>
        {Object.entries(obj).map(([key, val]) => (
          <div key={key} className="mb-1.5">
            <span className="text-slate-500 font-mono text-sm">{key}: </span>
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
      className="border border-slate-200 rounded-md px-3 py-1 text-sm font-mono w-56
                 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100
                 outline-none transition-all duration-150"
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
    <div className="panel">
      <div className="section-label">Data Model</div>
      {Object.entries(dataModel).map(([key, val]) => (
        <div key={key} className="mb-3">
          <div className="font-mono text-sm font-semibold text-slate-700">{key}</div>
          {renderValue(key, val, handleChange)}
        </div>
      ))}
    </div>
  );
}
