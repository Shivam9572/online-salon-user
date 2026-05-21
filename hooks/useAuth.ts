// hooks/useAuth.ts
"use client";

import { useAuth as useAuthContext } from "../context/AuthContext";

// Re-export for cleaner imports
export const useAuth = useAuthContext;