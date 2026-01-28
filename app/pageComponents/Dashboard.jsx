"use client";
import React from "react";
import { LayoutDashboard } from "lucide-react";
import UserYearCBT from "../components/UserYearCBT";
import YearlyForensicLog from "../components/YearlyForensicLog";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-[#050505]/95 text-white p-6 md:p-10 font-sans relative overflow-auto">
            {/* Minimalist Background Atmosphere */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-10">
                {/* --- LEAN HEADER --- */}
                <header className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <LayoutDashboard size={14} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tactical Overview</span>
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
                            System Dashboard
                        </h1>
                    </div>
                    
                    <div className="hidden md:block text-right">
                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Network Status</p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                            <span className="text-xs font-bold text-green-500 uppercase">Encrypted Link Active</span>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        </div>
                    </div>
                </header>

                {/* --- MAIN INTEGRATED COMPONENT --- */}
                <main className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <UserYearCBT />
                </main>
            </div>

            {/* Subtle Footer Scanline Effect */}
            <div className="fixed bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent z-50" />
        </div>
    );
}