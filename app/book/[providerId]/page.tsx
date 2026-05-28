"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  MapPin,
  Phone,
  Clock,
  User,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Loader2,
  Banknote,
  Wifi,
  X,
  CreditCard,
  Edit2,
  Save,
  Clock as ClockIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // adjust path as needed
import { apiFetch } from "@/lib/api"; // adjust path as needed

// ─── Types ────────────────────────────────────────────────────────────────────
interface Staff {
  id: string;
  name: string;
  phone: string;
  available: boolean;
}

interface Service {
  service_id: string;
  service_name: string;
  custom_price: string;
  custom_duration: number;
  custom_description: string;
  category: { id: string; name: string };
  staff: Staff[];
}

interface Provider {
  salonName: string;
  salonAddress: string;
  salonContact: string;
  opening_time?: string;
  closing_time?: string;
  servicesOffered?: string;
  averageRating?: string;
  allFeedback?: any[];
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
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.providerId as string;
  const {  user,checkAuthStatus } = useAuth();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"online" | "cash" | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    notes: "",
  });

  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const formatTimeForDisplay = (mins: number) => {
    if (!mins && mins !== 0) return "Invalid Time";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const halfFilled = !filled && i < rating;
      return (
        <svg
          key={i}
          className={`w-4 h-4 ${
            filled ? "text-[#c9a96e]" : halfFilled ? "text-[#c9a96e]/60" : "text-white/20"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    });

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

  const getMinDate = () => getTodayDate();
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  // ── Cancel appointment ────────────────────────────────────────────────────────
  const cancelPendingAppointment = async (appointmentId: string) => {
    try {
      await apiFetch(`/appointment/${appointmentId}/cancel`, { method: "DELETE" });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  // ── Auth check ────────────────────────────────────────────────────────────────
  

  // ── Data fetching ─────────────────────────────────────────────────────────────
  const fetchProviderDetails = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/provider/${providerId}`);
      const data: ApiResponse = await res.json();
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date?: string) => {
    if (!selectedStaff || !selectedService) return;
    const slotDate = date || selectedDate || getTodayDate();
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedTime(null);
    setSelectedSlot(null);
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
                display_time: `${formatTimeForDisplay(sm)} – ${formatTimeForDisplay(em)}`,
              };
            });
          } else if (data.timeSlots[0].start_time) {
            formatted = data.timeSlots.map((s: any) => {
              const sm = convertTimeStringToMinutes(s.start_time);
              const em = convertTimeStringToMinutes(s.end_time);
              return {
                ...s,
                start_time_minutes: sm,
                end_time_minutes: em,
                display_time: `${formatTimeForDisplay(sm)} – ${formatTimeForDisplay(em)}`,
              };
            });
          }
        }
        setAvailableSlots(formatted);
      } else {
        setAvailableSlots([]);
        setSlotsError(data.message || "No available slots for this date");
      }
    } catch {
      setAvailableSlots([]);
      setSlotsError("Failed to load available slots. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────
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
    const sm = slot.start_time_minutes ?? convertTimeStringToMinutes(slot.start_time);
    const em = slot.end_time_minutes ?? convertTimeStringToMinutes(slot.end_time);
    setSelectedTime(sm);
    setStartTime(sm);
    setEndTime(em);
  };

  const adjustTime = (increment: boolean) => {
    if (selectedTime === null || !selectedService || endTime === null || startTime === null) return;
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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStaff || !selectedDate || selectedTime === null) {
      alert("Please fill in all required fields");
      return;
    }
    setPaymentType(null);
    setShowPaymentModal(true);
  };

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

  const handleOnlinePayment = async () => {
    setPaymentLoading(true);
    let createdAppointmentId = "";
    try {
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

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to load Razorpay. Please check your connection.");
        if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
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
        config: {
          display: {
            blocks: {
              upi: { name: "Pay with UPI", instruments: [{ method: "upi", flows: ["collect", "intent"] }] },
              cards: { name: "Cards", instruments: [{ method: "card" }] },
              netbanking: { name: "Net Banking", instruments: [{ method: "netbanking" }] },
              wallets: { name: "Wallets", instruments: [{ method: "wallet" }] },
            },
            sequence: ["block.upi", "block.cards", "block.netbanking", "block.wallets"],
            preferences: { show_default_blocks: false },
          },
        },
        theme: { color: "#c9a96e" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
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
              if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
              router.push("/");
            }
          } catch {
            alert("Verification error. Please contact support.");
            if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
            router.push("/");
          }
        },
        modal: {
          ondismiss: async () => {
            setPaymentLoading(false);
            setShowPaymentModal(false);
            alert("Payment cancelled. Your booking request has been cancelled.");
            if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
            router.push("/");
          },
        },
      };

      setShowPaymentModal(false);
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        alert(response.error?.description || "Payment failed. Please try again.");
        setPaymentLoading(false);
        if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
        router.push("/");
      });
      rzp.open();
    } catch {
      alert("Network error. Please try again.");
      setPaymentLoading(false);
      if (createdAppointmentId) await cancelPendingAppointment(createdAppointmentId);
      router.push("/");
    }
  };

  const handlePaymentConfirm = () => {
    if (!paymentType) return;
    if (paymentType === "cash") handleCashPayment();
    else handleOnlinePayment();
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if(!checkAuthStatus()){
      alert("you aren't loggedin");
      router.push("/login");
      return;
    }
    fetchProviderDetails();
  }, []);

  useEffect(() => {
    if (bookingStep === 3 && selectedStaff && selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate, bookingStep]);

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#c9a96e] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Salon Not Found</h2>
          <p className="text-white/60 mb-6">Unable to load salon details.</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
          >
            Back to Home
          </Link>
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
          <p className="text-white/60 mb-6">This salon currently has no services listed.</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-[72px] pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-10 w-full">

        {/* ── Progress Steps ─────────────────────────────────────────────────── */}
        <div className="mb-8 w-full overflow-hidden">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-300 shrink-0 ${
                    bookingStep >= step
                      ? "bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f]"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-6 sm:w-10 h-px shrink-0 transition-all duration-300 ${
                      bookingStep > step ? "bg-[#c9a96e]" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 gap-4 sm:gap-12">
            {["Select Service", "Choose Staff", "Confirm Booking"].map((label, i) => (
              <span
                key={i}
                className={`text-[10px] sm:text-xs text-center transition-colors duration-300 ${
                  bookingStep === i + 1 ? "text-[#c9a96e]" : "text-white/40"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 lg:gap-8 [&>*]:min-w-0">
          {/* ── Left Column ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5 min-w-0">

            {/* Provider Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-gradient-to-br from-[#c9a96e]/20 to-[#e8c88a]/20 flex items-center justify-center">
                  <Scissors className="w-7 h-7 sm:w-10 sm:h-10 text-[#c9a96e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-white mb-2 truncate">
                    {provider.salonName}
                  </h1>
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1.5 text-sm">
                    <div className="flex items-center gap-1 text-white/40 min-w-0">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{provider.salonAddress}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/40 shrink-0">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{provider.salonContact}</span>
                    </div>
                    {provider.opening_time && provider.closing_time && (
                      <div className="flex items-center gap-1 text-white/40 shrink-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {provider.opening_time.slice(0, 5)} – {provider.closing_time.slice(0, 5)}
                        </span>
                      </div>
                    )}
                  </div>
                  {provider.servicesOffered && (
                    <p className="text-[#c9a96e] text-sm mt-2 truncate">{provider.servicesOffered}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Step 1: Service Selection ─────────────────────────────────── */}
            {bookingStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-5 sm:p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Select Service</h2>
                <div className="space-y-3">
                  {services.map((service) => (
                    <motion.button
                      key={service.service_id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleServiceChange(service)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedService?.service_id === service.service_id
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold mb-1 truncate">
                            {service.service_name}
                          </h3>
                          <p className="text-white/40 text-sm line-clamp-2 break-words">
                            {service.custom_description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-white/60 text-xs flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {service.custom_duration} min
                            </span>
                            <span className="text-[#c9a96e] text-sm font-semibold">
                              ₹{parseFloat(service.custom_price).toFixed(0)}
                            </span>
                            <span className="text-white/40 text-xs">
                              {service.staff.filter((s) => s.available).length} staff available
                            </span>
                          </div>
                        </div>
                        {selectedService?.service_id === service.service_id && (
                          <CheckCircle className="w-5 h-5 text-[#c9a96e] shrink-0 mt-0.5" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(2)}
                    disabled={!selectedService}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Staff Selection ───────────────────────────────────── */}
            {bookingStep === 2 && selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-5 sm:p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Choose Staff Member</h2>
                <div className="space-y-3">
                  {selectedService.staff.map((staff) => (
                    <motion.button
                      key={staff.id}
                      whileHover={staff.available ? { scale: 1.01 } : {}}
                      whileTap={staff.available ? { scale: 0.99 } : {}}
                      onClick={() => staff.available && handleStaffChange(staff)}
                      disabled={!staff.available}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all ${
                        !staff.available
                          ? "border-red-500/30 bg-red-500/5 opacity-60 cursor-not-allowed"
                          : selectedStaff?.id === staff.id
                          ? "border-[#c9a96e] bg-[#c9a96e]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <User className="w-4 h-4 text-[#c9a96e] shrink-0" />
                            <h3 className="text-white font-semibold truncate">{staff.name}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                staff.available
                                  ? "text-green-400 bg-green-500/20"
                                  : "text-red-400 bg-red-500/20"
                              }`}
                            >
                              {staff.available ? "Available" : "Unavailable"}
                            </span>
                          </div>
                          <p className="text-white/40 text-sm mt-1">📞 {staff.phone}</p>
                        </div>
                        {staff.available && selectedStaff?.id === staff.id && (
                          <CheckCircle className="w-5 h-5 text-[#c9a96e] shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(1)}
                    className="px-6 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setBookingStep(3)}
                    disabled={!selectedStaff || !selectedStaff.available}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Booking Details ───────────────────────────────────── */}
            {bookingStep === 3 && selectedService && selectedStaff && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#12121a] rounded-2xl border border-white/10 p-5 sm:p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">

                    {/* Email */}
                    <div className="sm:col-span-2">
                      <label className="block text-white/60 text-sm mb-1.5">
                        Email{" "}
                        <span className="text-xs text-white/40 ml-1">(Auto-filled from account)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={bookingDetails.email}
                          onChange={(e) =>
                            setBookingDetails({ ...bookingDetails, email: e.target.value })
                          }
                          disabled={!isEditingEmail}
                          className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors pr-10 ${
                            !isEditingEmail ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingEmail(!isEditingEmail)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#c9a96e] transition-colors"
                        >
                          {isEditingEmail ? (
                            <Save className="w-4 h-4" />
                          ) : (
                            <Edit2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {!isEditingEmail && (
                        <p className="text-xs text-white/30 mt-1">Click edit icon to change email</p>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-white/60 text-sm mb-1.5">
                        Select Date <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors [color-scheme:dark]"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-white/60 text-sm mb-1.5">
                        Special Notes{" "}
                        <span className="text-white/30 text-xs">(Optional)</span>
                      </label>
                      <textarea
                        value={bookingDetails.notes}
                        onChange={(e) =>
                          setBookingDetails({ ...bookingDetails, notes: e.target.value })
                        }
                        placeholder="Any special requests?"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors resize-none"
                      />
                    </div>

                    {/* Time Slots */}
                    <div className="sm:col-span-2">
                      <label className="block text-white/60 text-sm mb-1.5">
                        Select Time Slot <span className="text-red-400">*</span>
                      </label>
                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-8 bg-white/5 rounded-xl border border-white/10">
                          <Loader2 className="w-6 h-6 text-[#c9a96e] animate-spin" />
                          <span className="ml-2 text-white/60">Loading available slots...</span>
                        </div>
                      ) : slotsError ? (
                        <div className="text-center py-8 bg-red-500/5 rounded-xl border border-red-500/20">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-red-400 text-sm">{slotsError}</p>
                          <button
                            type="button"
                            onClick={() => fetchAvailableSlots(selectedDate)}
                            className="mt-3 text-sm text-[#c9a96e] hover:text-[#e8c88a] transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : !selectedDate ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                          <ClockIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">Please select a date first</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                          <ClockIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">
                            No available slots for{" "}
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-white/30 text-xs mt-1">Please try another date</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-white/40">
                            Slots for{" "}
                            {new Date(selectedDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableSlots.map((slot, i) => {
                              const sm =
                                slot.start_time_minutes ??
                                convertTimeStringToMinutes(slot.start_time);
                              const isSelected = selectedTime === sm;
                              const display =
                                slot.display_time ||
                                `${formatTimeForDisplay(sm)} – ${formatTimeForDisplay(
                                  slot.end_time_minutes ??
                                    convertTimeStringToMinutes(slot.end_time)
                                )}`;
                              return (
                                <motion.button
                                  key={i}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                  className={`w-full px-2 py-3 rounded-xl text-center font-medium transition-all text-xs leading-tight ${
                                    isSelected
                                      ? "bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] shadow-lg shadow-[#c9a96e]/25"
                                      : "bg-white/5 border border-white/10 text-white hover:border-white/20 hover:bg-white/10"
                                  }`}
                                >
                                  {display}
                                </motion.button>
                              );
                            })}
                          </div>

                          {selectedTime !== null && selectedSlot && (
                            <div className="mt-3 p-3 bg-[#c9a96e]/10 rounded-lg border border-[#c9a96e]/20">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-[#c9a96e]" />
                                <span className="text-white text-sm">
                                  Selected: {formatTimeForDisplay(selectedTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 pt-2 border-t border-[#c9a96e]/20">
                                <button
                                  type="button"
                                  onClick={() => adjustTime(false)}
                                  disabled={selectedTime <= (startTime ?? 0)}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  −
                                </button>
                                <div className="flex-1 text-center">
                                  <span className="text-white/60 text-xs">Duration</span>
                                  <p className="text-white font-semibold">
                                    {selectedService.custom_duration} minutes
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => adjustTime(true)}
                                  disabled={
                                    selectedTime + selectedService.custom_duration >= (endTime ?? 0)
                                  }
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-white/40 text-xs mt-2 text-center">
                                Available from {formatTimeForDisplay(startTime ?? 0)} to{" "}
                                {formatTimeForDisplay(endTime ?? 0)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mt-6 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={submitting || selectedTime === null || slotsLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4" />
                      Proceed to Payment
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* ── Right Column: Booking Summary ─────────────────────────────────── */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-24 bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-4 sm:p-6 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">Booking Summary</h3>
              {selectedService ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-white/10">
                    <p className="text-white/40 text-xs mb-1">Selected Service</p>
                    <p className="text-white font-semibold truncate">{selectedService.service_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/60 text-xs flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {selectedService.custom_duration} min
                      </span>
                      <span className="text-[#c9a96e] font-bold">
                        ₹{parseFloat(selectedService.custom_price).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {selectedStaff && (
                    <div className="pb-3 border-b border-white/10">
                      <p className="text-white/40 text-xs mb-1">Selected Staff</p>
                      <p className="text-white font-semibold">{selectedStaff.name}</p>
                      <p className="text-white/40 text-xs">📞 {selectedStaff.phone}</p>
                      {selectedStaff.available && (
                        <span className="text-xs text-green-400 mt-1 inline-block">Available</span>
                      )}
                    </div>
                  )}

                  {selectedDate && selectedTime !== null && (
                    <div className="pb-3 border-b border-white/10">
                      <p className="text-white/40 text-xs mb-1">Appointment Date & Time</p>
                      <p className="text-white font-semibold text-xs sm:text-sm break-words">
                        {new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[#c9a96e] text-sm mt-1">
                        {formatTimeForDisplay(selectedTime)} –{" "}
                        {formatTimeForDisplay(selectedTime + selectedService.custom_duration)}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Duration: {selectedService.custom_duration} minutes
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between text-white font-semibold">
                      <span>Total Amount</span>
                      <span className="text-[#c9a96e] text-xl">
                        ₹{parseFloat(selectedService.custom_price).toFixed(0)}
                      </span>
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

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        {provider.allFeedback && provider.allFeedback.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
                <p className="text-white/40 text-sm mt-1">
                  What clients say about {provider.salonName}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-[#1a1a24] to-[#12121a] border border-white/10 rounded-2xl px-5 py-3 self-start sm:self-auto">
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

            <div className="grid sm:grid-cols-2 gap-3">
              {provider.allFeedback.map((fb: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="bg-gradient-to-br from-[#12121a] to-[#1a1a24] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-[#c9a96e]/30 transition-colors duration-300"
                >
                  <div className="flex items-center gap-1">
                    {renderStars(fb.rating)}
                    <span className="ml-1 text-[#c9a96e] text-sm font-semibold">{fb.rating}.0</span>
                  </div>
                  <p className="text-white/75 text-sm leading-relaxed flex-1 line-clamp-4">
                    &ldquo;{fb.comment}&rdquo;
                  </p>
                  <div className="border-t border-white/10 pt-3 flex items-start justify-between gap-2">
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
                    {fb.appointment?.staff?.name && (
                      <div className="bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-lg px-2 py-1 shrink-0">
                        <p className="text-[#c9a96e] text-xs">✂ {fb.appointment.staff.name}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPaymentModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white">Choose Payment Method</h3>
                  <p className="text-white/40 text-sm mt-0.5">How would you like to pay?</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-5 p-3 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-between">
                <span className="text-white/60 text-sm">Total to pay</span>
                <span className="text-[#c9a96e] text-xl font-bold">
                  ₹{selectedService ? parseFloat(selectedService.custom_price).toFixed(0) : "0"}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                {/* Online */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentType("online")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    paymentType === "online"
                      ? "border-[#c9a96e] bg-[#c9a96e]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentType === "online" ? "bg-[#c9a96e]" : "bg-white/10"
                    }`}
                  >
                    <Wifi
                      className={`w-5 h-5 ${
                        paymentType === "online" ? "text-[#0a0a0f]" : "text-white/60"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Pay Online</p>
                    <p className="text-white/40 text-xs mt-0.5">UPI, Cards, Net Banking via Razorpay</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      paymentType === "online" ? "border-[#c9a96e] bg-[#c9a96e]" : "border-white/30"
                    }`}
                  >
                    {paymentType === "online" && (
                      <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />
                    )}
                  </div>
                </motion.button>

                {/* Cash */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentType("cash")}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    paymentType === "cash"
                      ? "border-[#c9a96e] bg-[#c9a96e]/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentType === "cash" ? "bg-[#c9a96e]" : "bg-white/10"
                    }`}
                  >
                    <Banknote
                      className={`w-5 h-5 ${
                        paymentType === "cash" ? "text-[#0a0a0f]" : "text-white/60"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">Pay at Salon</p>
                    <p className="text-white/40 text-xs mt-0.5">Pay cash directly at the salon</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      paymentType === "cash" ? "border-[#c9a96e] bg-[#c9a96e]" : "border-white/30"
                    }`}
                  >
                    {paymentType === "cash" && (
                      <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />
                    )}
                  </div>
                </motion.button>
              </div>

              <motion.button
                whileHover={paymentType ? { scale: 1.02 } : {}}
                whileTap={paymentType ? { scale: 0.98 } : {}}
                onClick={handlePaymentConfirm}
                disabled={!paymentType || paymentLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : paymentType === "cash" ? (
                  <>
                    <Banknote className="w-4 h-4" /> Confirm Booking
                  </>
                ) : paymentType === "online" ? (
                  <>
                    <CreditCard className="w-4 h-4" /> Pay ₹
                    {selectedService ? parseFloat(selectedService.custom_price).toFixed(0) : "0"}
                  </>
                ) : (
                  "Select a payment method"
                )}
              </motion.button>

              <p className="text-white/30 text-xs text-center mt-3">
                {paymentType === "online"
                  ? "🔒 Secured by Razorpay"
                  : paymentType === "cash"
                  ? "💡 Pay at the salon on your appointment day"
                  : ""}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}