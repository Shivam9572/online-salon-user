// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch, clearAuthCookies } from "../lib/api";

export interface UserData {
  phone: string;
  name: string;
  email: string;
  isActivate?: boolean;
  avatar?: string;
  address?:string;
  mobile?:string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserData | null;
  loading: boolean;
  otpLoading: boolean;
  checkAuthStatus:()=>Promise<boolean>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  initiateRegistration: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string; otpSent?: boolean }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  registrationData: { name: string; email: string; password: string } | null;
  clearRegistrationData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpLoading, setOtpLoading] = useState(false);
  const [registrationData, setRegistrationData] = useState<{ name: string; email: string; password: string } | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for unauthorized events
    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
    
      const savedUser = localStorage.getItem("user_data");
      
      if ( savedUser) {
         const response = await apiFetch("/verifyAuth", {
            method: "GET",
            requiresAuth: false,
          });
          if (response && response.ok) {
            const data = await response.json();
            if (data.authenticated) {
              setIsLoggedIn(true);
              
              setUser(data.user);
              // Update localStorage with fresh user data
              localStorage.setItem("user_data", JSON.stringify(data.user));
              return true;
            } else {
              // Token expired or invalid
              localStorage.removeItem("user_data");
              setIsLoggedIn(false);
              setUser(null);
              return false;
            }
          } else {
            // API error, but still show cached user
            localStorage.removeItem("user_data");
            setIsLoggedIn(false);
            setUser(null);
            return false;
          }
        
      }  else {
        localStorage.removeItem("user_data");
        setIsLoggedIn(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsLoggedIn(false);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const response = await apiFetch("/auth/refresh", {
        method: "POST",
        requiresAuth: false,
      });
      
      if (response && response.ok) {
        const data = await response.json();
        if (data.user) {
          localStorage.setItem("user_data", JSON.stringify(data.user));
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } else {
        clearAuthCookies();
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuthCookies();
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch("/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      });
       const data = await response.json();
      
      
      if (response && response.ok ) {
       
        // Token is automatically set via cookies by the server
     
        const userData={
            name:data.data.name || "User",
            email:data.data.email || "email",
            phone:data.data.phone || "phone"
            
        }
        // Store user data in localStorage for quick access
        localStorage.setItem("user_data", JSON.stringify(userData));
        
        setIsLoggedIn(true);
        setUser(userData);
        
        return { success: true,message:"successfull login" };
      }
      return {success:false,messgae:data.message}
    } catch (err) {
      return { success: false, message: "Network error. Please check your connection." };
    }
  };

  const initiateRegistration = async (name: string, email: string, password: string) => {
    setOtpLoading(true);
    try {
      const response = await apiFetch("/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, action: "send_otp" }),
        requiresAuth: false,
      });
      
      const data = await response.json();
      
      if (response && response.ok ) {
        setRegistrationData({ name, email, password });
        return { success: true, message: "OTP sent to your email", otpSent: true };
      }
      return { success: false, message: data.message || "Failed to send OTP" };
    } catch (err) {
      return { success: false, message: "Network error. Please try again." };
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setOtpLoading(true);
    try {
      const response = await apiFetch("/verify/register/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp, 
          action: "verify_otp",
          ...(registrationData && { 
            name: registrationData.name, 
            password: registrationData.password 
          })
        }),
        requiresAuth: false,
      });
      
      const data = await response.json();
      
      if (response.ok ) {
        // Token is automatically set via cookies by the server
       
        const userData={
            name:data?.name || "User",
            email:data?.email || "email",
            
        }
        
        
       
        setRegistrationData(null);
        
        return { success: true, message: "Registration successful!" };
      }
      return { success: false, message: data.message || "Invalid OTP. Please try again." };
    } catch (err) {
      return { success: false, message: "Network error. Please try again." };
    } finally {
      setOtpLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        requiresAuth: false,
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      clearAuthCookies();
      setIsLoggedIn(false);
      setUser(null);
      setRegistrationData(null);
    }
  };

  const clearRegistrationData = () => {
    setRegistrationData(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      loading, 
      otpLoading,
      login, 
      checkAuthStatus,
      initiateRegistration, 
      verifyOtp, 
      logout, 
      refreshAuth,
      registrationData,
      clearRegistrationData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}