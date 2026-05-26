import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";

const SAMPLE_PROMPTS = [
  "Hi, my name is abhi. My email is abhi@acme.com and my phone is 9876543210. Could you draft a short out-of-office reply on my behalf?",
  "Please summarize what I just shared: I'm Jane Smith, my SSN is 123-45-6789, DOB 04/12/1988, and I live at 742 Evergreen Terrace.",
  "I want to dispute a charge of $200 on my card 4111 1111 1111 1111 from Acme Hospital. My contact email is jane@example.org.",
];

export default function ChatPanel({ messages, onSend, isSending, error }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const submit = () => {
    const text = input.trim();
    if (!text || isSending) return;
    onSend(text);
    setInput("");
  };

  const loadSample = () => {
    const next = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setInput(next);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <section
      aria-label="Chat"
      className="flex flex-col h-full min-h-0 border-r border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/60"
    >
      <header className="px-6 py-5 border-b border-slate-200/70">
        
        <h1 className="mt-2 text-[22px] font-semibold text-slate-900 tracking-tight">
          PII-Masked Chat
        </h1>
      </header>

      <div
        ref={scrollRef}
        className="scrollbar-soft flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-0"
        aria-live="polite"
        aria-label="Message history"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 grid place-items-center text-white shadow-lg shadow-indigo-500/30 mb-4">
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
                <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
              </svg>
            </div>
            
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} piiMap={m.piiMap} />
        ))}
        {isSending && (
          <div className="flex justify-start" role="status" aria-label="Assistant is typing">
            <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-500 text-sm shadow-sm flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              <span
                className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3"
          >
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200/70 bg-white/80 backdrop-blur px-5 py-4">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message… "
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            
            <button
              onClick={submit}
              disabled={isSending || !input.trim()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-px transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2"
            >
              Send
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
