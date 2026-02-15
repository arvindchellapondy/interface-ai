"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearDesignsButton() {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    await fetch("/api/designs", { method: "DELETE" });
    setConfirming(false);
    router.refresh();
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Clear all designs?</span>
        <button onClick={handleClear} className="btn-sm bg-rose-600 text-white hover:bg-rose-700">
          Yes, clear
        </button>
        <button onClick={() => setConfirming(false)} className="btn-sm bg-slate-200 text-slate-600 hover:bg-slate-300">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-sm bg-slate-200 text-slate-600 hover:bg-slate-300">
      Clear All
    </button>
  );
}
