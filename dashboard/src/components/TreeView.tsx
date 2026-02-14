"use client";

import React, { useState } from "react";
import { A2UIComponent, A2UIDocument, resolveDataBinding } from "@/lib/a2ui-types";

interface TreeViewProps {
  doc: A2UIDocument;
}

function TreeNode({
  component,
  componentMap,
  dataModel,
  depth,
}: {
  component: A2UIComponent;
  componentMap: Map<string, A2UIComponent>;
  dataModel: Record<string, unknown>;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const childIds = component.children?.explicitList || [];
  const hasChildren = childIds.length > 0;

  const resolvedText = component.text ? resolveDataBinding(component.text, dataModel) : null;
  const resolvedLabel = component.label ? resolveDataBinding(component.label, dataModel) : null;

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 0",
          cursor: hasChildren ? "pointer" : "default",
          fontFamily: "monospace",
          fontSize: 13,
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <span style={{ width: 14, textAlign: "center", color: "#666" }}>
          {hasChildren ? (expanded ? "▼" : "▶") : "·"}
        </span>
        <span
          style={{
            background: "#e8f0fe",
            color: "#1a73e8",
            padding: "1px 6px",
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {component.component}
        </span>
        <span style={{ color: "#888" }}>#{component.id}</span>
        {resolvedText && (
          <span style={{ color: "#333", fontSize: 12 }}>
            &quot;{resolvedText.length > 30 ? resolvedText.slice(0, 30) + "..." : resolvedText}&quot;
          </span>
        )}
        {resolvedLabel && (
          <span style={{ color: "#333", fontSize: 12 }}>
            label=&quot;{resolvedLabel}&quot;
          </span>
        )}
      </div>
      {expanded &&
        childIds.map((childId) => {
          const child = componentMap.get(childId);
          if (!child) return null;
          return (
            <TreeNode
              key={childId}
              component={child}
              componentMap={componentMap}
              dataModel={dataModel}
              depth={depth + 1}
            />
          );
        })}
    </div>
  );
}

export default function TreeView({ doc }: TreeViewProps) {
  const componentMap = new Map<string, A2UIComponent>();
  for (const comp of doc.components) {
    componentMap.set(comp.id, comp);
  }

  const root = componentMap.get("root");
  if (!root) return <div>No root component</div>;

  return (
    <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 8 }}>
        COMPONENT TREE
      </div>
      <TreeNode component={root} componentMap={componentMap} dataModel={doc.dataModel} depth={0} />
    </div>
  );
}
