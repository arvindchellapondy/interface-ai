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
        className={`flex items-center gap-1.5 py-0.5 font-mono text-[13px] ${
          hasChildren ? "cursor-pointer hover:bg-slate-100 rounded px-1 -mx-1" : ""
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <span className="w-3.5 text-center text-slate-400 text-xs">
          {hasChildren ? (expanded ? "▼" : "▶") : "·"}
        </span>
        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-px rounded text-[11px] font-semibold">
          {component.component}
        </span>
        <span className="text-slate-400">#{component.id}</span>
        {resolvedText && (
          <span className="text-slate-700 text-xs">
            &quot;{resolvedText.length > 30 ? resolvedText.slice(0, 30) + "..." : resolvedText}&quot;
          </span>
        )}
        {resolvedLabel && (
          <span className="text-slate-700 text-xs">
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
  if (!root) return <div className="text-slate-400">No root component</div>;

  return (
    <div className="panel">
      <div className="section-label">Component Tree</div>
      <TreeNode component={root} componentMap={componentMap} dataModel={doc.dataModel} depth={0} />
    </div>
  );
}
