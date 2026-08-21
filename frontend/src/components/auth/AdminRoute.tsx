import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageLayout } from "@/components/PageLayout";

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-institutional border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-institutional uppercase tracking-widest">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location, message: "Administrative login required." }} replace />;
  }

  if (user?.role !== "admin") {
    return (
      <PageLayout>
        <div className="portal-container py-16 flex justify-center">
          <div className="max-w-md w-full bg-card border border-destructive/30 rounded-sm p-8 text-center space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-destructive" />
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-institutional">403 — Access Forbidden</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account (<strong>{user?.email}</strong>) does not have administrative privileges. Admin portal access is strictly restricted to platform administrators.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-block px-5 py-2.5 bg-institutional text-white font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-institutional/90 transition-colors shadow-xs"
              >
                Return to Public Portal Home
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return <>{children}</>;
};
