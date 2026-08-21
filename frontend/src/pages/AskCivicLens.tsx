import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { askAssistant, transcribeAudio } from "@/api/budgets";
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

/**
 * Safely resolves browser Web Speech API constructor (supports standard & webkit prefix)
 */
function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function AskCivicLens() {
  const { t } = useApp();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // Dual-Engine Voice Recognition States
  const [isListening, setIsListening] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<"native" | "fallback_recording" | "fallback_uploading">("native");
  const [voiceStatusText, setVoiceStatusText] = useState<string>("");
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition & MediaRecorder Context Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const baseInputRef = useRef<string>("");
  const isMountedRef = useRef<boolean>(true);
  const isListeningRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);

  const suggestedQs = [
    t("ask_q1"), t("ask_q2"), t("ask_q3"), t("ask_q4"), t("ask_q5"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Cleanup on component unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isListeningRef.current = false;
      isStartingRef.current = false;

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, []);

  /**
   * FALLBACK ENGINE: Uses MediaRecorder + getUserMedia -> POST /api/voice/transcribe
   */
  async function startFallbackRecorder() {
    // Ensure native recognition is completely stopped
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    setVoiceError(null);
    baseInputRef.current = input;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Release hardware microphone stream immediately
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setIsListening(false);
          isListeningRef.current = false;
          setVoiceEngine("native");
          setVoiceStatusText("");
          setVoiceError("No speech detected. Please try again.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
        if (audioBlob.size < 200) {
          setIsListening(false);
          isListeningRef.current = false;
          setVoiceEngine("native");
          setVoiceStatusText("");
          setVoiceError("No speech detected. Please try again.");
          return;
        }

        setVoiceEngine("fallback_uploading");
        setVoiceStatusText("Transcribing your question...");

        try {
          const res = await transcribeAudio(audioBlob, voiceLang);
          if (res.transcript) {
            console.log("RAW VOICE RESULT (Fallback):", res.transcript);
            const base = baseInputRef.current ? baseInputRef.current.trim() : "";
            const text = res.transcript.trim();
            const newInput = base ? `${base} ${text}` : text;
            console.log("VOICE INPUT SET TO:", newInput);
            setInput(newInput);
          } else if (res.error) {
            setVoiceError(res.error);
          }
        } catch (err: any) {
          console.error("Fallback transcription error:", err);
          setVoiceError("Failed to transcribe audio. Please try typing your question.");
        } finally {
          setIsListening(false);
          isListeningRef.current = false;
          setVoiceEngine("native");
          setVoiceStatusText("");
        }
      };

      recorder.start(250); // Collect audio slices every 250ms
      isListeningRef.current = true;
      setIsListening(true);
      setVoiceEngine("fallback_recording");
      setVoiceStatusText("Recording... Click to stop");
    } catch (err: any) {
      console.error("Microphone getUserMedia error:", err);
      setIsListening(false);
      isListeningRef.current = false;
      setVoiceEngine("native");
      setVoiceStatusText("");

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setVoiceError("Microphone permission was denied. Please allow microphone access in your browser settings and try again.");
      } else {
        setVoiceError("No microphone found or microphone is unavailable. Check your device settings.");
      }
    }
  }

  /**
   * Lazily initializes and returns the single SpeechRecognition instance
   */
  const getOrCreateRecognition = (): SpeechRecognition | null => {
    if (recognitionRef.current) return recognitionRef.current;

    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass) return null;

    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = voiceLang;

      rec.onstart = () => {
        if (!isMountedRef.current) return;
        isListeningRef.current = true;
        isStartingRef.current = false;
        setIsListening(true);
        setVoiceEngine("native");
        setVoiceStatusText("Listening...");
        setVoiceError(null);
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMountedRef.current) return;

        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || "";
          if (result.isFinal) {
            finalTranscript += text + " ";
          } else {
            interimTranscript += text + " ";
          }
        }

        const base = baseInputRef.current ? baseInputRef.current.trim() : "";
        const recognized = (finalTranscript + interimTranscript).trim();

        if (recognized) {
          console.log("RAW VOICE RESULT (Native):", recognized);
          const newInput = base ? `${base} ${recognized}` : recognized;
          console.log("VOICE INPUT SET TO:", newInput);
          setInput(newInput);
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Native SpeechRecognition error:", event.error, event);
        if (!isMountedRef.current) return;

        isListeningRef.current = false;
        isStartingRef.current = false;

        // Auto-switch to MediaRecorder backend fallback on network/service failure
        if (event.error === "network" || event.error === "service-not-allowed" || event.error === "audio-capture") {
          console.warn("Native SpeechRecognition failed with network/service error. Switching to MediaRecorder fallback pipeline...");
          try { rec.abort(); } catch (e) {}
          startFallbackRecorder();
          return;
        }

        setIsListening(false);
        setVoiceEngine("native");
        setVoiceStatusText("");

        switch (event.error) {
          case "not-allowed":
            setVoiceError("Microphone permission was denied. Please allow microphone access in your browser settings and try again.");
            break;
          case "no-speech":
            setVoiceError("No speech was detected. Please try again.");
            break;
          case "language-not-supported":
          case "language-unavailable":
            setVoiceError("The selected voice language is currently unavailable.");
            break;
          case "aborted":
            break;
          default:
            setVoiceError(`Speech recognition failed (${event.error}). Please try typing your question.`);
            break;
        }
      };

      rec.onend = () => {
        if (!isMountedRef.current) return;
        if (voiceEngine === "native") {
          isListeningRef.current = false;
          isStartingRef.current = false;
          setIsListening(false);
          setVoiceStatusText("");
        }
      };

      recognitionRef.current = rec;
      return rec;
    } catch (err) {
      console.error("Failed to construct SpeechRecognition instance:", err);
      return null;
    }
  };

  /**
   * Main Microphone Toggle Action (Native Web Speech -> MediaRecorder Fallback)
   */
  const toggleVoiceInput = () => {
    // If currently recording in MediaRecorder fallback mode -> stop recording & transcribe
    if (voiceEngine === "fallback_recording") {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      return;
    }

    // If uploading fallback audio -> ignore duplicate clicks
    if (voiceEngine === "fallback_uploading") {
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass) {
      // Browser lacks Web Speech API -> use MediaRecorder Fallback directly
      startFallbackRecorder();
      return;
    }

    const rec = getOrCreateRecognition();
    if (!rec) {
      startFallbackRecorder();
      return;
    }

    // If currently listening in native mode -> stop listening
    if (isListeningRef.current || isStartingRef.current) {
      try { rec.stop(); } catch (e) { try { rec.abort(); } catch (e2) {} }
      isListeningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      setVoiceEngine("native");
      setVoiceStatusText("");
      return;
    }

    // Start native recognition
    setVoiceError(null);
    baseInputRef.current = input;
    isStartingRef.current = true;
    rec.lang = voiceLang;

    try {
      rec.start();
    } catch (err: any) {
      console.error("Native recognition start error:", err);
      isStartingRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);

      if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
        try { rec.stop(); } catch (e) {}
      } else {
        // Fallback to MediaRecorder audio recording pipeline
        startFallbackRecorder();
      }
    }
  };

  const handleLanguageChange = (newLang: "en-IN" | "hi-IN") => {
    setVoiceLang(newLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
  };

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    console.log("MESSAGE BEING SENT TO CHAT:", text);

    // Stop voice recognition or recording if active when submitting
    if (isListeningRef.current) {
      if (voiceEngine === "fallback_recording" && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      } else if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      isListeningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
    }

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
                onChange={e => handleLanguageChange(e.target.value as "en-IN" | "hi-IN")}
                className="w-full text-xs font-bold border border-rule bg-background p-2 rounded-xs focus:outline-none cursor-pointer"
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
                        {/* Transparency Source Indicator Badge */}
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
              <p className="mt-2 text-xs text-destructive font-semibold flex items-center gap-1">
                <span>⚠️</span> {voiceError}
              </p>
            )}

            {/* Input Form with Microphone Button */}
            <form onSubmit={handleSubmit} className="mt-3 flex gap-2 items-center">
              {/* Dual-Engine Voice Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={voiceEngine === "fallback_uploading"}
                title={isListening ? (voiceStatusText || "Click to stop") : "Speak your question"}
                aria-label={isListening ? (voiceStatusText || "Click to stop") : "Speak your question"}
                className={`p-2.5 rounded-xs border transition-all flex items-center justify-center shrink-0 cursor-pointer font-bold text-xs ${
                  voiceEngine === "fallback_uploading"
                    ? "bg-muted text-muted-foreground border-rule cursor-wait"
                    : isListening
                    ? "bg-destructive text-white border-destructive animate-pulse shadow-md"
                    : "bg-background hover:bg-institutional/10 text-institutional border-rule"
                }`}
              >
                {voiceEngine === "fallback_uploading" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-ping" />
                    Processing...
                  </span>
                ) : isListening ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                    {voiceStatusText || "Listening..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    🎤 Speak
                  </span>
                )}
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
