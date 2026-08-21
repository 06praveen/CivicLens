import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { askAssistant } from "@/api/budgets";
import type { AssistantResponse, AssistantSource, AssistantOption } from "@/api/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: AssistantSource[];
  intent?: string;
  confidence?: string;
  evidenceStatus?: string;
  data?: Record<string, any> | null;
  requiresClarification?: boolean;
  options?: AssistantOption[];
  sourceIndicator?: "verified_civiclens_data" | "budget_explanation" | "general_ai";
  sourceIndicatorLabel?: string;
  timestamp: Date;
}

function formatCrore(amt: number | null | undefined): string {
  if (amt == null || isNaN(amt) || amt === 0) return "₹ 0 Cr";
  return `₹ ${Math.round(amt).toLocaleString("en-IN")} Cr`;
}

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-institutional mt-2">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ")) {
      return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
    }
    if (line.trim() === "") return <br key={i} />;
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

function InlineTrendChart({ years }: { years: { financial_year: string; amount: number }[] }) {
  if (!years || years.length === 0) return null;
  const maxVal = Math.max(...years.map(y => y.amount), 1);
  const chartH = 100;

  return (
    <div className="mt-3 bg-background border border-rule p-3 rounded-xs overflow-x-auto">
      <p className="label-caps text-saffron mb-2 text-[0.65rem]">Year-wise Budget Trend Graph</p>
      <svg viewBox={`0 0 ${years.length * 90 + 30} ${chartH + 30}`} className="w-full">
        {years.map((d, i) => {
          const barH = (d.amount / maxVal) * chartH;
          const x = 30 + i * 90;
          return (
            <g key={d.financial_year}>
              <rect x={x} y={chartH - barH} width={36} height={Math.max(barH, 3)} fill="#1e3a8a" rx="2" />
              <text x={x + 18} y={chartH + 14} fontSize="9" fontWeight="bold" textAnchor="middle" fill="#475569">
                {d.financial_year}
              </text>
              <text x={x + 18} y={chartH - barH - 4} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1e3a8a" className="font-mono">
                {formatCrore(d.amount)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const WELCOME: Message = {
  role: "assistant",
  content: "Namaste! I am the **CivicLens Assistant**. I can help you explore Union Budget data (FY 2018–19 to FY 2024–25), compare allocations, explain government spending, or answer general knowledge questions.\n\nAsk me anything in plain language — for example:\n- *'How much was allocated to education?'*\n- *'Compare education spending across available years'*\n- *'What is capital expenditure?'*\n- *'What is machine learning?'*",
  sources: [],
  sourceIndicator: "verified_civiclens_data",
  sourceIndicatorLabel: "✓ Verified CivicLens Data",
  timestamp: new Date(),
};

export default function AskCivicLens() {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestedQs = [
    t("ask_q1"), t("ask_q2"), t("ask_q3"), t("ask_q4"), t("ask_q5"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Web Speech API Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setVoiceError("Microphone permission denied.");
        } else if (event.error === "no-speech") {
          setVoiceError("No speech detected.");
        } else {
          setVoiceError("Speech recognition failed. Try typing your question.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      recognitionRef.current = null;
    }
  }, [voiceLang]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      setVoiceError("Voice input is not supported by this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setVoiceError(null);
      try {
        recognitionRef.current.lang = voiceLang;
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
      }
    }
  };

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res: AssistantResponse = await askAssistant({
        question: text,
        top_k: 5,
        session_id: sessionId
      });

      if (res.session_id) {
        setSessionId(res.session_id);
      }

      const botMsg: Message = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        intent: res.intent,
        confidence: res.confidence,
        evidenceStatus: res.evidence_status,
        data: res.data || undefined,
        requiresClarification: res.requires_clarification,
        options: res.options || undefined,
        sourceIndicator: res.source_indicator || "verified_civiclens_data",
        sourceIndicatorLabel: res.source_indicator_label || "✓ Verified CivicLens Data",
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error("FastAPI Assistant API Error:", err);
      const botMsg: Message = {
        role: "assistant",
        content: `Error: ${err.message || "Failed to retrieve answer from CivicLens backend. Please try again."}`,
        sources: [],
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <PageLayout>
      <div className="portal-container pb-10">
        {/* Page header */}
        <div className="border-b-4 border-saffron py-5 flex items-center justify-between">
          <div>
            <p className="label-caps text-saffron">Hybrid Intelligent Assistant & Voice AI</p>
            <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">{t("ask_title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("ask_subtitle")}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col lg:flex-row gap-5" style={{ minHeight: "60vh" }}>
          {/* Sidebar — suggested questions & settings */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            <div className="rounded-xs border border-rule bg-card p-4 shadow-xs">
              <h2 className="label-caps text-saffron mb-3">{t("ask_suggested")}</h2>
              <ul className="space-y-2">
                {suggestedQs.map((q, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs text-foreground/85 hover:text-institutional hover:bg-institutional/5 px-2.5 py-2 rounded-xs border border-rule transition-colors leading-snug cursor-pointer font-medium"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Voice Input Language Selector */}
            <div className="rounded-xs border border-rule bg-card p-4 shadow-xs">
              <h3 className="label-caps text-muted-foreground mb-2">Voice Input Language</h3>
              <select
                value={voiceLang}
                onChange={e => setVoiceLang(e.target.value as "en-IN" | "hi-IN")}
                className="w-full text-xs font-bold border border-rule bg-background p-2 rounded-xs focus:outline-none"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
              </select>
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 rounded-xs border border-rule bg-card shadow-xs overflow-y-auto p-4 space-y-4" style={{ maxHeight: "62vh", minHeight: "360px" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-sm px-4 py-3 shadow-xs text-sm ${
                    msg.role === "user"
                      ? "bg-institutional text-white rounded-br-none font-medium"
                      : "bg-white border border-rule text-foreground rounded-bl-none"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="space-y-2">
                        {/* Transparency Source Indicator Badge (Requirement 4) */}
                        {msg.sourceIndicator && (
                          <div className="flex items-center justify-between border-b border-rule pb-1.5 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase ${
                              msg.sourceIndicator === "verified_civiclens_data"
                                ? "bg-positive/10 text-positive border border-positive/30"
                                : msg.sourceIndicator === "budget_explanation"
                                ? "bg-saffron/15 text-saffron-dark border border-saffron/30"
                                : "bg-muted text-muted-foreground border border-rule"
                            }`}>
                              {msg.sourceIndicatorLabel || "✓ Verified CivicLens Data"}
                            </span>
                            {msg.intent && <span className="font-mono text-[0.65rem] text-muted-foreground">{msg.intent}</span>}
                          </div>
                        )}

                        {formatContent(msg.content)}

                        {/* Structured Multi-Year Table */}
                        {msg.data && msg.data.years && msg.data.years.length > 0 && (
                          <div className="mt-3 overflow-x-auto border border-rule rounded-xs">
                            <table className="min-w-full text-xs divide-y divide-rule bg-background">
                              <thead className="bg-institutional/5">
                                <tr>
                                  <th className="px-3 py-1.5 text-left label-caps text-muted-foreground">Financial Year</th>
                                  <th className="px-3 py-1.5 text-left label-caps text-muted-foreground">Amount Stage</th>
                                  <th className="px-3 py-1.5 text-right label-caps text-muted-foreground">Allocation (₹ Cr)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rule font-mono">
                                {msg.data.years.map((y: any, yi: number) => (
                                  <tr key={yi}>
                                    <td className="px-3 py-1.5 font-bold text-institutional">{y.financial_year}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground text-[0.7rem]">{y.amount_stage}</td>
                                    <td className="px-3 py-1.5 text-right font-bold text-foreground">{formatCrore(y.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Inline Trend Graph */}
                        {msg.data && msg.data.years && msg.data.years.length > 0 && (
                          <InlineTrendChart years={msg.data.years} />
                        )}

                        {/* Included Entities List Box */}
                        {msg.data && msg.data.included_entities && msg.data.included_entities.length > 0 && (
                          <div className="mt-3 bg-institutional/5 border border-rule p-2.5 rounded-xs text-[0.7rem]">
                            <p className="font-bold text-institutional label-caps mb-1">Entities Included in Calculation:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                              {msg.data.included_entities.map((ent: string, ei: number) => (
                                <li key={ei}>{ent}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Sources Transparency */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-rule">
                            <p className="label-caps text-muted-foreground mb-1.5">Official Evidence Citations</p>
                            <div className="space-y-1">
                              {msg.sources.map((src, si) => (
                                <div key={si} className="text-[0.68rem] bg-institutional/5 border border-rule p-1.5 rounded-xs flex items-center justify-between font-mono">
                                  {src.source_type === "government_document" ? (
                                    <span>📄 PDF Document: <strong>{src.document_name}</strong> {src.page_number ? `(Page ${src.page_number})` : ""}</span>
                                  ) : (
                                    <span>📊 PostgreSQL Official Budget Record ({src.statement || "Statement 3"})</span>
                                  )}
                                </div>
                              ))}
                            </div>
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
                    <p className="text-xs text-muted-foreground font-semibold">CivicLens Assistant is processing your question...</p>
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

            {voiceError && (
              <p className="mt-2 text-xs text-destructive font-semibold">⚠️ {voiceError}</p>
            )}

            {/* Input Form with Microphone Button */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2 items-center">
              {/* Voice Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title="Speak your question"
                aria-label="Speak your question"
                className={`p-2.5 rounded-xs border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                  isListening
                    ? "bg-destructive text-white border-destructive animate-pulse"
                    : "bg-background hover:bg-institutional/10 text-institutional border-rule"
                }`}
              >
                {isListening ? "🔴 Listening..." : "🎤 Speak"}
              </button>

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
                className="rounded-xs bg-institutional px-5 py-2.5 text-xs font-bold tracking-[0.08em] text-white hover:bg-institutional-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
