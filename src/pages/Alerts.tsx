import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PageLayout } from "@/components/PageLayout";

const TOPICS = [
  { id: "health", label: "Ministry of Health & Family Welfare", active: true },
  { id: "edu", label: "Ministry of Education", active: true },
  { id: "rural", label: "Ministry of Rural Development", active: true },
  { id: "rail", label: "Ministry of Railways", active: false },
  { id: "agri", label: "Ministry of Agriculture", active: false },
];

export default function Alerts() {
  const { t } = useApp();
  const [subscriptions, setSubscriptions] = useState(TOPICS);
  const [notificationState, setNotificationState] = useState("Preferences saved locally.");

  function toggleTopic(id: string) {
    setSubscriptions(prev =>
      prev.map(item => (item.id === id ? { ...item, active: !item.active } : item))
    );
    setNotificationState("Preferences updated!");
  }

  return (
    <PageLayout>
      <div className="portal-container pb-14">
        {/* Header */}
        <div className="border-b-4 border-saffron py-6">
          <p className="label-caps text-saffron">Notifications & Subscriptions</p>
          <h1 className="mt-1 text-2xl font-black tracking-[0.06em] text-institutional sm:text-3xl">
            {t("alerts_title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("alerts_subtitle")}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column — Follow Topics */}
          <div className="border border-rule bg-card p-5 rounded-xs shadow-xs">
            <h2 className="text-base font-bold text-institutional mb-3">Subscribe to Departments</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Select key spending areas to follow. Simulated alerts will appear when spending changes are detected.
            </p>

            <div className="space-y-2">
              {subscriptions.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-rule rounded-xs bg-background"
                >
                  <span className="text-xs font-semibold text-institutional">{item.label}</span>
                  <button
                    onClick={() => toggleTopic(item.id)}
                    className={`px-3 py-1 text-[0.68rem] font-bold rounded-xs transition-colors ${
                      item.active
                        ? "bg-saffron text-institutional-dark"
                        : "bg-rule text-muted-foreground hover:bg-institutional/20"
                    }`}
                  >
                    {item.active ? "Following ✓" : "+ Follow"}
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[0.65rem] text-muted-foreground italic">{notificationState}</p>
          </div>

          {/* Right Column — Simulated Activity Notifications Feed */}
          <div className="md:col-span-2 border border-rule bg-card p-5 rounded-xs shadow-xs">
            <h2 className="text-base font-bold text-institutional mb-3">Simulated Spending Alerts Feed</h2>

            <div className="space-y-3">
              <div className="border-l-4 border-positive bg-institutional/5 p-4 rounded-xs border-y border-r border-rule">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-institutional">Ministry of Health & Family Welfare</span>
                  <span className="text-muted-foreground">Today, 10:45 AM</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-positive">+16.8% Allocation Increase</p>
                <p className="mt-1 text-xs text-foreground/80">
                  National Health Mission outlay increased by ₹4,800 Cr to expand urban primary health centres.
                </p>
              </div>

              <div className="border-l-4 border-saffron bg-saffron/5 p-4 rounded-xs border-y border-r border-saffron/20">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-institutional">Ministry of Education</span>
                  <span className="text-muted-foreground">Yesterday</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-saffron">PM POSHAN Midday Meal Re-allocation</p>
                <p className="mt-1 text-xs text-foreground/80">
                  Revised Estimate shows 14.3% increase for nutritional supplementary meals in primary schools.
                </p>
              </div>

              <div className="border-l-4 border-negative bg-negative/5 p-4 rounded-xs border-y border-r border-rule">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-institutional">Ministry of Rural Development</span>
                  <span className="text-muted-foreground">3 days ago</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-negative">-18.4% Spending Reduction</p>
                <p className="mt-1 text-xs text-foreground/80">
                  Unspent balance carried forward from previous fiscal year led to reduced fresh allocation.
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              * Note: Notifications are simulated on frontend state for demonstration.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
