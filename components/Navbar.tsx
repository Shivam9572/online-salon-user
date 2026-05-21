"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useNearMe } from "../context/NearMeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { handleNearMeClick } = useNearMe();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showPermissionToast, setShowPermissionToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node) && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const triggerNearMeFetch = useCallback(() => {
    setShowPermissionToast(false);
    setNearMeLoading(true);

    if (!navigator.geolocation) {
      setNearMeLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        handleNearMeClick();
        window.dispatchEvent(new CustomEvent("nearMeClick"));
        setNearMeLoading(false);
        setLocationDenied(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
          setShowPermissionToast(true);
        }
        setNearMeLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [handleNearMeClick]);

  const handleNearMe = useCallback(async () => {
    if (nearMeLoading) return;

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });

      if (permission.state === "denied") {
        setLocationDenied(true);
        setShowPermissionToast(true);
        return;
      }

      if (permission.state === "prompt") {
        setShowPermissionToast(true);
        return;
      }

      triggerNearMeFetch();
    } catch {
      triggerNearMeFetch();
    }
  }, [nearMeLoading, triggerNearMeFetch]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-[#0a0a0f] border-b border-white/[0.06] flex items-center px-4 sm:px-5 gap-3 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white font-semibold text-sm sm:text-base tracking-wide">
            ✦ GlamBook
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          <Link href="/" className="text-sm text-white/50 hover:text-white/80 transition-colors">
            Home
          </Link>
          <Link href="/my-bookings" className="text-sm text-white/50 hover:text-white/80 transition-colors">
            My Bookings
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Near Me button */}
          <button
            onClick={handleNearMe}
            disabled={nearMeLoading}
            className={`
              hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all
              ${nearMeLoading
                ? "border-amber-500/30 text-amber-400/60 bg-amber-500/5 cursor-not-allowed"
                : locationDenied
                ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10"
                : "border-white/10 text-white/60 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/8"
              }
            `}
            aria-label="Find salons near me"
          >
            {nearMeLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <span>Finding…</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span>Near me</span>
              </>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Auth section */}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[11px] font-medium text-violet-300 flex-shrink-0">
                  {user.name ? getInitials(user.name) : "U"}
                </div>
                <span className="text-sm text-white/70 hidden sm:block max-w-[90px] truncate">
                  {user.name ?? user.email}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-white/40 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#0e0e18] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white/90 truncate">{user.name}</p>
                    <p className="text-xs text-white/40 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <DropdownItem href="/profile" icon="👤" label="My Profile" onClick={() => setProfileOpen(false)} />
                    <DropdownItem href="/my-bookings" icon="📅" label="My Bookings" onClick={() => setProfileOpen(false)} />
                    <DropdownItem href="/settings" icon="⚙️" label="Settings" onClick={() => setProfileOpen(false)} />
                  </div>
                  <div className="border-t border-white/[0.06] py-1">
                    <button
                      onClick={() => { logout(); setProfileOpen(false); router.push("/"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400/80 hover:bg-red-500/8 hover:text-red-400 transition-colors text-left"
                    >
                      <span>🚪</span>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm text-white/60 hover:text-white/90 px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10 transition-all"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="text-sm text-white bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div
            ref={mobileMenuRef}
            className="fixed top-[64px] left-0 right-0 bg-[#0e0e18] border-b border-white/[0.08] z-40 md:hidden animate-slideDown"
          >
            <div className="flex flex-col p-4 gap-1">
              <MobileMenuItem href="/" icon="🏠" label="Home" onClick={() => setMobileMenuOpen(false)} />
              <MobileMenuItem href="/my-bookings" icon="📅" label="My Bookings" onClick={() => setMobileMenuOpen(false)} />
              
              {/* Mobile Near Me Button */}
              <button
                onClick={() => {
                  handleNearMe();
                  setMobileMenuOpen(false);
                }}
                disabled={nearMeLoading}
                className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:bg-white/5 rounded-lg transition-colors w-full"
              >
                {nearMeLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span>Finding near me...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Near me</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Location permission toast */}
      {showPermissionToast && (
        <div className="fixed top-[76px] left-1/2 -translate-x-1/2 z-50 w-[340px] max-w-[calc(100vw-2rem)] animate-fadeIn">
          <div className="bg-[#0e0e18] border border-violet-500/20 rounded-xl p-4 shadow-2xl shadow-black/60">
            {locationDenied ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <line x1="4" y1="4" x2="20" y2="20" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90 mb-1">Location access denied</p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Enable location in your browser settings, then try again. Or search by area name instead.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setShowPermissionToast(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <button onClick={() => setShowPermissionToast(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/90 mb-1">Allow location access?</p>
                  <p className="text-xs text-white/40 leading-relaxed">
                    GlamBook will use your location to show nearby salons. We don't store it.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        triggerNearMeFetch();
                        setShowPermissionToast(false);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    >
                      Allow access
                    </button>
                    <button
                      onClick={() => setShowPermissionToast(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
                    >
                      Not now
                    </button>
                  </div>
                </div>
                <button onClick={() => setShowPermissionToast(false)} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

// Dropdown Item Component
function DropdownItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/60 hover:bg-white/[0.04] hover:text-white/90 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// Mobile Menu Item Component
function MobileMenuItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:bg-white/5 rounded-lg transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}