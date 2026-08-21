import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await register(email, username, password, fullName);
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Register error:", err);
      setErrorMsg(err.message || "Failed to register. Please check input values.");
      setLoading(false);
    }
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-institutional">Create Citizen Account</h1>
            <p className="text-xs text-muted-foreground">Register to save budget preferences & participate in platform transparency</p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xs text-destructive text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Registration Error
              </p>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@gov.in"
                required
                className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ramesh_kumar"
                required
                className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
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

            <div>
              <label className="block text-xs font-bold text-institutional uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full px-3.5 py-2.5 bg-background border border-rule rounded-xs text-sm text-foreground focus:outline-none focus:border-institutional focus:ring-1 focus:ring-institutional transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-institutional text-white font-bold text-xs uppercase tracking-widest rounded-xs hover:bg-institutional/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-institutional transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? "Creating Account..." : "Register Citizen Account"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-institutional hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
