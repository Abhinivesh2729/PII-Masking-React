import { segmentText } from "../utils/piiMasker.js";

export default function MessageBubble({ role, content, piiMap }) {
  const isUser = role === "user";
  const segments = piiMap
    ? segmentText(content, { piiMap, mode: isUser ? "pii" : "restored" })
    : [{ text: content, kind: "plain" }];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] flex flex-col gap-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-2.5 whitespace-pre-wrap leading-relaxed text-[14.5px] ${
            isUser
              ? "rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
              : "rounded-2xl rounded-bl-md bg-white text-slate-900 border border-slate-200/80 shadow-sm"
          }`}
        >
          {segments.map((seg, i) =>
            seg.kind === "plain" ? (
              <span key={i}>{seg.text}</span>
            ) : (
              <span
                key={i}
                className={
                  seg.kind === "pii"
                    ? isUser
                      ? "bg-white/25 text-white rounded px-1 py-0.5 font-semibold"
                      : "bg-rose-100 text-rose-800 rounded px-1 py-0.5 font-semibold"
                    : "bg-emerald-100 text-emerald-800 rounded px-1 py-0.5 font-semibold"
                }
              >
                {seg.text}
              </span>
            )
          )}
        </div>
        {isUser && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 px-1 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-emerald-500"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Sent to LLM with PII masked
          </span>
        )}
      </div>
    </div>
  );
}
