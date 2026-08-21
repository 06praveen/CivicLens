import { Routes, Route } from "react-router-dom";

// Public Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Protected Citizen Features
import BudgetAtAGlance from "@/pages/BudgetAtAGlance";
import ExploreBudget from "@/pages/ExploreBudget";
import Departments from "@/pages/Departments";
import AIInsights from "@/pages/AIInsights";
import AskCivicLens from "@/pages/AskCivicLens";
import Compare from "@/pages/Compare";
import Reports from "@/pages/Reports";
import Glossary from "@/pages/Glossary";
import Alerts from "@/pages/Alerts";
import RTIAssistant from "@/pages/RTIAssistant";
import Feedback from "@/pages/Feedback";

// Admin Suite Pages
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUpload from "@/pages/admin/AdminUpload";
import AdminActivity from "@/pages/admin/AdminActivity";

// Route Protection Guards
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* PUBLIC ROUTES (No Login Required) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED CITIZEN ROUTES (Requires Citizen Authentication) */}
        <Route path="/budget-at-a-glance" element={<ProtectedRoute><BudgetAtAGlance /></ProtectedRoute>} />
        <Route path="/explore-budget" element={<ProtectedRoute><ExploreBudget /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
        <Route path="/ai-insights" element={<ProtectedRoute><AIInsights /></ProtectedRoute>} />
        <Route path="/ask-civiclens" element={<ProtectedRoute><AskCivicLens /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="/glossary" element={<ProtectedRoute><Glossary /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/rti-assistant" element={<ProtectedRoute><RTIAssistant /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />

        {/* PROTECTED ADMIN ROUTES (Requires Admin Role) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="agent-activity" element={<AdminActivity />} />
        </Route>

        {/* Catch-all → Home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
