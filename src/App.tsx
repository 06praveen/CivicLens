import { Routes, Route } from "react-router-dom";

import Home            from "@/pages/Home";
import BudgetAtAGlance from "@/pages/BudgetAtAGlance";
import ExploreBudget   from "@/pages/ExploreBudget";
import Departments     from "@/pages/Departments";
import AIInsights      from "@/pages/AIInsights";
import AskCivicLens    from "@/pages/AskCivicLens";

// New Citizen Tools
import Compare         from "@/pages/Compare";
import Glossary        from "@/pages/Glossary";
import Alerts          from "@/pages/Alerts";
import RTIAssistant    from "@/pages/RTIAssistant";
import Feedback        from "@/pages/Feedback";

// Admin Suite
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard  from "@/pages/admin/AdminDashboard";
import AdminUpload     from "@/pages/admin/AdminUpload";
import AdminActivity   from "@/pages/admin/AdminActivity";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/budget-at-a-glance" element={<BudgetAtAGlance />} />
        <Route path="/explore-budget"     element={<ExploreBudget />} />
        <Route path="/departments"        element={<Departments />} />
        <Route path="/ai-insights"        element={<AIInsights />} />
        <Route path="/ask-civiclens"      element={<AskCivicLens />} />

        {/* New Citizen Routes */}
        <Route path="/compare"            element={<Compare />} />
        <Route path="/glossary"           element={<Glossary />} />
        <Route path="/alerts"             element={<Alerts />} />
        <Route path="/rti-assistant"      element={<RTIAssistant />} />
        <Route path="/feedback text"      element={<Feedback />} />
        <Route path="/feedback"          element={<Feedback />} />

        {/* Admin Suite Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="agent-activity" element={<AdminActivity />} />
        </Route>

        {/* Catch-all → Home */}
        <Route path="*"                   element={<Home />} />
      </Routes>
    </div>
  );
}
