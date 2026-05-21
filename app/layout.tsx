// app/layout.tsx

import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { NearMeProvider } from "../context/NearMeContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body  suppressHydrationWarning >
        <AuthProvider>
          <NearMeProvider>
            <Navbar />
            {children}
            <Footer />
          </NearMeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}