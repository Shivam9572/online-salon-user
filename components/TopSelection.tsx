"use client";

import { useState,useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Provider } from "../lib/type";
import {
  MapPin,
  Star,
  Clock,
  Phone,
  Search as SearchIcon,
  X,
  Navigation
} from "lucide-react";

interface TopSalonsSectionProps {
  providers: Provider[];
  searchQuery: string;
  searchLocation: string;
  selectCategory: string;
  onClearSearch?: () => void;
}

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export default function TopSalonsSection({
  providers = [],
  searchQuery,
  searchLocation,
  selectCategory,
  onClearSearch
}: TopSalonsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  
  const router = useRouter();

  // Get user's current location
 const getUserLocation = () => {
  if (!navigator.geolocation) {
    return;
  }

  

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocationLoading(true);
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationLoading(false);
    },
    (error) => {
      console.error("Error getting location:", error);
      setLocationLoading(false);
    }
  );
};


  // Calculate distances for providers when user location or providers change
  const providersWithDistance = useMemo(() => {
    if(!userLocation){
      getUserLocation();
    }
  if (userLocation && providers.length > 0) {
    const providersWithDist = providers.map((provider) => {
      // Check if provider has coordinates
      if (provider.latitude && provider.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        );

        return { ...provider, distance };
      }else{
        
      }

      return provider;
    });

    // Sort by distance (closest first)
    return [...providersWithDist].sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      if (a.distance) return -1;
      if (b.distance) return 1;
      return 0;
    });
  }

  return providers;
}, [userLocation, providers]);

  // Get title based on search
  const getTitle = () => {
    if (searchQuery || searchLocation) {
      return "Search Results";
    }
    return "Top Rated Salons";
  };

  const getSubtitle = () => {
    if (searchQuery?.length > 0 && searchLocation?.length > 0) {
      return `Showing results for "${searchQuery}" in ${searchLocation}`;
    }
    else if (searchQuery?.length > 0) {
      return `Showing results for "${searchQuery}"`;
    }
    else if (searchLocation?.length > 0) {
      return `Showing results in ${searchLocation}`;
    } else if (selectCategory?.length > 0) {
      return `Showing results in ${selectCategory}`;
    } else {
      return "Discover the best salons in your area, rated by thousands of happy customers";

    }
  };

  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch();
    }
  };

  // Format distance for display
  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} m away`;
    }
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <section id="salons-section" className="py-20 bg-[#0a0a0f] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {getTitle()}
            {(searchQuery || searchLocation) && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] to-[#e8c88a]">
                {" "}
                Near You
              </span>
            )}
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            {getSubtitle()}
          </p>
        </motion.div>

        {/* Search Results Badge */}
        {(searchQuery || searchLocation) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a96e]/20 border border-[#c9a96e]/30">
              <SearchIcon className="w-4 h-4 text-[#c9a96e]" />
              <span className="text-[#c9a96e] text-sm font-medium">
                {providersWithDistance.length} {providersWithDistance.length === 1 ? 'result' : 'results'} found
              </span>
              {onClearSearch && (
                <button
                  onClick={handleClearSearch}
                  className="text-white/50 hover:text-white ml-2 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Location Loading Indicator */}
        {locationLoading && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="w-4 h-4 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60 text-sm">Getting your location...</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-[#c9a96e] border-t-transparent rounded-full"
            />
          </div>
        ) : providersWithDistance.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No salons found matching your search</p>
            {onClearSearch && (
              <button
                onClick={handleClearSearch}
                className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold hover:opacity-90 transition-opacity"
              >
                View Top Rated Salons
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providersWithDistance.map((salon, index) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 overflow-hidden hover:border-[#c9a96e]/30 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/book/${salon.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={
                      salon?.image ||
                      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"
                    }
                    
                    width={400}
                    height={300}
                    alt={salon.salonName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />

                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                    <Star className="w-3 h-3 fill-[#c9a96e] text-[#c9a96e]" />
                    <span className="text-white text-xs">
                      {salon.rating || "4.9"}
                    </span>
                  </div>

                  {/* Distance Badge - Calculated from geolocation */}
                  {salon.distance && (
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-[#c9a96e]" />
                      <span className="text-[#c9a96e] text-xs font-medium">
                        {formatDistance(salon.distance)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-white text-xl font-semibold mb-2 group-hover:text-[#c9a96e] transition-colors">
                    {salon.salonName}
                  </h3>

                  <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{salon.salonAddress}</span>
                  </div>

                  <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {salon.opening_time?.slice(0, 5)} -{" "}
                      {salon.closing_time?.slice(0, 5)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#c9a96e]" />
                      <span className="text-white/60 text-xs">
                        {salon.salonContact}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/book/${salon.id}`);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      Book Now
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}