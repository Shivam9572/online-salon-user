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


export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function clearAuthCookies() {
  deleteCookie("token");
  
  localStorage.removeItem("user_data");
}