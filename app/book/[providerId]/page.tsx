"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Mock data for demo ──────────────────────────────────────────────────────
const MOCK_PROVIDER = {
  salonName: "Noir & Gold Studio",
  address: "12 Marble Lane, South Delhi",
  phone: "+91 98765 43210",
  rating: 4.7,
  reviewCount: 284,
  image: null,
};

const MOCK_SERVICES = [
  {
    service_id: "s1",
    service_name: "Signature Haircut",
    custom_price: "799",
    custom_duration: 45,
    custom_description: "Precision cut tailored to your face structure",
    category: { id: "c1", name: "Hair" },
    staff: [
      { id: "st1", name: "Arjun Mehta", phone: "9876543210", available: true },
      { id: "st2", name: "Priya Sharma", phone: "9876543211", available: true },
    ],
  },
  {
    service_id: "s2",
    service_name: "Beard Sculpt & Trim",
    custom_price: "499",
    custom_duration: 30,
    custom_description: "Expert beard shaping with hot towel finish",
    category: { id: "c1", name: "Beard" },
    staff: [
      { id: "st1", name: "Arjun Mehta", phone: "9876543210", available: true },
    ],
  },
  {
    service_id: "s3",
    service_name: "Royal Hair Spa",
    custom_price: "1299",
    custom_duration: 90,
    custom_description: "Deep conditioning treatment with scalp massage",
    category: { id: "c2", name: "Spa" },
    staff: [
      { id: "st2", name: "Priya Sharma", phone: "9876543211", available: true },
      { id: "st3", name: "Kavita Nair", phone: "9876543212", available: false },
    ],
  },
];

const MOCK_SLOTS = [
  { start_time: "09:00", end_time: "09:45", start_time_minutes: 540, end_time_minutes: 585 },
  { start_time: "10:00", end_time: "10:45", start_time_minutes: 600, end_time_minutes: 645 },
  { start_time: "11:30", end_time: "12:15", start_time_minutes: 690, end_time_minutes: 735 },
  { start_time: "13:00", end_time: "13:45", start_time_minutes: 780, end_time_minutes: 825 },
  { start_time: "14:30", end_time: "15:15", start_time_minutes: 870, end_time_minutes: 915 },
  { start_time: "16:00", end_time: "16:45", start_time_minutes: 960, end_time_minutes: 1005 },
  { start_time: "17:30", end_time: "18:15", start_time_minutes: 1050, end_time_minutes: 1095 },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
const formatTime = (mins) => {
  if (!mins && mins !== 0) return "";
  const h = Math.floor(mins / 60), m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const getTodayDate = () => new Date().toISOString().split("T")[0];
const getMaxDate = () => {
  const d = new Date(); d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const Icon = {
  Scissors: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Star: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Banknote: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  Wifi: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Loader: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step, total, labels }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 md:mb-10">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-500 ${
                  done
                    ? "bg-[#c9a96e] text-[#0a0a0f]"
                    : active
                    ? "bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]"
                    : "bg-white/5 text-white/30 border border-white/10"
                }`}
              >
                {done ? <span className="w-4 h-4"><Icon.Check /></span> : num}
              </div>
              <span
                className={`text-[9px] md:text-[10px] font-medium tracking-widest uppercase transition-all duration-300 ${
                  active ? "text-[#c9a96e]" : done ? "text-white/50" : "text-white/20"
                }`}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`w-10 md:w-16 h-px mx-2 transition-all duration-500 ${
                  step > num ? "bg-[#c9a96e]" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Provider header card ─────────────────────────────────────────────────────
function ProviderCard({ provider }) {
  const stars = Array.from({ length: 5 }, (_, i) => ({
    filled: i < Math.floor(provider.rating),
    half: !( i < Math.floor(provider.rating)) && i < provider.rating,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl md:rounded-3xl mb-6 md:mb-8"
      style={{
        background: "linear-gradient(135deg, #12121a 0%, #1a1520 50%, #12121a 100%)",
        border: "1px solid rgba(201,169,110,0.15)",
      }}
    >
      {/* Decorative gold line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-[#c9a96e] blur-sm" />

      <div className="p-5 md:p-7">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #c9a96e22 0%, #c9a96e44 100%)", border: "1px solid #c9a96e44" }}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="w-7 h-7 md:w-8 md:h-8 text-[#c9a96e]"><Icon.Scissors /></span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight truncate"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {provider.salonName}
            </h1>
            <div className="flex items-center gap-1 mt-1 mb-2">
              {stars.map((s, i) => (
                <span key={i} className={`w-3.5 h-3.5 ${s.filled ? "text-[#c9a96e]" : "text-white/15"}`}>
                  <Icon.Star />
                </span>
              ))}
              <span className="text-xs text-[#c9a96e] font-semibold ml-1">{provider.rating}</span>
              <span className="text-xs text-white/30">({provider.reviewCount} reviews)</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-4">
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <span className="w-3.5 h-3.5 shrink-0"><Icon.MapPin /></span>
                <span className="truncate">{provider.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <span className="w-3.5 h-3.5 shrink-0"><Icon.Phone /></span>
                <span>{provider.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a96e]/20 to-transparent" />
    </motion.div>
  );
}

// ─── Step 1: Service & Staff ──────────────────────────────────────────────────
function Step1({ services, selectedService, selectedStaff, onServiceChange, onStaffChange, onNext }) {
  return (
    <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.35 }}>
      {/* Services */}
      <div className="mb-7">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e]/70 font-semibold mb-3">Select Service</p>
        <div className="space-y-2.5">
          {services.map((svc) => {
            const active = selectedService?.service_id === svc.service_id;
            return (
              <button
                key={svc.service_id}
                onClick={() => onServiceChange(svc)}
                className="w-full text-left transition-all duration-300 rounded-xl md:rounded-2xl overflow-hidden group"
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.06) 100%)"
                    : "rgba(255,255,255,0.03)",
                  border: active ? "1px solid rgba(201,169,110,0.4)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between p-4 md:p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] tracking-[0.15em] uppercase font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: active ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.05)",
                          color: active ? "#c9a96e" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {svc.category.name}
                      </span>
                    </div>
                    <p className={`font-semibold text-sm md:text-base leading-tight ${active ? "text-white" : "text-white/70"}`}
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {svc.service_name}
                    </p>
                    <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{svc.custom_description}</p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <p className={`text-base md:text-lg font-bold ${active ? "text-[#c9a96e]" : "text-white/50"}`}>
                      ₹{parseInt(svc.custom_price).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className={`w-3 h-3 ${active ? "text-[#c9a96e]/60" : "text-white/25"}`}><Icon.Clock /></span>
                      <p className={`text-[11px] ${active ? "text-[#c9a96e]/60" : "text-white/30"}`}>{svc.custom_duration} min</p>
                    </div>
                  </div>
                </div>
                {active && (
                  <div className="h-px bg-gradient-to-r from-transparent via-[#c9a96e]/30 to-transparent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff */}
      {selectedService && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e]/70 font-semibold mb-3">Choose Stylist</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {selectedService.staff.map((s) => {
              const active = selectedStaff?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => s.available && onStaffChange(s)}
                  disabled={!s.available}
                  className="relative text-center p-3 md:p-4 rounded-xl transition-all duration-300"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.07) 100%)"
                      : !s.available
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.04)",
                    border: active
                      ? "1px solid rgba(201,169,110,0.45)"
                      : !s.available
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "1px solid rgba(255,255,255,0.08)",
                    opacity: !s.available ? 0.4 : 1,
                    cursor: !s.available ? "not-allowed" : "pointer",
                  }}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#c9a96e] flex items-center justify-center">
                      <span className="w-2.5 h-2.5 text-[#0a0a0f]"><Icon.Check /></span>
                    </span>
                  )}
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ background: active ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.06)" }}>
                    <span className={`w-5 h-5 ${active ? "text-[#c9a96e]" : "text-white/40"}`}><Icon.User /></span>
                  </div>
                  <p className={`text-xs font-semibold leading-tight ${active ? "text-white" : "text-white/50"}`}>{s.name}</p>
                  {!s.available && (
                    <p className="text-[9px] text-red-400/60 mt-0.5">Unavailable</p>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <button
        onClick={onNext}
        disabled={!selectedService || !selectedStaff}
        className="w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
        style={{
          background: selectedService && selectedStaff
            ? "linear-gradient(135deg, #c9a96e 0%, #a67c52 100%)"
            : "rgba(255,255,255,0.05)",
          color: selectedService && selectedStaff ? "#0a0a0f" : "rgba(255,255,255,0.2)",
          cursor: selectedService && selectedStaff ? "pointer" : "not-allowed",
        }}
      >
        Continue to Date & Time
        <span className="w-4 h-4"><Icon.ChevronRight /></span>
      </button>
    </motion.div>
  );
}

// ─── Step 2: Date & Time ──────────────────────────────────────────────────────
function Step2({ selectedDate, onDateChange, slots, slotsLoading, selectedSlot, onSlotSelect, onBack, onNext }) {
  const canProceed = selectedDate && selectedSlot;

  return (
    <motion.div initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.35 }}>
      {/* Date picker */}
      <div className="mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e]/70 font-semibold mb-3">
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5"><Icon.Calendar /></span>
            Select Date
          </span>
        </p>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            min={getTodayDate()}
            max={getMaxDate()}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl md:rounded-2xl px-4 py-3.5 text-sm text-white outline-none transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: selectedDate ? "1px solid rgba(201,169,110,0.4)" : "1px solid rgba(255,255,255,0.08)",
              colorScheme: "dark",
            }}
          />
          {selectedDate && (
            <div className="mt-2 px-1">
              <p className="text-xs text-[#c9a96e]/70">{formatDate(selectedDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e]/70 font-semibold mb-3">
            <span classNinterface Service {
  service_id: string;
  service_name: string;
  custom_price: string;
  custom_duration: number;
  custom_description: string;
  category: { id: string; name: string };
  staff: Staff[];
}

interface ApiResponse {
  success: boolean;
  provider: Provider;
  services: Service[];
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  display_time?: string;
  start_time_minutes?: number;
  end_time_minutes?: number;
}

// ─── Razorpay script loader ───────────────────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}



export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.providerId as string;
  const { logout, user,isLoggedIn } = useAuth();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);

  // ── Payment modal state ──────────────────────────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"online" | "cash" | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    name: user?.name || "",
    email:user?.email || "",
    phone:user?.phone || "",
    notes:""
  });


  const getTodayDate = () => new Date().toISOString().split("T")[0];
const [selectedDate, setSelectedDate] = useState(getTodayDate||"");




 

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatTimeForDisplay = (mins: number) => {
    if (!mins || mins < 0) return "Invalid Time";
    const h = Math.floor(mins / 60), m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const halfFilled = !filled && i < rating;
      return (
        <svg
          key={i}
          className={`w-4 h-4 ${filled ? "text-[#c9a96e]" : halfFilled ? "text-[#c9a96e]/60" : "text-white/20"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    });
  };

  const convertTimeStringToMinutes = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const convertTimeArrayToMinutes = (a: number[]) =>
    !a || a.length < 2 ? 0 : a[0] * 60 + a[1];

  const createDateTime = (date: string, timeMinutes: number) => {
    const [y, mo, d] = date.split("-");
    const dt = new Date(+y, +mo - 1, +d, Math.floor(timeMinutes / 60), timeMinutes % 60, 0);
    return dt.toISOString();
  };

  // ── Cancel appointment function ──────────────────────────────────────────────
  const cancelPendingAppointment = async (appointmentId: string) => {
    try {
      await apiFetch(`/appointment/${appointmentId}/cancel`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchProviderDetails = async () => {
   
    try {
      const res = await apiFetch(`/provider/${providerId}`);
      const data: ApiResponse = await res.json();
      setLoading(true);
      if (data.success) {
         
        setProvider(data.provider);
        setServices(data.services || []);
        if (data.services?.length) {
          const first = data.services[0];
          setSelectedService(first);
          const avail = first.staff.filter((s) => s.available);
          setSelectedStaff(avail.length ? avail[0] : first.staff[0] || null);
        }
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date?: string) => {
    if (!selectedStaff || !selectedService) return;
    const slotDate = date || selectedDate || getTodayDate();
    
    try {
      const res = await apiFetch("/appointment/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          serviceId: selectedService.service_id,
          providerId,
          date: slotDate,
        }),
      }); 
        setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);
    setSelectedSlot(null);
      const data = await res.json();
      if (data.success && data.timeSlots) {
        let formatted: TimeSlot[] = [];
        if (data.timeSlots.length > 0) {
          if (data.timeSlots[0].start && Array.isArray(data.timeSlots[0].start)) {
            formatted = data.timeSlots.map((s: any) => {
              const sm = convertTimeArrayToMinutes(s.start);
              const em = convertTimeArrayToMinutes(s.end);
              return {
                start_time: `${s.start[0].toString().padStart(2, "0")}:${s.start[1].toString().padStart(2, "0")}`,
                end_time: `${s.end[0].toString().padStart(2, "0")}:${s.end[1].toString().padStart(2, "0")}`,
                start_time_minutes: sm,
                end_time_minutes: em,
                display_time: `${formatTimeForDisplay(sm)} - ${formatTimeForDisplay(em)}`,
              };
            });
          } else if (data.timeSlots[0].start_time) {
            formatted = data.timeSlots.map((s: any) => {
              const sm = convertTimeStringToMinutes(s.start_time);
              const em = convertTimeStringToMinutes(s.end_time);
              return { ...s, start_time_minutes: sm, end_time_minutes: em, display_time: `${formatTimeForDisplay(sm)} - ${formatTimeForDisplay(em)}` };
            });
          }
        }
        setAvailableSlots(formatted);
      } else {
        setAvailableSlots([]);
        setSlotsError(data.message || "No available slots for this date");
      }
    } catch (e) {
      setAvailableSlots([]);
      setSlotsError("Failed to load available slots. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    if (selectedStaff && selectedService) fetchAvailableSlots(date);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!selectedService) return;
    setSelectedSlot(slot);
    const sm = slot.start_time_minutes || convertTimeStringToMinutes(slot.start_time);
    const em = slot.end_time_minutes || convertTimeStringToMinutes(slot.end_time);
    setSelectedTime(sm);
    setStartTime(sm);
    setEndTime(em);
  };

  const adjustTime = (increment: boolean) => {
    if (!selectedTime || !selectedService || !endTime || !startTime) return;
    const dur = selectedService.custom_duration;
    const next = increment ? selectedTime + dur : selectedTime - dur;
    if (increment && next > endTime) return;
    if (!increment && next < startTime) return;
    setSelectedTime(next);
  };

  const handleServiceChange = (service: Service) => {
    setSelectedService(service);
    const avail = service.staff.filter((s) => s.available);
    setSelectedStaff(avail.length ? avail[0] : service.staff[0] || null);
    setSelectedDate("");
    setSelectedTime(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleStaffChange = (staff: Staff) => {
    setSelectedStaff(staff);
    setSelectedDate("");
    setSelectedTime(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  // ── Step 3 form submit → open payment modal ───────────────────────────────────
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      alert("Please fill in all required fields");
      return;
    }
    setPaymentType(null);
    setShowPaymentModal(true);
  };

  // ── Build booking body (shared) ───────────────────────────────────────────────
  const buildBookingBody = (payment_type: "online" | "cash") => {
    const endTimeMinutes = selectedTime! + selectedService!.custom_duration;
    return {
      provider_id: providerId,
      service_id: selectedService!.service_id,
      staff_id: selectedStaff!.id,
      start_time: createDateTime(selectedDate, selectedTime!),
      end_time: createDateTime(selectedDate, endTimeMinutes),
      customerName: bookingDetails.name || user?.name,
      customerEmail: bookingDetails.email || user?.email,
      customerPhone: bookingDetails.phone,
      notes: bookingDetails.notes,
      amount: selectedService!.custom_price,
      duration: selectedService!.custom_duration,
      payment_type,
    };
  };

  // ── CASH flow ─────────────────────────────────────────────────────────────────
  const handleCashPayment = async () => {
    setPaymentLoading(true);
    try {
      const res = await apiFetch("/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBookingBody("cash")),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowPaymentModal(false);
        alert("Request sent to provider successfully!");
        router.push("/my-bookings");
      } else {
        alert(data.message || "Booking failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── ONLINE flow with UPI first and cancellation ──────────────────────────────
  const handleOnlinePayment = async () => {
    setPaymentLoading(true);
    let createdAppointmentId = "";

    try {
      // 1. Create appointment with payment_type="online" and status="pending"
      const res = await apiFetch("/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBookingBody("online")),
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.orderId) {
        alert(data.message || "Could not initiate payment. Please try again.");
        setPaymentLoading(false);
        return;
      }

      createdAppointmentId = data.appointment.id;
      setPendingAppointmentId(createdAppointmentId);
      const orderId: string = data.orderId;

      // 2. Load Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay. Please check your connection.");
        // Cancel the pending appointment if Razorpay fails to load
        if (createdAppointmentId) {
          await cancelPendingAppointment(createdAppointmentId);
        }
        setPaymentLoading(false);
        router.push("/");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(parseFloat(selectedService!.custom_price) * 100),
        currency: "INR",
        name: provider?.salonName || "Salon Booking",
        description: selectedService!.service_name,
        order_id: orderId,
        prefill: {
          name: bookingDetails.name || user?.name || "",
          email: bookingDetails.email || user?.email || "",
          contact: user?.mobile || bookingDetails.phone || "",
        },
        // Force UPI as the primary method
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay with UPI",
                instruments: [
                  { method: "upi", flows: ["collect", "intent"] }
                ]
              },
              cards: {
                name: "Cards",
                instruments: [
                  { method: "card" }
                ]
              },
              netbanking: {
                name: "Net Banking",
                instruments: [
                  { method: "netbanking" }
                ]
              },
              wallets: {
                name: "Wallets",
                instruments: [
                  { method: "wallet" }
                ]
              }
            },
            sequence: ["block.upi", "block.cards", "block.netbanking", "block.wallets"],
            preferences: {
              show_default_blocks: false
            }
          }
        },
        theme: { color: "#c9a96e" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment
          try {
            const verifyRes = await apiFetch("/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
                appointmentId: createdAppointmentId,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setShowPaymentModal(false);
              setPendingAppointmentId(null);
              alert("Payment successful! Your booking is confirmed.");
              router.push("/my-bookings");
            } else {
              alert("Payment verification failed. Please contact support.");
              // Cancel appointment if verification fails
              if (createdAppointmentId) {
                await cancelPendingAppointment(createdAppointmentId);
              }
              router.push("/");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Verification error. Please contact support.");
            if (createdAppointmentId) {
              await cancelPendingAppointment(createdAppointmentId);
            }
            router.push("/");
          }
        },
        modal: {
          ondismiss: async () => {
            // User closed the Razorpay modal
            setPaymentLoading(false);
            setShowPaymentModal(false);
            alert("Payment cancelled. Your booking request has been cancelled.");
            // Cancel the pending appointment
            if (createdAppointmentId) {
              await cancelPendingAppointment(createdAppointmentId);
            }
            router.push("/");
          },
        },
      };

      setShowPaymentModal(false);
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        console.error("Payment failed:", response.error);
        alert(response.error?.description || "Payment failed. Please try again.");
        setPaymentLoading(false);
        // Cancel appointment on payment failure
        if (createdAppointmentId) {
          await cancelPendingAppointment(createdAppointmentId);
        }
        router.push("/");
      });
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert("Network error. Please try again.");
      setPaymentLoading(false);
      // Cancel appointment on network error
      if (createdAppointmentId) {
        await cancelPendingAppointment(createdAppointmentId);
      }
      router.push("/");
    }
  };

  const handlePaymentConfirm = () => {
    if (!paymentType) return;
    if (paymentType === "cash") handleCashPayment();
    else handleOnlinePayment();
  };

  // ── Misc helpers ──────────────────────────────────────────────────────────────
  const getMinDate = () => getTodayDate();
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };
     async function authCheck(){
       try{
           const res=await apiFetch("/verifyAuth",{method:"GET"});
           const role=await res.json();
           
           if(!res && role!="customer"){

          logout();
          
          router.push("/login") ;
        }
       }catch(e){
          logout();
          
          router.push("/login") ;
       }

      }
 if(!isLoggedIn || user ==null){
        router.push("/login") ;
    }
    useEffect(() => {
   
      authCheck();
       fetchProviderDetails();
  }, []);
   useEffect(() => {
    if (bookingStep === 3 && selectedStaff && selectedService) {
      
        
        fetchAvailableSlots();
      
    }
  }, [selectedService, selectedDate]);

  // ── Auth / Loading guards ─────────────────────────────────────────────────────
  if (showAuthAlert) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Login Required</h2>
          <p className="text-white/60 mb-6">Please login to book an appointment</p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all">Go Back</Link>
            <Link href="/" className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold">Login / Sign Up</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-[#c9a96e] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Salon Not Found</h2>
          <p className="text-white/60 mb-6">Don&apos;t select today&apos;s slot</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Services Available</h2>
          <p className="text-white/60 mb-6">This salon currently has no services listed</p>
          <Link href="/" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold">Back to Home</Link>
        </div>
      </div>
    );
  }

  

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-[72px] pb-12">
      <div className="max-w-7xl mx-auto px-5 md:px-10">

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${bookingStep >= step ? "bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f]" : "bg-white/10 text-white/40"}`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-12 h-px ${bookingStep > step ? "bg-[#c9a96e]" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-2">
            <span className="text-white/60 text-sm">Select Service</span>
            <span className="text-white/60 text-sm">Choose Staff</span>
            <span className="text-white/60 text-sm">Confirm Booking</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Provider Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#c9a96e]/20 to-[#e8c88a]/20 flex items-center justify-center">
                  <Scissors className="w-10 h-10 text-[#c9a96e]" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">{provider.salonName}</h1>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center gap-1 text-white/40"><MapPin className="w-3 h-3" /><span className="truncate">{provider.salonAddress}</span></div>
                    <div className="flex items-center gap-1 text-white/40"><Phone className="w-3 h-3" /><span>{provider.salonContact}</span></div>
                    <div className="flex items-center gap-1 text-white/40"><Clock className="w-3 h-3" /><span>{provider.opening_time?.slice(0, 5)} - {provider.closing_time?.slice(0, 5)}</span></div>
                  </div>
                  {provider.servicesOffered && <p className="text-[#c9a96e] text-sm mt-2">{provider.servicesOffered}</p>}
                </div>
              </div>
            </motion.div>

            {/* Step 1 – Service Selection */}
            {bookingStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Select Service</h2>
                <div className="space-y-3">
                  {services.map((service) => (
                    <motion.button key={service.service_id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => handleServiceChange(service)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${selectedService?.service_id === service.service_id ? "border-[#c9a96e] bg-[#c9a96e]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{service.service_name}</h3>
                          <p className="text-white/40 text-sm">{service.custom_description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-white/60 text-xs flex items-center gap-1"><ClockIcon className="w-3 h-3" />{service.custom_duration} min</span>
                            <span className="text-[#c9a96e] text-sm font-semibold">₹{parseFloat(service.custom_price).toFixed(0)}</span>
                            <span className="text-white/40 text-xs">{service.staff.filter((s) => s.available).length} staff available</span>
                          </div>
                        </div>
                        {selectedService?.service_id === service.service_id && <CheckCircle className="w-5 h-5 text-[#c9a96e] ml-2 shrink-0" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(2)} disabled={!selectedService}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue <ChevronRight className="w-4 h-4 inline ml-1" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2 – Staff Selection */}
            {bookingStep === 2 && selectedService && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Choose Staff Member</h2>
                <div className="space-y-3">
                  {selectedService.staff.map((staff) => (
                    <motion.button key={staff.id} whileHover={staff.available ? { scale: 1.01 } : {}} whileTap={staff.available ? { scale: 0.99 } : {}}
                      onClick={() => staff.available && handleStaffChange(staff)} disabled={!staff.available}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${!staff.available ? "border-red-500/30 bg-red-500/5 opacity-60 cursor-not-allowed" : selectedStaff?.id === staff.id ? "border-[#c9a96e] bg-[#c9a96e]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#c9a96e]" />
                            <h3 className="text-white font-semibold">{staff.name}</h3>
                            {!staff.available
                              ? <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">Unavailable</span>
                              : <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">Available</span>}
                          </div>
                          <p className="text-white/40 text-sm mt-1">📞 {staff.phone}</p>
                        </div>
                        {staff.available && selectedStaff?.id === staff.id && <CheckCircle className="w-5 h-5 text-[#c9a96e]" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(1)}
                    className="px-6 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all">Back</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(3)} disabled={!selectedStaff || !selectedStaff.available}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue <ChevronRight className="w-4 h-4 inline ml-1" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3 – Booking Details Form */}
            {bookingStep === 3 && selectedService && selectedStaff && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">


                    <div>
                      <label className="block text-white/60 text-sm mb-1.5">
                        Email <span className="text-xs text-white/40 ml-2">(Auto-filled from account)</span>
                      </label>
                      <div className="relative">
                        <input type="email" value={bookingDetails.email}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                          disabled={!isEditingEmail}
                          className={`w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors ${!isEditingEmail ? "opacity-70 cursor-not-allowed" : ""}`} required />
                        <button type="button" onClick={() => setIsEditingEmail(!isEditingEmail)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#c9a96e] transition-colors">
                          {isEditingEmail ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                      </div>
                      {!isEditingEmail && <p className="text-xs text-white/30 mt-1">Click edit icon to change email</p>}
                    </div>



                    <div>
                      <label className="block text-white/60 text-sm mb-1.5">Select Date</label>
                      <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)}
                        min={getMinDate()} max={getMaxDate()}
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors [color-scheme:dark]" required />
                    </div>

                    {/* Time Slots */}
                    <div className="md:col-span-2">
                      <label className="block text-white/60 text-sm mb-1.5">Select Time Slot <span className="text-red-400">*</span></label>
                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-8 bg-white/5 rounded-xl border border-white/10">
                          <Loader2 className="w-6 h-6 text-[#c9a96e] animate-spin" />
                          <span className="ml-2 text-white/60">Loading available slots...</span>
                        </div>
                      ) : slotsError ? (
                        <div className="text-center py-8 bg-red-500/5 rounded-xl border border-red-500/20">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-red-400 text-sm">{slotsError}</p>
                          <button type="button" onClick={() => fetchAvailableSlots(selectedDate)}
                            className="mt-3 text-sm text-[#c9a96e] hover:text-[#e8c88a] transition-colors">Try Again</button>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                          <ClockIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">No available slots for {selectedDate ? new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "this date"}</p>
                          <p className="text-white/30 text-xs mt-1">Please try another date</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-sm text-white/40 mb-2">Showing slots for {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableSlots.map((slot, i) => {
                              const sm = slot.start_time_minutes || convertTimeStringToMinutes(slot.start_time);
                              const isSelected = selectedTime === sm;
                              const display = slot.display_time || `${formatTimeForDisplay(sm)} - ${formatTimeForDisplay(slot.end_time_minutes || convertTimeStringToMinutes(slot.end_time))}`;
                              return (
                                <motion.button key={i} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  className={`px-4 py-3 rounded-xl text-center font-medium transition-all ${isSelected ? "bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] shadow-lg shadow-[#c9a96e]/25" : "bg-white/5 border border-white/10 text-white hover:border-white/20 hover:bg-white/10"}`}>
                                  <div className="text-sm font-semibold">{display}</div>
                                </motion.button>
                              );
                            })}
                          </div>
                          {selectedTime && selectedSlot && (
                            <div className="mt-3 p-3 bg-[#c9a96e]/10 rounded-lg border border-[#c9a96e]/20">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-[#c9a96e]" />
                                <span className="text-white text-sm">Selected: {formatTimeForDisplay(selectedTime)}</span>
                              </div>
                              <div className="flex items-center gap-3 pt-2 border-t border-[#c9a96e]/20">
                                <button type="button" onClick={() => adjustTime(false)} disabled={selectedTime <= (startTime || 0)}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                                <div className="flex-1 text-center">
                                  <span className="text-white/60 text-xs">Duration</span>
                                  <p className="text-white font-semibold">{selectedService.custom_duration} minutes</p>
                                </div>
                                <button type="button" onClick={() => adjustTime(true)} disabled={selectedTime + selectedService.custom_duration >= (endTime || 0)}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                              </div>
                              <div className="mt-2 text-center">
                                <span className="text-white/40 text-xs">Available from {formatTimeForDisplay(startTime || 0)} to {formatTimeForDisplay(endTime || 0)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-white/60 text-sm mb-1.5">Special Notes (Optional)</label>
                      <textarea value={bookingDetails.notes}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                        placeholder="Any special requests?" rows={2}
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors resize-none" />
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button"
                      onClick={() => setBookingStep(2)}
                      className="px-6 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all">Back</motion.button>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      disabled={submitting || !selectedTime || slotsLoading}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center gap-2 disabled:opacity-50">
                      <CreditCard className="w-4 h-4" />
                      Proceed to Payment
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Right Column – Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Booking Summary</h3>
              {selectedService ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-white/10">
                    <p className="text-white/40 text-xs mb-1">Selected Service</p>
                    <p className="text-white font-semibold">{selectedService.service_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/60 text-xs flex items-center gap-1"><ClockIcon className="w-3 h-3" />{selectedService.custom_duration} min</span>
                      <span className="text-[#c9a96e] font-bold">₹{parseFloat(selectedService.custom_price).toFixed(0)}</span>
                    </div>
                  </div>
                  {selectedStaff && (
                    <div className="pb-3 border-b border-white/10">
                      <p className="text-white/40 text-xs mb-1">Selected Staff</p>
                      <p className="text-white font-semibold">{selectedStaff.name}</p>
                      <p className="text-white/40 text-xs">📞 {selectedStaff.phone}</p>
                      {selectedStaff.available && <span className="text-xs text-green-400 mt-1 inline-block">Available</span>}
                    </div>
                  )}
                  {selectedDate && selectedTime && (
                    <div className="pb-3 border-b border-white/10">
                      <p className="text-white/40 text-xs mb-1">Appointment Date & Time</p>
                      <p className="text-white font-semibold">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                      <p className="text-[#c9a96e] text-sm mt-1">{formatTimeForDisplay(selectedTime)} - {formatTimeForDisplay(selectedTime + selectedService.custom_duration)}</p>
                      <p className="text-white/40 text-xs mt-1">Duration: {selectedService.custom_duration} minutes</p>
                    </div>
                  )}
                  <div className="pt-2">
                    <div className="flex justify-between text-white font-semibold">
                      <span>Total Amount</span>
                      <span className="text-[#c9a96e] text-xl">₹{parseFloat(selectedService.custom_price).toFixed(0)}</span>
                    </div>
                    <p className="text-white/40 text-xs mt-2 text-center">Taxes and fees included</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">Select a service to see summary</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        {provider?.allFeedback && provider.allFeedback.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
                <p className="text-white/40 text-sm mt-1">
                  What clients say about {provider.salonName}
                </p>
              </div>
              {/* Overall Rating Badge */}
              <div className="flex items-center gap-3 bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-2xl px-5 py-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#c9a96e] leading-none">
                    {parseFloat(provider.averageRating || "0").toFixed(1)}
                  </p>
                  <div className="flex items-center gap-0.5 mt-1.5 justify-center">
                    {renderStars(parseFloat(provider.averageRating || "0"))}
                  </div>
                  <p className="text-white/40 text-xs mt-1">
                    {provider.allFeedback.length}{" "}
                    {provider.allFeedback.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Cards Grid */}
            <div className="flex flex-col gap-3">
              {provider.allFeedback.map((fb: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-gradient-to-br from-[#12121a] to-[#1a1a24] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-[#c9a96e]/30 transition-colors duration-300"
                >
                  {/* Stars Row */}
                  <div className="flex items-center gap-1">
                    {renderStars(fb.rating)}
                    <span className="ml-1 text-[#c9a96e] text-sm font-semibold">
                      {fb.rating}.0
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-white/75 text-sm leading-relaxed flex-1 line-clamp-4">
                    &ldquo;{fb.comment}&rdquo;
                  </p>

                  {/* Divider */}
                  <div className="border-t border-white/10 pt-3 flex items-start justify-between gap-2">
                    {/* Customer Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a96e]/30 to-[#e8c88a]/20 flex items-center justify-center shrink-0">
                        <span className="text-[#c9a96e] text-xs font-bold">
                          {fb.customer?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium leading-none">
                          {fb.customer?.name || "Anonymous"}
                        </p>
                        {fb.appointment?.service?.name && (
                          <p className="text-white/40 text-xs mt-0.5">
                            {fb.appointment.service.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Staff Badge */}
                    {fb.appointment?.staff?.name && (
                      <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-lg px-2 py-1 shrink-0">
                        <p className="text-[#c9a96e] text-xs">
                          ✂ {fb.appointment.staff.name}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Payment Selection Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Choose Payment Method</h3>
                  <p className="text-white/40 text-sm mt-0.5">How would you like to pay?</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount display */}
              <div className="mb-5 p-3 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-between">
                <span className="text-white/60 text-sm">Total to pay</span>
                <span className="text-[#c9a96e] text-xl font-bold">
                  ₹{selectedService ? parseFloat(selectedService.custom_price).toFixed(0) : "0"}
                </span>
              </div>

              {/* Payment options */}
              <div className="space-y-3 mb-6">
                {/* Online - UPI First */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentType("online")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${paymentType === "online" ? "border-[#c9a96e] bg-[#c9a96e]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${paymentType === "online" ? "bg-[#c9a96e]" : "bg-white/10"}`}>
                    <Wifi className={`w-5 h-5 ${paymentType === "online" ? "text-[#0a0a0f]" : "text-white/60"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Pay Online</p>
                    <p className="text-white/40 text-xs mt-0.5">UPI, Cards, Net Banking via Razorpay</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentType === "online" ? "border-[#c9a96e] bg-[#c9a96e]" : "border-white/30"}`}>
                    {paymentType === "online" && <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />}
                  </div>
                </motion.button>

                {/* Cash */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentType("cash")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${paymentType === "cash" ? "border-[#c9a96e] bg-[#c9a96e]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${paymentType === "cash" ? "bg-[#c9a96e]" : "bg-white/10"}`}>
                    <Banknote className={`w-5 h-5 ${paymentType === "cash" ? "text-[#0a0a0f]" : "text-white/60"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Pay at Salon</p>
                    <p className="text-white/40 text-xs mt-0.5">Pay cash directly at the salon</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentType === "cash" ? "border-[#c9a96e] bg-[#c9a96e]" : "border-white/30"}`}>
                    {paymentType === "cash" && <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />}
                  </div>
                </motion.button>
              </div>

              {/* Confirm button */}
              <motion.button
                whileHover={paymentType ? { scale: 1.02 } : {}}
                whileTap={paymentType ? { scale: 0.98 } : {}}
                onClick={handlePaymentConfirm}
                disabled={!paymentType || paymentLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {paymentLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : paymentType === "cash" ? (
                  <><Banknote className="w-4 h-4" /> Confirm Booking</>
                ) : paymentType === "online" ? (
                  <><CreditCard className="w-4 h-4" /> Pay ₹{selectedService ? parseFloat(selectedService.custom_price).toFixed(0) : "0"}</>
                ) : (
                  "Select a payment method"
                )}
              </motion.button>

              <p className="text-white/30 text-xs text-center mt-3">
                {paymentType === "online" ? "🔒 Secured by Razorpay - UPI available" : paymentType === "cash" ? "💡 Pay at the salon on your appointment day" : ""}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}
