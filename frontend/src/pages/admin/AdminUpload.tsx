import { useState } from "react";

export default function AdminUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "extracting" | "validating" | "complete">("idle");

  function startPipeline(file: File) {
    setSelectedFile(file);
    setStep("uploading");
    setTimeout(() => setStep("extracting"), 1200);
    setTimeout(() => setStep("validating"), 2400);
    setTimeout(() => setStep("complete"), 3600);
  }

  return (
    <div className="portal-container pb-14">
      <div className="border-b-2 border-rule pb-4 mb-6">
        <h1 className="text-xl font-bold text-institutional">Document Ingestion & Indexing Simulation</h1>
        <p className="text-xs text-muted-foreground">Upload budget PDFs, CSVs, or JSON files to simulate automated RAG ingestion.</p>
      </div>

      <div className="max-w-xl border border-rule bg-card p-6 rounded-xs shadow-xs">
        {step === "idle" && (
          <div className="border-2 border-dashed border-institutional/30 p-8 text-center rounded-xs hover:border-saffron transition-colors">
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-bold text-institutional">Drag & Drop Budget Documents Here</p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF, CSV, Excel, and JSON files</p>
            <label className="mt-4 inline-block px-4 py-2 bg-saffron text-institutional-dark font-bold text-xs rounded-xs cursor-pointer hover:bg-saffron/90">
              Browse File
              <input
                type="file"
                className="hidden"
                onChange={e => e.target.files?.[0] && startPipeline(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {step !== "idle" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold text-institutional">
              <span>File: {selectedFile?.name || "Union_Budget_2026_27.pdf"}</span>
              <span className="font-mono">{step.toUpperCase()}</span>
            </div>

            {/* Workflow Progress Steps */}
            <div className="space-y-2 text-xs">
              <div className={`p-2.5 rounded-xs border ${step === "uploading" ? "bg-saffron/20 border-saffron font-bold" : "bg-background border-rule opacity-60"}`}>
                1. Uploading Document to Secure Storage...
              </div>
              <div className={`p-2.5 rounded-xs border ${step === "extracting" ? "bg-saffron/20 border-saffron font-bold" : step === "validating" || step === "complete" ? "bg-positive/10 border-positive" : "bg-background border-rule opacity-60"}`}>
                2. Extracting Tables & Line Items (OCR / PDF Parser)...
              </div>
              <div className={`p-2.5 rounded-xs border ${step === "validating" ? "bg-saffron/20 border-saffron font-bold" : step === "complete" ? "bg-positive/10 border-positive" : "bg-background border-rule opacity-60"}`}>
                3. Validating Historical Anomalies & YoY Deltas...
              </div>
              <div className={`p-2.5 rounded-xs border ${step === "complete" ? "bg-positive/20 border-positive text-positive font-bold" : "bg-background border-rule opacity-60"}`}>
                4. RAG Knowledge Base Indexing Complete ✓
              </div>
            </div>

            {step === "complete" && (
              <button
                onClick={() => { setStep("idle"); setSelectedFile(null); }}
                className="w-full py-2 bg-institutional text-white font-bold text-xs rounded-xs hover:bg-institutional-dark"
              >
                Upload Another Document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
