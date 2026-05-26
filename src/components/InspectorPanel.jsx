import { useState } from "react";
import { segmentText } from "../utils/piiMasker.js";

function HighlightedText({ text, piiMap, mode }) {
  const segments = segmentText(text, { piiMap, mode });
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-slate-800 m-0">
      {segments.map((seg, i) => {
        if (seg.kind === "plain") return <span key={i}>{seg.text}</span>;
        const cls =
          seg.kind === "pii"
            ? "bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-semibold"
            : seg.kind === "placeholder"
            ? "bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold"
            : "bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold";
        return (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        );
      })}
    </pre>
  );
}

function Stage({ label, children, accent = "slate" }) {
  const accentMap = {
    slate: "before:bg-slate-300",
    rose: "before:bg-rose-400",
    amber: "before:bg-amber-400",
    indigo: "before:bg-indigo-400",
    emerald: "before:bg-emerald-400",
  };
  return (
    <div className="relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <div
        className={`relative pl-3 mb-2 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full ${accentMap[accent]}`}
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

function CycleCard({ cycle, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const piiEntries = Object.entries(cycle.piiMap);
  const panelId = `cycle-${cycle.id}-panel`;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/80 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-inset"
      >
        <div className="flex items-center gap-3 text-left min-w-0">
          <span className="inline-flex items-center justify-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 rounded-full h-6 min-w-6 px-2 shrink-0">
            #{cycle.id}
          </span>
          <span className="text-[13.5px] text-slate-700 truncate">
            {cycle.originalInput.slice(0, 70)}
            {cycle.originalInput.length > 70 ? "…" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {piiEntries.length} PII
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
          <Stage label="Original Input" accent="rose">
            <HighlightedText text={cycle.originalInput} piiMap={cycle.piiMap} mode="pii" />
          </Stage>

          <Stage label="Masked Prompt Sent to LLM" accent="amber">
            <HighlightedText text={cycle.maskedPrompt} mode="placeholder" />
          </Stage>

          <Stage label="PII Map" accent="indigo">
            {piiEntries.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No PII detected.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-left text-[10.5px] uppercase tracking-[0.12em]">
                    <th className="font-semibold pb-2 pr-4">Placeholder</th>
                    <th className="font-semibold pb-2">Real Value</th>
                  </tr>
                </thead>
                <tbody>
                  {piiEntries.map(([k, v]) => (
                    <tr key={k} className="border-t border-slate-100">
                      <td className="py-1.5 pr-4 font-mono align-top">
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                          {k}
                        </span>
                      </td>
                      <td className="py-1.5 align-top font-mono">
                        <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-semibold">
                          {v}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Stage>

          <Stage label="Raw LLM Response" accent="amber">
            <HighlightedText text={cycle.rawResponse} mode="placeholder" />
          </Stage>

          <Stage label="Restored Response" accent="emerald">
            <HighlightedText
              text={cycle.restoredResponse}
              piiMap={cycle.piiMap}
              mode="restored"
            />
          </Stage>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="text-[11px] text-slate-600 font-medium">{label}</span>
    </span>
  );
}

export default function InspectorPanel({ cycles }) {
  return (
    <aside
      aria-label="PII masking inspector"
      className="flex flex-col h-full min-h-0 bg-gradient-to-b from-slate-50/60 via-white to-white"
    >
      <header className="px-6 py-5 border-b border-slate-200/70">
        
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <LegendDot color="bg-rose-400" label="raw PII" />
          <LegendDot color="bg-amber-400" label="placeholder" />
          <LegendDot color="bg-emerald-400" label="restored" />
        </div>
      </header>

      <div className="scrollbar-soft flex-1 overflow-y-auto p-6 space-y-3 min-h-0">
        {cycles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 grid place-items-center text-slate-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              Send a message to see the masking pipeline in action.
            </p>
          </div>
        ) : (
          [...cycles]
            .reverse()
            .map((c, i) => <CycleCard key={c.id} cycle={c} defaultOpen={i === 0} />)
        )}
      </div>
    </aside>
  );
}
