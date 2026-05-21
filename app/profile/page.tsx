// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { 
    User, 
    Mail, 
    MapPin, 
    Phone, 
    Edit2, 
    Save, 
    X, 
    Camera, 
    Lock,
    CheckCircle,
    AlertCircle,
    LogOut
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import {UserData} from "../../context/AuthContext";
import Image from "next/image";
import Link from "next/link";



export default function ProfilePage() {
    const {  logout, refreshAuth } = useAuth();
    const [profile, setProfile] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
   
    
    // Form states
    const [editData, setEditData] = useState({
        name: "",
        address: "",
        mobile: ""
    });
    
    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

   

    const fetchProfile = async () => {
        try {
            const response = await apiFetch("/customer/profile");
            const data = await response.json();
             if(response.status ===401){
                alert("session expired");
                return logout();
            }
            if (response.ok) {
                setProfile(data?.user);
                setEditData({
                    name: data?.user?.name || "",
                    address: data?.user?.address || "",
                    mobile: data?.user?.mobile || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);
        
        try {
            const response = await apiFetch("/customer/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData)
            });
            if(response.status ===401){
                alert("session expired");
                 logout();

            }
            const data = await response.json();
            
            if (response.ok ) {
                setProfile(data.user);
                setIsEditing(false);
                setMessage({ type: "success", text: "Profile updated successfully!" });
                
                // Update auth context user data
                localStorage.setItem("user_data", JSON.stringify(data.user));
                
                
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to update profile" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setMessage(null);
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            setPasswordLoading(false);
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            setPasswordLoading(false);
            return;
        }
        
        try {
            const response = await apiFetch("/profile/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setMessage({ type: "success", text: "Password changed successfully!" });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to change password" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setPasswordLoading(false);
        }
    };
     useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-[#c9a96e] border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-12 px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Message Toast */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className={`fixed top-24 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
                                message.type === "success" 
                                    ? "bg-green-500/20 border border-green-500/30 text-green-400" 
                                    : "bg-red-500/20 border border-red-500/30 text-red-400"
                            }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            <span className="text-sm">{message.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#12121a] to-[#1a1a24] rounded-2xl border border-white/10 p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#e8c88a] flex items-center justify-center shadow-xl">
                                {profile?.avatar ? (
                                    <Image 
                                        src={profile.avatar} 
                                        alt={profile.name}
                                        width={96}
                                        height={96}
                                        className="rounded-2xl object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-[#0a0a0f]" />
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[#c9a96e] text-[#0a0a0f] hover:scale-110 transition-transform shadow-lg">
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                                {profile?.name}
                            </h1>
                            <p className="text-white/50 text-sm">{profile?.email}</p>
                            {profile?.isActivate && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                    <CheckCircle className="w-3 h-3" />
                                    Activated
                                </span>
                            )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {!isEditing ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </motion.button>
                            ) : (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsEditing(false)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white/70 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#e8c88a] text-[#0a0a0f] font-semibold disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Save
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Profile Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#12121a] rounded-2xl border border-white/10 p-6"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-[#c9a96e]" />
                            Personal Information
                        </h2>
                        
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-white/60 text-sm mb-1.5">Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-white text-base">{profile?.name}</p>
                                )}
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block text-white/60 text-sm mb-1.5 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    Email Address
                                </label>
                                <p className="text-white text-base">{profile?.email}</p>
                                <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
                            </div>
                            
                            {/* Mobile */}
                            <div>
                                <label className="block text-white/60 text-sm mb-1.5 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    Mobile Number
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editData.mobile}
                                        onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors"
                                    />
                                ) : (
                                    <p className="text-white text-base">{profile?.mobile || "Not provided"}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Address & Security */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* Address */}
                        <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#c9a96e]" />
                                Address
                            </h2>
                            
                            {isEditing ? (
                                <textarea
                                    value={editData.address}
                                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                    placeholder="Your full address"
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#c9a96e]/50 transition-colors resize-none"
                                />
                            ) : (
                                <p className="text-white text-base leading-relaxed">
                                    {profile?.address || "No address provided"}
                                </p>
                            )}
                        </div>
                        
                        {/* Security */}
                        <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6">
                           
                            
                            
                            
                            <button
                                onClick={logout}
                                className="flex items-center justify-between w-full mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all group"
                            >
                                <span className="text-red-400">Logout Account</span>
                                <LogOut className="w-4 h-4 text-red-400" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Change Password Modal */}
           
        </div>
    );
}