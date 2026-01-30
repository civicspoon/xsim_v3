"use client";
import React from "react";
import { LayoutDashboard, BookOpen, ChevronRight } from "lucide-react"; // ✅ Added icons
import { useRouter } from "next/navigation"; // ✅ Added router for navigation
import UserYearCBT from "../components/UserYearCBT";
import YearlyForensicLog from "../components/YearlyForensicLog";

export default function Dashboard() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#050505]/95 text-white p-6 md:p-10 font-sans relative overflow-auto">
            {/* Minimalist Background Atmosphere */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-400 mx-auto space-y-10">
                {/* --- LEAN HEADER --- */}
                <header className="flex items-center justify-between border-b border-white/5 pb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <LayoutDashboard size={14} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tactical Overview</span>
                        </div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter bg-linear-to-b from-white to-white/30 bg-clip-text text-transparent">
                            System Dashboard
                        </h1>

                        {/* --- BEAUTIFIED USER MANUAL BUTTON --- */}
                        <button
                            onClick={() => router.push('/pages/manual')}
                            className="group relative mt-4 flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg transition-all duration-300 hover:bg-red-600 hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] overflow-hidden"
                        >
                            {/* Animated Background Glow */}
                            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                            <BookOpen size={16} className="text-red-500 group-hover:text-white transition-colors" />
                            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-gray-300 group-hover:text-white transition-colors">
                                Access User Manual
                            </span>
                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
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
            <div className="fixed bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-600/20 to-transparent z-50" />

            {/* Tailwind Shimmer Animation (Add this to your globals.css if not exists) */}
            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}