import React, { createContext, useContext, useState, useEffect } from "react";
import { UserResponse, registerUser, loginUser, getCurrentUser, logoutUser } from "@/api/auth";

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "civiclens_auth_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and hydrate user session from localStorage token
  useEffect(() => {
    if (token) {
      getCurrentUser(token)
        .then((userData) => {
          setUser(userData);
          setLoading(false);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (usernameOrEmail: string, password: string) => {
    const res = await loginUser({ username_or_email: usernameOrEmail, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    const res = await registerUser({ email, username, password, full_name: fullName });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    logoutUser().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
