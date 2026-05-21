// lib/api.ts
"use client";

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { requiresAuth = true, ...fetchOptions } = options;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add CSRF token for non-GET requests if needed
  if (fetchOptions.method && fetchOptions.method !== "GET") {
    const csrfToken = getCookie("csrf_token");
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "/api"}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include", // Important: This includes cookies in requests
  });

  // If unauthorized and requiresAuth, clear auth state
  if (response.status === 401 && requiresAuth) {
    clearAuthCookies();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  return response;
}

// Cookie helper functions
export function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${process.env.NODE_ENV === "production" ? ";Secure" : ""}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function clearAuthCookies() {
  deleteCookie("auth_token");
  deleteCookie("refresh_token");
  deleteCookie("csrf_token");
  localStorage.removeItem("user_data");
}