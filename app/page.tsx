// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServiceSection";
import TopSalonsSection from "../components/TopSelection";
import WhyChooseUs from "../components/WhyChooseMe";
import { Provider } from "@/lib/type";



export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | "">("");
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | "">("");
  const [searchLocation, setSearchLocation] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  



  const handleBookNow = (categoryName: string) => {
    console.log(categoryName);
    setSelectedCategory(categoryName);
    setSearchLocation("");
    setSearchQuery("");
    handleNearMeFromNav(categoryName);
  };

  const handleSearchResults = (providers: Provider[], query: string, location: string) => {
    setProviders(providers);
    setSelectedCategory("");
    setSearchQuery(query);
    setSearchLocation(location);
  };

  const handleClearSearch = () => {
    handleNearMeFromNav("");
    setSearchQuery("");
    setSearchLocation("");
    setSelectedCategory("");
  };

  const handleNearMeFromNav = (category:string) => {

    // Get user location and fetch nearby salons
    if (navigator.geolocation) {
        
      setIsLoadingNearby(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const { apiFetch } = await import("../lib/api");
            const response = await apiFetch(
              `/customer/providers/nearby?latitude=${latitude}&longitude=${longitude}&categoryName=${category}`, { method: "GET" }
            );
            const data = await response.json();
            if (data.success && data.providers) {
              setProviders(data.providers);
              // Clear search results
              setSearchQuery("");
              setSearchLocation("");
              setSelectedCategory("");
              const salonsSection = document.getElementById("salons-section");
              if (salonsSection) {
                salonsSection.scrollIntoView({ behavior: "smooth" });
              }
            }
          } catch (error) {
            console.error("Error fetching nearby salons:", error);
          } finally {
            setIsLoadingNearby(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingNearby(false);
        }
      );
    }
  };

  // This effect will be triggered from layout
  useEffect(() => {
    handleNearMeFromNav("");

    // Listen for custom event from Navbar
    window.addEventListener("nearMeClick",()=> handleNearMeFromNav(""));
    return () => {window.removeEventListener("nearMeClick",()=> handleNearMeFromNav(""))
      setProviders([]);
      setSearchLocation("");
      setSearchQuery("");
      setSelectedCategory("");
    };
  }, []);

  return (
    <main className="bg-[#0a0a0f] min-h-screen">
      <div className="pt-[72px]">
        <HeroSection
          onSearchResults={handleSearchResults}
          setSearchLoading={setIsSearchLoading}
        />
         <ServicesSection
          onBookNow={handleBookNow}
        />
        <TopSalonsSection
          providers={providers}
          selectCategory={selectedCategory}
          searchQuery={searchQuery}
          searchLocation={searchLocation}
          onClearSearch={handleClearSearch}
        /> 
        <WhyChooseUs />
      </div>
    </main>
  );
}