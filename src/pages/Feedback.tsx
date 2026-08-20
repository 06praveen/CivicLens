import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";

export default function Feedback() {
  const { t } = useApp();
  const [budgetItem, setBudgetItem] = useState("");
  const [category, setCategory] = useState("Data Discrepancy");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Public Engagement</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("feedback_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("feedback_subtitle")}</p>
        </div>

        <div className="mt-6 max-w-2xl border border-rule bg-card p-6 rounded-xs shadow-xs">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-bold text-institutional">Thank you!</h2>
              <p className="text-sm text-muted-foreground">
                Your feedback has been recorded by CivicLens. Our team and automated verification agent will examine the budget record.
              </p>
              <button
                type="button"
                onClick={() => { setSubmitted(false); setComment(""); setBudgetItem(""); }}
                className="mt-4 px-4 py-2 bg-institutional text-white font-bold text-xs rounded-xs hover:bg-institutional-dark"
              >
                Submit Another Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-caps text-muted-foreground block mb-1">Budget Item / Scheme (Optional)</label>
                <input
                  type="text"
                  value={budgetItem}
                  onChange={e => setBudgetItem(e.target.value)}
                  placeholder="e.g. Samagra Shiksha, National Health Mission..."
                  className="w-full rounded-xs border border-rule bg-background p-2.5 text-xs text-institutional"
                />
              </div>

              <div>
                <label className="label-caps text-muted-foreground block mb-1">Feedback Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full rounded-xs border border-rule bg-background p-2.5 text-xs font-semibold text-institutional"
                >
                  <option value="Data Discrepancy">Data Discrepancy / Error</option>
                  <option value="Question">Question About Allocation</option>
                  <option value="Suggestion">Portal Feature Suggestion</option>
                  <option value="General">General Feedback</option>
                </select>
              </div>

              <div>
                <label className="label-caps text-muted-foreground block mb-1">Your Comment or Question *</label>
                <textarea
                  required
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={5}
                  placeholder="Please describe your comment or question in detail..."
                  className="w-full rounded-xs border border-rule bg-background p-2.5 text-xs text-institutional"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-saffron text-institutional-dark font-bold text-xs tracking-wider rounded-xs hover:bg-saffron/90 transition-colors uppercase"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
