import { useMemo, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ChatPanel from "./components/ChatPanel.jsx";
import InspectorPanel from "./components/InspectorPanel.jsx";
import { maskPII, restorePII } from "./utils/piiMasker.js";

const SYSTEM_INSTRUCTION =
  "You are a helpful assistant. You will receive messages where personal information has been replaced with placeholders like [NAME_1], [EMAIL_1], etc. Always keep those placeholders exactly as-is in your response whenever referring to them. Never invent real names, emails, or other personal data — always reuse the placeholders verbatim.";

export default function App() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [messages, setMessages] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [showInspector, setShowInspector] = useState(false);

  const model = useMemo(() => {
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }, [apiKey]);

  const handleSend = async (rawInput) => {
    if (!model) {
      setError("Missing VITE_GEMINI_API_KEY in .env. Restart `npm run dev` after adding it.");
      return;
    }

    setError(null);
    setIsSending(true);

    const { maskedText, piiMap } = maskPII(rawInput);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: rawInput, piiMap },
    ]);

    try {
      const result = await model.generateContent(maskedText);
      const rawResponse = result.response.text();
      const restoredResponse = restorePII(rawResponse, piiMap);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: restoredResponse, piiMap },
      ]);

      setCycles((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          timestamp: Date.now(),
          originalInput: rawInput,
          maskedPrompt: maskedText,
          piiMap,
          rawResponse,
          restoredResponse,
        },
      ]);
    } catch (e) {
      console.error(e);
      setError(`Gemini request failed: ${e?.message || "unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full w-full flex items-stretch justify-center px-4 py-6 md:px-[25vw] md:py-[20vh]">
      <div className="w-full h-full flex flex-col rounded-2xl bg-white/80 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70 overflow-hidden">
        {!apiKey && (
          <div
            role="alert"
            className="bg-amber-50 text-amber-900 text-sm px-6 py-3 border-b border-amber-200/70"
          >
            <strong className="font-semibold">VITE_GEMINI_API_KEY</strong> is not set. Add it to{" "}
            <code className="font-mono text-[12.5px]">.env</code> and restart the dev server.
          </div>
        )}

        <div className="md:hidden flex items-center justify-between px-5 py-3 bg-white/90 border-b border-slate-200/80">
          <span className="text-base font-semibold text-slate-900 tracking-tight">
            PII Masking Demo
          </span>
          <button
            onClick={() => setShowInspector((v) => !v)}
            aria-pressed={showInspector}
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            {showInspector ? "Show chat" : "Show inspector"}
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-h-0">
          <div className={`${showInspector ? "hidden md:flex" : "flex"} flex-col min-h-0`}>
            <ChatPanel
              messages={messages}
              onSend={handleSend}
              isSending={isSending}
              error={error}
            />
          </div>
          <div className={`${showInspector ? "flex" : "hidden md:flex"} flex-col min-h-0`}>
            <InspectorPanel cycles={cycles} />
          </div>
        </div>
      </div>
    </div>
  );
}
