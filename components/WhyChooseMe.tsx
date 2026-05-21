"use client";

import { motion } from "framer-motion";
import {
  
  
  Clock,
 
  Award,
  Shield,
  Heart
} from "lucide-react";


export default function WhyChooseUs  () {
  const features = [
    {
      icon: Award,
      title: "Expert Stylists",
      description: "Certified professionals with years of experience"
    },
    {
      icon: Shield,
      title: "Safe & Hygienic",
      description: "Strict sanitization protocols followed"
    },
    {
      icon: Clock,
      title: "Instant Booking",
      description: "Book appointments in just a few clicks"
    },
    {
      icon: Heart,
      title: "Best Price Guarantee",
      description: "Competitive prices with no hidden charges"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-[#12121a] to-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] to-[#e8c88a]"> Us</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Experience the best salon services with our premium features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-[#c9a96e]/20 to-[#e8c88a]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-[#c9a96e]" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/40 text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};