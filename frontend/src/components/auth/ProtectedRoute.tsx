import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-institutional border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-institutional uppercase tracking-widest">Verifying Citizen Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path for post-login redirect
    return <Navigate to="/login" state={{ from: location, message: "Please sign in to access CivicLens features." }} replace />;
  }

  return <>{children}</>;
};
