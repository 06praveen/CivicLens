import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";
import { RTI_TEMPLATES } from "@/data/mockData";

export default function RTIAssistant() {
  const { t } = useApp();
  const [selectedTemplateId, setSelectedTemplateId] = useState(RTI_TEMPLATES[0].id);
  const [applicantName, setApplicantName] = useState("Aman Sharma");
  const [applicantAddress, setApplicantAddress] = useState("123, Civil Lines, New Delhi - 110054");
  const [copied, setCopied] = useState(false);

  const activeTemplate = RTI_TEMPLATES.find(tmp => tmp.id === selectedTemplateId) || RTI_TEMPLATES[0];

  const generatedDraft = `To,
The Central Public Information Officer (CPIO),
${activeTemplate.department},
Government of India, New Delhi.

Subject: Request for Information under Section 6(1) of the Right to Information Act, 2005.

Respected Sir/Madam,

I am a citizen of India requesting official records regarding: ${activeTemplate.title}.

Please provide the following specific information:
${activeTemplate.suggestedQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n")}

Applicant Details:
Name: ${applicantName}
Address: ${applicantAddress}
Application Fee: Attached IPO / Online Payment Reference No. RTI-2026-88492.

Date: ${new Date().toLocaleDateString("en-IN")}
Place: New Delhi

Sincerely,
${applicantName}`;

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Citizen Transparency Tool</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("rti_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("rti_subtitle")}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column — Options & Inputs */}
          <div className="space-y-5 border border-rule bg-card p-5 rounded-xs shadow-xs">
            <h2 className="text-base font-bold text-institutional">1. Select Information Topic</h2>

            <div>
              <label className="label-caps text-muted-foreground block mb-1">RTI Topic Template</label>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs font-semibold text-institutional"
              >
                {RTI_TEMPLATES.map(tmp => (
                  <option key={tmp.id} value={tmp.id}>{tmp.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-caps text-muted-foreground block mb-1">Applicant Name</label>
              <input
                type="text"
                value={applicantName}
                onChange={e => setApplicantName(e.target.value)}
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs text-institutional"
              />
            </div>

            <div>
              <label className="label-caps text-muted-foreground block mb-1">Postal Address</label>
              <textarea
                value={applicantAddress}
                onChange={e => setApplicantAddress(e.target.value)}
                rows={2}
                className="w-full rounded-xs border border-rule bg-background p-2 text-xs text-institutional"
              />
            </div>

            <div className="rounded-xs bg-saffron/10 border border-saffron/30 p-3 text-[0.7rem] text-institutional-dark">
              💡 <strong>Note:</strong> This generates a standard RTI request draft grounded in CivicLens budget records. Verify all details before submitting to RTI Online.
            </div>
          </div>

          {/* Right Column — Generated RTI Draft */}
          <div className="md:col-span-2 border border-rule bg-card p-5 rounded-xs shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3 border-b border-rule pb-2">
                <h2 className="text-base font-bold text-institutional">2. Generated RTI Draft</h2>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-4 py-1.5 bg-saffron text-institutional-dark font-bold text-xs rounded-xs hover:bg-saffron/90 transition-colors"
                >
                  {copied ? "Copied to Clipboard! ✓" : "Copy RTI Draft"}
                </button>
              </div>

              <pre className="font-mono text-xs text-foreground bg-background p-4 rounded-xs border border-rule whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {generatedDraft}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-rule flex justify-between items-center text-xs text-muted-foreground">
              <span>Grounding: <strong>Official Budget Records & Section 6(1) RTI Act 2005</strong></span>
              <span className="text-[0.65rem] italic">AI-Generated Draft</span>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
