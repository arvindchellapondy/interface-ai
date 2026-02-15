"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { A2UIDocument, A2UIMessage, parseA2UIMessages } from "@/lib/a2ui-types";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";
import TreeView from "@/components/TreeView";
import DataModelEditor from "@/components/DataModelEditor";
import TokenInspector from "@/components/TokenInspector";
import ConnectedDevices from "@/components/ConnectedDevices";
import AIAgentPanel from "@/components/AIAgentPanel";
import { useParams } from "next/navigation";

export default function DesignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [doc, setDoc] = useState<A2UIDocument | null>(null);
  const [rawMessages, setRawMessages] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/designs")
      .then((res) => res.json())
      .then((designs) => {
        const design = designs.find((d: { id: string }) => d.id === id);
        if (design) {
          setDoc(parseA2UIMessages(design.messages as A2UIMessage[]));
          setRawMessages(design.messages);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const pushToDevices = useCallback((messages: unknown[]) => {
    fetch("/api/devices/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    }).catch(() => {});
  }, []);

  if (loading) return <div className="py-14 text-center text-slate-400 text-base">Loading...</div>;
  if (!doc) return <div className="py-14 text-center text-slate-400 text-base">Design not found</div>;

  const handleDataModelChange = (newModel: Record<string, unknown>) => {
    setDoc({ ...doc, dataModel: newModel });

    const updateMsg = {
      updateDataModel: {
        surfaceId: doc.surface.surfaceId,
        path: "/",
        value: newModel,
      },
    };

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => pushToDevices([updateMsg]), 300);
  };

  return (
    <div>
      <div className="mb-8">
        <a
          href="/"
          className="text-slate-400 hover:text-indigo-600 text-base transition-colors duration-150 inline-flex items-center gap-1.5"
        >
          <span>&larr;</span> Back to designs
        </a>
        <h1 className="font-heading text-2xl font-bold text-slate-900 mt-2">
          {doc.surface.surfaceId}
        </h1>
        <div className="text-slate-400 text-base mt-1.5">
          {doc.components.length} components · {Object.keys(doc.designTokens).length} tokens
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Preview */}
        <div>
          <div className="panel p-10 flex justify-center items-center min-h-[220px]">
            <A2UIPreviewRenderer doc={doc} />
          </div>

          <div className="mt-5">
            <DataModelEditor dataModel={doc.dataModel} onChange={handleDataModelChange} />
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="flex flex-col gap-5">
          <TreeView doc={doc} />
          <TokenInspector tokens={doc.designTokens} />
          <ConnectedDevices designId={id} messages={rawMessages} />

          <AIAgentPanel
            designId={id}
            messages={rawMessages}
            onApplyUpdate={(updateMsg) => {
              const updated = parseA2UIMessages([
                ...rawMessages,
                updateMsg,
              ] as A2UIMessage[]);
              setDoc(updated);
            }}
          />

          {/* Raw JSON */}
          <div className="panel">
            <div className="section-label">Raw A2UI JSON</div>
            <pre className="text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap text-slate-600 bg-slate-50 rounded-lg p-4 m-0">
              {JSON.stringify(doc.rawMessages, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
