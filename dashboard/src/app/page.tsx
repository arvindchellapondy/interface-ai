import { listDesigns } from "@/lib/design-store";
import { parseA2UIMessages, A2UIMessage } from "@/lib/a2ui-types";
import Link from "next/link";
import A2UIPreviewRenderer from "@/components/A2UIPreviewRenderer";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const designs = listDesigns();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Designs</h1>
        <span className="text-sm text-slate-400">{designs.length} design(s)</span>
      </div>

      {designs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-card">
          <p className="text-slate-400 text-base">No designs yet.</p>
          <p className="text-slate-400/70 text-sm mt-2">
            Export A2UI JSON from the Figma plugin and save it to the examples/ folder,
            or POST to /api/designs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designs.map((design) => {
            const doc = parseA2UIMessages(design.messages as A2UIMessage[]);
            return (
              <Link
                key={design.id}
                href={`/designs/${design.id}`}
                className="no-underline text-inherit"
              >
                <div className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer">
                  <div className="mb-4 flex justify-center">
                    <A2UIPreviewRenderer doc={doc} />
                  </div>
                  <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors duration-150">
                    {design.name}
                  </div>
                  <div className="text-slate-400 text-xs mt-1">
                    {doc.components.length} components · {Object.keys(doc.designTokens).length} tokens
                  </div>
                  <div className="text-slate-300 text-[11px] mt-1">
                    {new Date(design.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
