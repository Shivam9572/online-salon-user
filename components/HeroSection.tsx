"use client";

// Hero Section Component
import { Provider } from "../lib/type";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Scissors,
  Award,
  Shield,
  Heart,Star
} from "lucide-react";

interface HeroSectionProps {
  onSearchResults?: (providers: Provider[], searchQuery: string, location: string) => void;
  setSearchLoading?: (loading: boolean) => void;
}

export default function HeroSection({ onSearchResults, setSearchLoading }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery && !location) return;

    if (setSearchLoading) setSearchLoading(true);
    setIsSearching(true);

    try {
      const searchResponse = await apiFetch(
        `/customer/providers/search?keyword=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location || "")}`
      );
      const searchData = await searchResponse.json();
      
      let searchResults: Provider[] = [];
      if (searchData.success && searchData.providers) {
        searchResults = searchData.providers;
      }

      if (onSearchResults) {
        onSearchResults(searchResults, searchQuery, location);
      }
      
      const salonsSection = document.getElementById("salons-section");
      if (salonsSection) {
        salonsSection.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error searching salons:", error);
      if (onSearchResults) {
        onSearchResults([], searchQuery, location);
      }
    } finally {
      if (setSearchLoading) setSearchLoading(false);
      setIsSearching(false);
    }
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c9a96e]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#e8c88a]/10 rounded-full blur-[120px] animate-pulse delay-1000" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-20 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#c9a96e]/20 to-[#e8c88a]/20 border border-[#c9a96e]/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-[#c9a96e]" />
              <span className="text-[#c9a96e] text-sm font-medium">Premium Salon Booking</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Book Salon Appointments
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] to-[#e8c88a]">
                {" "}Instantly
              </span>
            </h1>

            <p className="text-white/50 text-lg mb-8 max-w-lg">
              Discover top-rated salons, expert stylists, and premium services at your fingertips.
            </p>

            {/* Search Section */}
            <div className="space-y-4 mb-8">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-[#c9a96e]/50 transition-all duration-300">
                <Search className="w-5 h-5 text-[#c9a96e] shrink-0" />
                <input
                  type="text"
                  placeholder="Search for service or salon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-transparent text-white placeholder-white/40 focus:outline-none flex-1 min-w-0 text-base"
                />
              </div>

              {/* Location Input */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-[#c9a96e]/50 transition-all duration-300">
                <MapPin className="w-5 h-5 text-[#c9a96e] shrink-0" />
                <input
                  type="text"
                  placeholder="Select location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-transparent text-white placeholder-white/40 focus:outline-none flex-1 min-w-0 text-base"
                />
              </div>

              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSearching ? "Searching..." : "Search Salons"}
              </motion.button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToServices}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold flex items-center justify-center gap-2"
              >
                Explore Services
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#c9a96e]" />
                <span>100+ Expert Stylists</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#c9a96e]" />
                <span>Secure Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#c9a96e]" />
                <span>10K+ Happy Customers</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20">
              <Image
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop"
                alt="Salon Stylist"
                width={600}
                height={600}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-10 -right-5 md:right-10 bg-[#12121a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c9a96e] to-[#e8c88a] flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-[#0a0a0f]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Next Appointment</p>
                  <p className="text-white/40 text-xs">Today, 3:00 PM</p>
                </div>
              </div>
            </motion.div>

            {/* Rating Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-10 -left-5 md:left-10 bg-[#12121a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-xl z-20"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#c9a96e] text-[#c9a96e]" />
                  ))}
                </div>
                <span className="text-white text-sm font-semibold">4.9</span>
                <span className="text-white/40 text-xs">(2.5k reviews)</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}