// app/my-bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Phone,
  Calendar as CalendarIcon,
  ArrowLeft,
  CreditCard,
  Banknote,
  Star,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import Link from "next/link";

interface Feedback {
  id?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

interface Appointment {
  id: string;
  customer_id: string;
  provider_id: string;
  staff_id: string;
  service_id: string;
  chair_id: string | null;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_status: string;
  payment_type: "online" | "cash";
  amount: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  feedback: Feedback | null;
  provider: {
    id: string;
    salonName: string;
    salonAddress: string;
    salonContact: string;
  };
  staff: {
    id: string;
    name: string;
    phone: string;
  };
  ProviderService: {
    custom_price: string;
    custom_duration: number;
    custom_description: string;
    Service: {
      name: string;
    };
  };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showFeedbackViewModal, setShowFeedbackViewModal] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<Feedback | null>(null);



  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setCancellingId(appointmentId);
    try {
      const response = await apiFetch(`/appointment/${appointmentId}/cancel`, {
        method: "delete",
      });
      const data = await response.json();

      if (data.success) {
        alert("Appointment cancelled successfully");
        fetchAppointments();
      } else {
        alert(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Network error. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await apiFetch(`/feedback/${feedbackAppointment?.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await response.json();

      if (data.success) {
        alert("Thank you for your feedback!");
        setShowFeedbackModal(false);
        setRating(0);
        setComment("");
        fetchAppointments(); // Refresh to show feedback
      } else {
        alert(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Network error. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openFeedbackModal = (appointment: Appointment) => {
    setFeedbackAppointment(appointment);
    setRating(0);
    setComment("");
    setShowFeedbackModal(true);
  };

  const viewFeedbackDetails = (feedback: Feedback) => {
    setViewFeedback(feedback);
    setShowFeedbackViewModal(true);
  };

  const viewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-white/10 text-white/60 border-white/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <ClockIcon className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "unpaid":
        return "bg-red-500/20 text-red-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      case "refunded":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getPaymentIcon = (paymentType: string) => {
    return paymentType === "online" ? <CreditCard className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />;
  };

  // Check if appointment can be cancelled (pending or confirmed AND not in the past)
  const canCancel = (appointment: Appointment) => {
    const now = new Date();
    const appointmentStart = new Date(appointment.start_time);
    const isUpcoming = appointmentStart > now;
    return (appointment.status === "pending" || appointment.status === "confirmed") && isUpcoming;
  };

  // Check if appointment is in the past
  const isPastAppointment = (appointment: Appointment) => {
    const now = new Date();
    const appointmentEnd = new Date(appointment.end_time);
    return appointmentEnd < now;
  };

  // Direct format without timezone conversion
  

  const formatTimeOnly = (dateString: string) => {
    const timePart = dateString.split('T')[1]?.split('.')[0];
    if (!timePart) return '';
    
    let [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };

  const formatFullDate = (dateString: string) => {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getServiceName = (appointment: Appointment) => {
    return appointment.ProviderService?.Service?.name || "Service";
  };

  const getServicePrice = (appointment: Appointment) => {
    return parseFloat(appointment.ProviderService?.custom_price || "0");
  };

  const getServiceDuration = (appointment: Appointment) => {
    return appointment.ProviderService?.custom_duration || 0;
  };



  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/appointment?page=${currentPage}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

      useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      return;
    }
    fetchAppointments();
  }, [isLoggedIn, currentPage]);

  // Render stars for rating
  const renderStars = (ratingValue: number, size: string = "w-5 h-5", interactive: boolean = false, onRatingChange?: (rating: number) => void, onHoverChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            onMouseEnter={() => interactive && onHoverChange && onHoverChange(star)}
            onMouseLeave={() => interactive && onHoverChange && onHoverChange(0)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
            disabled={!interactive}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || ratingValue) : ratingValue)
                  ? "fill-[#c9a96e] text-[#c9a96e]"
                  : "text-white/30"
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-[72px] pb-12">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#c9a96e] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white">My Bookings</h1>
          <p className="text-white/60 mt-2">View and manage your appointments</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-[#c9a96e] border-t-transparent rounded-full"
            />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Bookings</h3>
            <p className="text-white/60 mb-6">{error}</p>
            <button
              onClick={fetchAppointments}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Calendar className="w-20 h-20 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Bookings Yet</h3>
            <p className="text-white/60 mb-6">You haven't made any appointments yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
            >
              Browse Salons
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Appointments List */}
            <div className="space-y-4">
              {appointments.map((appointment, index) => {
                const isPast = isPastAppointment(appointment);
                const showCancel = canCancel(appointment);
                const isCompleted = appointment.status === "completed";
                const hasFeedback = appointment.feedback !== null;
                const startDate = formatFullDate(appointment.start_time);
                const startTime = formatTimeOnly(appointment.start_time);
                const endTime = formatTimeOnly(appointment.end_time);
                
                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border p-6 hover:border-white/20 transition-all ${
                      isPast ? 'border-white/5 opacity-75' : 'border-white/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Section - Salon Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a96e]/20 to-[#e8c88a]/20 flex items-center justify-center shrink-0">
                            <Scissors className="w-6 h-6 text-[#c9a96e]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-lg font-semibold text-white">
                                {appointment.provider.salonName}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(appointment.status)}`}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(appointment.status)}
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(appointment.payment_status)}`}>
                                <span className="flex items-center gap-1">
                                  {getPaymentIcon(appointment.payment_type)}
                                  {appointment.payment_status === "paid" ? "Paid" : 
                                   appointment.payment_status === "pending" ? "Payment Pending" : 
                                   appointment.payment_status === "unpaid" ? "Unpaid" :
                                   appointment.payment_status}
                                </span>
                              </span>
                              {isPast && appointment.status !== "cancelled" && (
                                <span className="px-2 py-0.5 rounded-full text-xs border bg-gray-500/20 text-gray-400 border-gray-500/30">
                                  Completed
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-white/60">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>{startDate}</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/60">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {startTime} - {endTime}
                                </span>
                                <span className="text-white/40">
                                  ({getServiceDuration(appointment)} min)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-white/60">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{appointment.provider.salonAddress}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Center Section - Service & Staff */}
                      <div className="flex flex-col sm:flex-row gap-4 px-0 lg:px-6 py-4 lg:py-0 border-y lg:border-y-0 border-white/10">
                        <div>
                          <p className="text-white/40 text-xs mb-1">Service</p>
                          <p className="text-white font-medium">{getServiceName(appointment)}</p>
                          <p className="text-[#c9a96e] text-sm">₹{getServicePrice(appointment).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-white/40 text-xs mb-1">Staff</p>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#c9a96e]" />
                            <p className="text-white font-medium">{appointment.staff.name}</p>
                          </div>
                          <p className="text-white/40 text-xs mt-1">{appointment.staff.phone}</p>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => viewDetails(appointment)}
                          className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all text-sm"
                        >
                          View Details
                        </button>
                        {isCompleted && (
                          hasFeedback ? (
                            <button
                              onClick={() => viewFeedbackDetails(appointment.feedback!)}
                              className="px-4 py-2 rounded-xl border border-green-500/50 text-green-400 hover:bg-green-500/10 transition-all text-sm flex items-center gap-2"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              View Feedback
                            </button>
                          ) : (
                            <button
                              onClick={() => openFeedbackModal(appointment)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold text-sm flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Rate Us
                            </button>
                          )
                        )}
                        {showCancel && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancellingId === appointment.id}
                            className="px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === appointment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : (
                              "Cancel"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 mx-auto" />
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
                            : "border border-white/20 text-white hover:bg-white/5"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={currentPage === pagination.totalPages}
                  className="w-10 h-10 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 mx-auto" />
                </button>
              </div>
            )}

            {/* Pagination Info */}
            {pagination && (
              <div className="text-center text-white/40 text-sm mt-4">
                Showing {appointments.length} of {pagination.totalItems} bookings
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Appointment Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Salon Info */}
                <div className="pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Scissors className="w-5 h-5 text-[#c9a96e]" />
                    <h3 className="text-xl font-semibold text-white">
                      {selectedAppointment.provider.salonName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm ml-8">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedAppointment.provider.salonAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-sm ml-8 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedAppointment.provider.salonContact}</span>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-white/40 text-xs mb-1">Date & Time</p>
                    <p className="text-white font-medium">
                      {formatFullDate(selectedAppointment.start_time)}
                    </p>
                    <p className="text-[#c9a96e] text-sm">
                      {formatTimeOnly(selectedAppointment.start_time)} - {formatTimeOnly(selectedAppointment.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Status</p>
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusIcon(selectedAppointment.status)}
                        {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(selectedAppointment.payment_type)}
                      <span className="text-white">
                        {selectedAppointment.payment_type === "online" ? "Online Payment" : "Cash at Salon"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs mb-1">Payment Status</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(selectedAppointment.payment_status)}`}>
                      {selectedAppointment.payment_status === "paid" ? "✓ Paid" : 
                       selectedAppointment.payment_status === "pending" ? "⏳ Pending" : 
                       selectedAppointment.payment_status === "unpaid" ? "Unpaid" :
                       selectedAppointment.payment_status}
                    </span>
                  </div>
                </div>

                {/* Service Details */}
                <div className="pb-4 border-b border-white/10">
                  <p className="text-white/40 text-xs mb-2">Service Details</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{getServiceName(selectedAppointment)}</p>
                      <p className="text-white/60 text-sm">
                        Duration: {getServiceDuration(selectedAppointment)} minutes
                      </p>
                      {selectedAppointment.ProviderService?.custom_description && (
                        <p className="text-white/40 text-sm mt-1">
                          {selectedAppointment.ProviderService.custom_description}
                        </p>
                      )}
                    </div>
                    <p className="text-[#c9a96e] text-xl font-bold">
                      ₹{getServicePrice(selectedAppointment).toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Staff Info */}
                <div className="pb-4 border-b border-white/10">
                  <p className="text-white/40 text-xs mb-2">Stylist</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c9a96e]" />
                    <div>
                      <p className="text-white font-medium">{selectedAppointment.staff.name}</p>
                      <p className="text-white/60 text-sm">{selectedAppointment.staff.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Feedback Section in Modal */}
                {selectedAppointment.status === "completed" && selectedAppointment.feedback && (
                  <div className="pb-4 border-b border-white/10">
                    <p className="text-white/40 text-xs mb-2">Your Feedback</p>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(selectedAppointment.feedback.rating, "w-4 h-4")}
                      </div>
                      {selectedAppointment.feedback.comment && (
                        <p className="text-white/80 text-sm mt-2">{selectedAppointment.feedback.comment}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="pb-4 border-b border-white/10">
                    <p className="text-white/40 text-xs mb-2">Special Notes</p>
                    <p className="text-white/80 text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Booking Info */}
                <div>
                  <p className="text-white/40 text-xs mb-2">Booking Information</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/60">
                      <span className="text-white/40">Booked on:</span> {formatFullDate(selectedAppointment.createdAt)} at {formatTimeOnly(selectedAppointment.createdAt)}
                    </p>
                    <p className="text-white/60">
                      <span className="text-white/40">Booking ID:</span> {selectedAppointment.id.slice(0, 8)}...
                    </p>
                    {selectedAppointment.razorpay_payment_id && (
                      <p className="text-white/60">
                        <span className="text-white/40">Transaction ID:</span> {selectedAppointment.razorpay_payment_id.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {canCancel(selectedAppointment) && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleCancelAppointment(selectedAppointment.id);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
                {selectedAppointment.status === "completed" && !selectedAppointment.feedback && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openFeedbackModal(selectedAppointment);
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Rate Your Experience
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Submission Modal */}
      <AnimatePresence>
        {showFeedbackModal && feedbackAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeedbackModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Rate Your Experience</h2>
                  <p className="text-white/60 text-sm mt-1">
                    {feedbackAppointment.provider.salonName}
                  </p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/60 text-sm">Service</p>
                  <p className="text-white font-semibold">{getServiceName(feedbackAppointment)}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {formatFullDate(feedbackAppointment.start_time)} at {formatTimeOnly(feedbackAppointment.start_time)}
                  </p>
                </div>

                {/* Rating Stars */}
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-3">How would you rate your experience?</p>
                  <div className="flex justify-center">
                    {renderStars(rating, "w-8 h-8", true, setRating, setHoverRating)}
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Share your experience (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || rating === 0}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingFeedback ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsUp className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback View Modal */}
      <AnimatePresence>
        {showFeedbackViewModal && viewFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFeedbackViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Feedback</h2>
                  <p className="text-white/60 text-sm mt-1">Thank you for sharing your experience</p>
                </div>
                <button
                  onClick={() => setShowFeedbackViewModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-2">Your Rating</p>
                  <div className="flex justify-center">
                    {renderStars(viewFeedback.rating, "w-8 h-8")}
                  </div>
                </div>

                {/* Comment */}
                {viewFeedback.comment && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/60 text-sm mb-2">Your Review</p>
                    <p className="text-white leading-relaxed">{viewFeedback.comment}</p>
                  </div>
                )}

                {/* Thank You Message */}
                <div className="text-center pt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Thanks for your feedback!</span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowFeedbackViewModal(false)}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}