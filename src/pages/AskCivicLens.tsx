import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { getDemoResponse } from "@/data/insightsData";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

function formatContent(text: string) {
  // Very simple markdown → JSX for bold and tables
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-institutional mt-2">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ")) {
      return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
    }
    if (line.startsWith("|")) {
      const cells = line.split("|").filter(Boolean);
      if (line.includes("---")) return null;
      return (
        <tr key={i} className="border-b border-rule">
          {cells.map((c, ci) => (
            <td key={ci} className={`px-2 py-1 text-xs ${ci === 0 ? "font-semibold text-institutional" : ""}`}>{c.trim()}</td>
          ))}
        </tr>
      );
    }
    if (line.trim() === "") return <br key={i} />;
    // Replace **bold** inline
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm leading-relaxed">
        {parts.map((part, pi) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={pi} className="font-bold text-institutional">{part.slice(2, -2)}</strong>
            : part
        )}
      </p>
    );
  });
}

const WELCOME: Message = {
  role: "assistant",
  content: "Hello! I'm **CivicLens AI**, your guide to the Government of India's Union Budget 2026–27.\n\nI can help you understand budget allocations, departmental spending, year-over-year changes, and key fiscal indicators.\n\nWhat would you like to explore today?",
  sources: [],
  timestamp: new Date(),
};

export default function AskCivicLens() {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedQs = [
    t("ask_q1"), t("ask_q2"), t("ask_q3"), t("ask_q4"), t("ask_q5"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate network delay (replace with real API call)
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    const resp = getDemoResponse(text);
    const botMsg: Message = {
      role: "assistant",
      content: resp.content,
      sources: resp.sources,
      timestamp: new Date(),
    };
    setIsTyping(false);
    setMessages(prev => [...prev, botMsg]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <PageLayout>
      <div className="portal-container pb-10">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-5">
          <p className="label-caps text-saffron">{t("ask_powered")}</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("ask_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("ask_subtitle")}</p>
        </div>

        <div className="mt-5 flex flex-col lg:flex-row gap-5" style={{ minHeight: "60vh" }}>
          {/* Sidebar — suggested questions */}
          <aside className="lg:w-64 shrink-0">
            <div className="rounded-xs border border-rule bg-card p-4 shadow-xs">
              <h2 className="label-caps text-saffron mb-3">{t("ask_suggested")}</h2>
              <ul className="space-y-2">
                {suggestedQs.map((q, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs text-foreground/85 hover:text-institutional hover:bg-institutional/5 px-2 py-2 rounded-xs border border-rule transition-colors leading-snug"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pipeline info */}
            <div className="mt-4 rounded-xs border border-rule bg-card p-4 shadow-xs">
              <h3 className="label-caps text-muted-foreground mb-3">How it works</h3>
              {["Your Question", "CivicLens AI", "Budget Documents", "Evidence-backed Answer"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 mb-2">
                  <span className="h-5 w-5 rounded-full bg-institutional text-white text-[0.6rem] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="text-xs text-foreground/80">{step}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 rounded-xs border border-rule bg-card shadow-xs overflow-y-auto p-4 space-y-4" style={{ maxHeight: "62vh", minHeight: "360px" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-sm px-4 py-3 shadow-xs text-sm ${
                    msg.role === "user"
                      ? "bg-institutional text-white rounded-br-none"
                      : "bg-white border border-rule text-foreground rounded-bl-none"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="space-y-1">
                        {formatContent(msg.content)}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-rule">
                            <p className="label-caps text-muted-foreground mb-1">{t("ask_source")}s</p>
                            {msg.sources.map((src, si) => (
                              <p key={si} className="text-[0.67rem] text-institutional font-semibold">📄 {src}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <p className={`text-[0.6rem] mt-1 ${msg.role === "user" ? "text-white/60 text-right" : "text-muted-foreground"}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-rule rounded-sm rounded-bl-none px-4 py-3 shadow-xs">
                    <p className="text-xs text-muted-foreground">{t("ask_typing")}</p>
                    <div className="flex gap-1 mt-1.5">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="h-2 w-2 rounded-full bg-institutional animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t("ask_input_placeholder")}
                aria-label={t("ask_input_placeholder")}
                className="flex-1 rounded-xs border border-rule bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-institutional"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="rounded-xs bg-institutional px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-institutional-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("ask_send")}
              </button>
            </form>
            <p className="mt-2 text-[0.68rem] text-muted-foreground">{t("ask_disclaimer")}</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
