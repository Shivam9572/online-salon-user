// components/Footer.tsx (Simplified - No Icons Version)
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const footerLinks = {
  company: [
    { label: "About Us", href: "#" },
    { label: "Our Story", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
  ],
  services: [
    { label: "Haircut & Styling", href: "#" },
    { label: "Hair Color", href: "#" },
    { label: "Manicure & Pedicure", href: "#" },
    { label: "Facial & Spa", href: "#" },
    { label: "Makeup", href: "#" },
    { label: "Bridal Packages", href: "#" },
  ],
  support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "FAQs", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Refund Policy", href: "#" },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#0a0a0f] to-[#050508] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#e8c88a] flex items-center justify-center">
                <span className="text-[#0a0a0f] text-xl font-bold">✂️</span>
              </div>
              <span className="text-white font-bold text-xl">
                Apna<span className="text-[#c9a96e]">Salon</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Experience premium salon services at your doorstep. Book appointments with expert stylists.
            </p>
            <div className="space-y-2">
              <p className="text-white/40 text-sm">📍 123 Salon Street, Beauty District</p>
              <p className="text-white/40 text-sm">📞 +91 98765 43210</p>
              <p className="text-white/40 text-sm">✉️ hello@apnasalon.com</p>
              <p className="text-white/40 text-sm">🕐 10:00 AM - 8:00 PM (Daily)</p>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-white/40 hover:text-[#c9a96e] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-white/40 hover:text-[#c9a96e] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href}
                    className="text-white/40 hover:text-[#c9a96e] text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="text-white/40 text-center md:text-left">
            © {currentYear} ApnaSalon. All rights reserved.
          </div>
          
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/40 hover:text-[#c9a96e] transition-colors text-xs">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-[#c9a96e] transition-colors text-xs">
              Terms of Use
            </Link>
            <Link href="/cookies" className="text-white/40 hover:text-[#c9a96e] transition-colors text-xs">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}