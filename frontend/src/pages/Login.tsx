import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fromState = location.state as any;
  const fromLocation = fromState?.from;
  const from = typeof fromLocation === "string" ? fromLocation : fromLocation?.pathname ? `${fromLocation.pathname}${fromLocation.search || ""}` : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMsg("Please enter your username/email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await login(usernameOrEmail, password);
      navigate(from, { state: { openReportModal: fromState?.openReportModal }, replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setUsernameOrEmail("citizen.test@civiclens.gov.in");
    setPassword("SecurePassword123!");
  };

  return (
    <PageLayout>
      <div className="portal-container py-12 flex items-center justify-center min-h-[calc(100vh-250px)]">
        <div className="w-full max-w-md bg-card border border-rule shadow-lg rounded-sm p-8 space-y-6 relative overflow-hidden">
          {/* Saffron Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-saffron" />

          {/* Header Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-institutional/10 border border-institutional/20 mb-1">
              <svg className="w-6 h-6 text-institutional" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-institutional">Citizen Login</h1>
            <p className="text-xs text-muted-foreground">Sign in to access personalized transparency features & saved reports</p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xs text-destructive text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Authentication Error
              </p>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="citizen@gov.in or username"
                required
                className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-institutional text-white font-bold text-xs uppercase tracking-widest rounded-xs hover:bg-institutional/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-institutional transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? "Authenticating..." : "Sign In to CivicLens"}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="pt-2 border-t border-rule flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Testing backend auth?</span>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="font-bold text-gov-blue hover:text-saffron transition-colors"
            >
              Auto-fill Demo Citizen
            </button>
          </div>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-bold text-institutional hover:underline">
              Create a Citizen Account
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
