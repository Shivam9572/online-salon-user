"use client";

import { motion } from "framer-motion";
import {
  Star,
  Sparkles,
  Scissors,
  ChevronRight,
  User,
  Briefcase,
  Heart,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import Image from "next/image";


// Types
interface Category {
  id: string;
  name: string;
  description: string;
  image: string | null;
  is_active: boolean;
}



// Map category names to icons and gradient colors
const categoryIcons: Record<string, { icon: any; color: string }> = {
  "Hair Services": { icon: Scissors, color: "from-[#c9a96e] to-[#e8c88a]" },
  "Nail Services": { icon: Star, color: "from-blue-500 to-cyan-500" },
  "Skin & Face": { icon: Heart, color: "from-green-500 to-emerald-500" },
  "Beauty Services": { icon: Sparkles, color: "from-purple-500 to-pink-500" },
  "Mens / Barbershop": { icon: User, color: "from-orange-500 to-red-500" },
};

// Fallback images for categories
const categoryImages = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&h=300&fit=crop",
  
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop",
];

interface ServicesSectionProps {
  onBookNow?: (categoryName: string) => void;
}

export default function ServicesSection({ 
  onBookNow
}: ServicesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories on mount

  
  

  const fetchCategories = async () => {
    try {
      const response = await apiFetch("/category",{
        method:"GET"
      });
      if(!response){
        throw new Error("failed to fecth categories");
      }
      const data = await response.json();
      if (data.categories) {
        const activeCategories = data.categories.filter((cat: Category) => cat.is_active);
        setCategories(activeCategories);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    } 
  };

 
useState(()=>{
   fetchCategories();
})
  if (loading) {
    return (
      <section id="services" className="py-20 bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="flex justify-center items-center min-h-[400px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-3 border-[#c9a96e] border-t-transparent rounded-full"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-[#0a0a0f] to-[#12121a] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Premium Services
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] to-[#e8c88a]"> For You</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Discover our wide range of professional salon services tailored to your needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const categoryInfo = categoryIcons[category.name] || { 
              icon: Scissors, 
              color: "from-[#c9a96e] to-[#e8c88a]" 
            };
            const Icon = categoryInfo.icon;
            const randomImage = categoryImages[index % categoryImages.length];
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 overflow-hidden hover:border-[#c9a96e]/50 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={randomImage}
                    alt={category.name}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                </div>
                
                <div className="p-6 relative">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryInfo.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 -mt-10 border-4 border-[#0a0a0f]`}>
                    <Icon className="w-7 h-7 text-[#0a0a0f]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-white/40 text-sm mb-4 line-clamp-2">
                    {category.description || "Professional service by expert stylists"}
                  </p>
                  <button
                    onClick={() => {onBookNow && onBookNow(category.name)}}
                    className="text-[#c9a96e] text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer"
                  >
                    Book Now <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}