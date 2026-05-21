"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "@/lib/api";

type Step = "login" | "register" | "otp" | "forgotPassword" | "resetPassword";

export default function AuthPage() {
  const router = useRouter();
  const { login, initiateRegistration, verifyOtp, otpLoading } = useAuth();

  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);

  // OTP fields
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpEmail, setOtpEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password fields
  const [forgotEmail, setForgotEmail] = useState("");
  
  // Reset Password fields
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [resetOtp, setResetOtp] = useState(["", "", "", "", "", ""]);
  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // ── Login ────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginEmail || !loginPassword) { setError("Please fill in all fields."); return; }
    setLoading(true);
    const res = await login(loginEmail, loginPassword);
    setLoading(false);
    if (res.success) {
      setSuccess("Welcome back! Redirecting…");
      setTimeout(() => router.push("/"), 800);
    } else {
      setError(res.message || "Login failed. Please try again.");
    }
  };

  // ── Register ─────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regName || !regEmail || !regPassword) { setError("Please fill in all fields."); return; }
    if (regPassword.length <= 5) { setError("Password must be at least 5 characters."); return; }
    setLoading(true);
    const res = await initiateRegistration(regName, regEmail, regPassword);
    setLoading(false);
    if (res.success) {
      setOtpEmail(regEmail);
      setResendTimer(60);
      setStep("otp");
      clearMessages();
    } else {
      setError(res.message || "Registration failed. Please try again.");
    }
  };

  // ── Forgot Password ──────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotEmail) { setError("Please enter your email address."); return; }
    
    setLoading(true);
    try {
      const response = await apiFetch("/auth/customer/forgot-password/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (response.ok) {
        setResetEmail(forgotEmail);
        setResendTimer(60);
        setSuccess("OTP sent to your email! Please check your inbox.");
        setStep("resetPassword");
        clearMessages();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset Password ───────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    const otpCode = resetOtp.join("");
    if (otpCode.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    
    setLoading(true);
    try {
      const response = await apiFetch("/auth/customer/reset-password/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          newpassword: newPassword,
          otp: otpCode,
        }),
      });

      if (response.ok) {
        setSuccess("Password reset successful! Please login with your new password.");
        setTimeout(() => {
          setStep("login");
          setLoginEmail(resetEmail);
          setResetOtp(["", "", "", "", "", ""]);
          setNewPassword("");
          setConfirmPassword("");
          clearMessages();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to reset password. Please try again.");
        setResetOtp(["", "", "", "", "", ""]);
        resetOtpRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP for Password Reset ────────────────────────────
  const handleResendResetOtp = async () => {
    if (resendTimer > 0) return;
    clearMessages();
    
    setLoading(true);
    try {
      const response = await apiFetch("/auth/customer/forgot-password/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (response.ok) {
        setSuccess("New OTP sent to your email!");
        setResendTimer(60);
        setResetOtp(["", "", "", "", "", ""]);
        resetOtpRefs.current[0]?.focus();
      } else {
        setError("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling (Registration) ────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Reset OTP input handling ─────────────────────────────────
  const handleResetOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...resetOtp];
    next[index] = value.slice(-1);
    setResetOtp(next);
    if (value && index < 5) resetOtpRefs.current[index + 1]?.focus();
  };

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !resetOtp[index] && index > 0) {
      resetOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setResetOtp(pasted.split(""));
      resetOtpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    const res = await verifyOtp(otpEmail, code);
    setLoading(false);
    if (res.success) {
      setSuccess("Account verified! Redirecting…");
      setTimeout(() => router.push("/login"), 900);
    } else {
      setError(res.message || "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    clearMessages();
    setLoading(true);
    const res = await initiateRegistration("", otpEmail, "");
    setLoading(false);
    if (res.success || res.otpSent) {
      setSuccess("New OTP sent to your email.");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  // ── Shared input class ────────────────────────────────────────
  const inputCls =
    "w-full bg-[#0e0e18] border border-white/[0.08] text-white/90 text-sm rounded-xl px-4 py-3 outline-none placeholder:text-white/25 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-800/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-semibold text-lg tracking-wide">
            ✦ GlamBook
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e18] border border-white/[0.07] rounded-2xl p-8 shadow-2xl shadow-black/60">

          {/* ── Step tabs (login / register) ── */}
          {step !== "otp" && step !== "forgotPassword" && step !== "resetPassword" && (
            <div className="flex bg-[#0a0a0f] rounded-xl p-1 mb-7 border border-white/[0.06]">
              {(["login", "register"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStep(s); clearMessages(); }}
                  className={`flex-1 py-2 text-sm rounded-lg transition-all capitalize font-medium
                    ${step === s
                      ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                      : "text-white/40 hover:text-white/70"
                    }`}
                >
                  {s === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {/* ── Back button for forgot/reset password ── */}
          {(step === "forgotPassword" || step === "resetPassword") && (
            <button
              onClick={() => { setStep("login"); clearMessages(); setForgotEmail(""); setResetOtp(["", "", "", "", "", ""]); setNewPassword(""); setConfirmPassword(""); }}
              className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5m7-7-7 7 7 7"/>
              </svg>
              Back to login
            </button>
          )}

          {/* ── Error / success banners ── */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-400/90">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2.5 bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-sm text-green-400/90">{success}</p>
            </div>
          )}

          {/* ══════════════ LOGIN FORM ══════════════ */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Email address</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-xs text-white/40">Password</label>
                  <button
                    type="button"
                    onClick={() => { setStep("forgotPassword"); clearMessages(); }}
                    className="text-xs text-violet-400/80 hover:text-violet-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPw ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showLoginPw ? "Hide password" : "Show password"}
                  >
                    {showLoginPw ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <p className="text-center text-xs text-white/30 pt-1">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setStep("register"); clearMessages(); }} className="text-violet-400 hover:text-violet-300 transition-colors">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ══════════════ REGISTER FORM ══════════════ */}
          {step === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Full name</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Priya Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Email address</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showRegPw ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    placeholder="Min. 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showRegPw ? "Hide password" : "Show password"}
                  >
                    {showRegPw ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {/* Password strength bar */}
                {regPassword.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          regPassword.length >= i * 4
                            ? i === 1 ? "bg-red-500" : i === 2 ? "bg-amber-400" : "bg-green-500"
                            : "bg-white/[0.06]"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-white/30 ml-1">
                      {regPassword.length < 4 ? "Weak" : regPassword.length < 8 ? "Fair" : "Strong"}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpLoading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {(loading || otpLoading) ? <Spinner /> : null}
                {(loading || otpLoading) ? "Sending OTP…" : "Create account"}
              </button>

              <p className="text-center text-xs text-white/30 pt-1">
                Already have an account?{" "}
                <button type="button" onClick={() => { setStep("login"); clearMessages(); }} className="text-violet-400 hover:text-violet-300 transition-colors">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ══════════════ OTP STEP (Registration) ══════════════ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp}>
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-1">Check your email</h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  We sent a 6-digit code to<br />
                  <span className="text-violet-300/80">{otpEmail}</span>
                </p>
              </div>

              <div className="flex gap-2.5 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-13 text-center text-lg font-semibold bg-[#0a0a0f] border rounded-xl outline-none transition-all
                      ${digit
                        ? "border-violet-500/60 text-white"
                        : "border-white/[0.08] text-white/40"
                      }
                      focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/20`}
                    style={{ height: "52px" }}
                    aria-label={`OTP digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otpLoading || otp.join("").length < 6}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {(loading || otpLoading) ? <Spinner /> : null}
                {(loading || otpLoading) ? "Verifying…" : "Verify & create account"}
              </button>

              <p className="text-center text-xs text-white/30 mt-4">
                Didn't receive it?{" "}
                {resendTimer > 0 ? (
                  <span className="text-white/30">Resend in {resendTimer}s</span>
                ) : (
                  <button type="button" onClick={handleResend} className="text-violet-400 hover:text-violet-300 transition-colors">
                    Resend code
                  </button>
                )}
              </p>

              <button
                type="button"
                onClick={() => { setStep("register"); setOtp(["","","","","",""]); clearMessages(); }}
                className="w-full mt-3 text-xs text-white/30 hover:text-white/50 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
                Back to sign up
              </button>
            </form>
          )}

          {/* ══════════════ FORGOT PASSWORD STEP ══════════════ */}
          {step === "forgotPassword" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-2">Forgot password?</h2>
                <p className="text-sm text-white/40 leading-relaxed mb-6">
                  Enter your email address and we'll send you a verification code to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Email address</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Sending code…" : "Send reset code"}
              </button>
            </form>
          )}

          {/* ══════════════ RESET PASSWORD STEP ══════════════ */}
          {step === "resetPassword" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-lg mb-1">Reset password</h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  Enter the OTP sent to<br />
                  <span className="text-violet-300/80">{resetEmail}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-xs text-white/40 mb-2 ml-1">Verification code</label>
                <div className="flex gap-2.5 justify-center" onPaste={handleResetOtpPaste}>
                  {resetOtp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { resetOtpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleResetOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleResetOtpKeyDown(i, e)}
                      className={`w-11 h-13 text-center text-lg font-semibold bg-[#0a0a0f] border rounded-xl outline-none transition-all
                        ${digit
                          ? "border-violet-500/60 text-white"
                          : "border-white/[0.08] text-white/40"
                        }
                        focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/20`}
                      style={{ height: "52px" }}
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">New password</label>
                <div className="relative">
                  <input
                    type={showResetPw ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showResetPw ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs text-white/40 mb-1.5 ml-1">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPw ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        newPassword.length >= i * 4
                          ? i === 1 ? "bg-red-500" : i === 2 ? "bg-amber-400" : "bg-green-500"
                          : "bg-white/[0.06]"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-white/30 ml-1">
                    {newPassword.length < 4 ? "Weak" : newPassword.length < 8 ? "Fair" : "Strong"}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || resetOtp.join("").length < 6 || !newPassword || !confirmPassword}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 disabled:cursor-not-allowed text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Resetting password…" : "Reset password"}
              </button>

              {/* Resend OTP */}
              <p className="text-center text-xs text-white/30">
                Didn't receive the code?{" "}
                {resendTimer > 0 ? (
                  <span className="text-white/30">Resend in {resendTimer}s</span>
                ) : (
                  <button type="button" onClick={handleResendResetOtp} className="text-violet-400 hover:text-violet-300 transition-colors">
                    Resend code
                  </button>
                )}
              </p>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/20 mt-6">
          By continuing you agree to our{" "}
          <Link href="/terms" className="text-white/35 hover:text-white/50 transition-colors">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-white/35 hover:text-white/50 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}