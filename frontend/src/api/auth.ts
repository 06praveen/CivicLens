/**
 * CivicLens Frontend Auth API Module
 * Interacts with FastAPI /api/auth endpoints for user registration, login, profile, and logout.
 */
import { fetchApi } from "./client";

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export async function registerUser(payload: {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}): Promise<TokenResponse> {
  return fetchApi<TokenResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  username_or_email: string;
  password: string;
}): Promise<TokenResponse> {
  return fetchApi<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
  return fetchApi<UserResponse>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutUser(): Promise<{ message: string }> {
  return fetchApi<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}
