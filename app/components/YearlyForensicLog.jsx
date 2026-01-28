"use client";
import React, { useEffect, useState, useCallback } from 'react';
import {
    Loader2, ShieldAlert, Search, Clock, FileText, Filter, Activity, Target, Zap
} from 'lucide-react';
import { getOperatorProfile } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3015";

const YearlyForensicLog = () => {
    const [logs, setLogs] = useState([]);
    const [years, setYears] = useState([new Date().getFullYear()]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // ✅ ตรรกะประเมิน 5 ระดับ (ดีเยี่ยม - แย่)
    const getDailyStatus = (rate) => {
        const acc = parseFloat(rate) || 0;
        if (acc > 80) return { label: "ดีเยี่ยม", color: "text-blue-400", bg: "bg-blue-400/10" };
        if (acc > 70) return { label: "ดีมาก", color: "text-green-400", bg: "bg-green-400/10" };
        if (acc > 60) return { label: "ดี", color: "text-yellow-400", bg: "bg-yellow-400/10" };
        if (acc > 50) return { label: "ปรับปรุง", color: "text-orange-500", bg: "bg-orange-500/10" };
        return { label: "แย่", color: "text-red-500", bg: "bg-red-500/10" };
    };

    // ✅ ฟังก์ชันการสรุปผลรายวัน (Aggregation Logic)
    const fetchAndAggregate = useCallback(async (userId, year) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/training/stats/${userId}?year=${year}`);
            const result = await res.json();

            if (result.success && Array.isArray(result.data)) {
                // จัดกลุ่มข้อมูลตามวันที่
                const dailyGroup = result.data.reduce((acc, current) => {
                    const dateKey = new Date(current.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD

                    if (!acc[dateKey]) {
                        acc[dateKey] = {
                            displayDate: current.createdAt,
                            sessionCount: 0,
                            sumTime: 0,
                            sumHitsRate: 0,
                        };
                    }

                    // ป้องกัน NaN: แปลงค่าเป็นตัวเลขเสมอ
                    const time = parseInt(current.time_used) || 0;
                    const rate = parseFloat(current.hitsRate) || 0;

                    acc[dateKey].sessionCount += 1;
                    acc[dateKey].sumTime += time;
                    acc[dateKey].sumHitsRate += rate;

                    return acc;
                }, {});

                // แปลงเป็น Array และคำนวณค่าเฉลี่ย
                const aggregated = Object.values(dailyGroup).map(day => {
                    const sessions = day.sessionCount || 1;
                    return {
                        date: day.displayDate,
                        sessions: sessions,
                        totalTime: day.sumTime,
                        avgRate: (day.sumHitsRate / sessions).toFixed(1)
                    };
                });

                setLogs(aggregated);
            }
        } catch (err) {
            console.error("Aggregation Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const profile = await getOperatorProfile();
                setUser(profile);

                const yearRes = await fetch(`${API_URL}/training/years/${profile.userID}`);
                const yearData = await yearRes.json();

                if (yearData.success && yearData.years.length > 0) {
                    setYears(yearData.years);
                    const latestYear = yearData.years[0];
                    setSelectedYear(latestYear);
                    await fetchAndAggregate(profile.userID, latestYear);
                } else {
                    await fetchAndAggregate(profile.userID, selectedYear);
                }
            } catch (err) { console.error(err); }
        };
        init();
    }, [fetchAndAggregate]);

    const handleYearChange = async (e) => {
        const year = e.target.value;
        setSelectedYear(year);
        if (user) await fetchAndAggregate(user.userID, year);
    };

    return (
        <div className="min-h-screen bg-[#050505]/95 text-white p-6 md:p-10 font-sans relative overflow-auto">

            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-2xl shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        <Activity size={20} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase  text-white">Yearly Activity History</h3>
                        <p className="text-xl text-gray-300 uppercase font-black  leading-none">
                            บันทึกกิจกรรมสรุปรายวันประจำปี {selectedYear}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 p-2 pl-4 rounded-2xl border border-white/10 hover:border-red-600/50 transition-all">
                    <Filter size={14} className="text-gray-300" />
                    <span className="text-xl font-black uppercase text-gray-300 ">เลือกปีงบประมาณ:</span>
                    <select
                        value={selectedYear}
                        onChange={handleYearChange}
                        className="bg-transparent text-sm font-black text-white focus:outline-none cursor-pointer pr-4 appearance-none"
                    >
                        {years.map(y => <option key={y} value={y} className="bg-[#0a0a0a]">{y}</option>)}
                    </select>
                </div>
            </div>

            {/* --- LOG TABLE --- */}
            <div className="overflow-x-auto custom-scrollbar">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-red-600" size={40} />
                        <span className="text-xl font-black uppercase  text-red-600 animate-pulse">Scanning Database...</span>
                    </div>
                ) : logs.length > 0 ? (
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-xl font-black text-gray-300 uppercase  px-4">
                                <th className="pb-4 pl-8 text-red-600/50">วันที่สรุปผล</th>
                                <th className="pb-4 text-center">รอบที่ทดสอบ</th>
                                <th className="pb-4 text-center">ระดับมาตรฐาน</th>
                                <th className="pb-4 text-center">ความแม่นยำเฉลี่ย</th>
                                <th className="pb-4 text-center text-green-500">เวลารวม (SUM)</th>
                                <th className="pb-4 pr-8 text-right">สถิติ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, idx) => {
                                const status = getDailyStatus(log.avgRate);
                                return (
                                    <tr key={idx} className="group bg-white/[0.03] hover:bg-white/[0.07] transition-all relative overflow-auto rounded-[2rem]">
                                        <td className="py-5 pl-8 rounded-l-[2rem] border-l border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white group-hover:text-red-500 transition-colors">
                                                    {new Date(log.date).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center font-black text-xs text-white/80">
                                            {log.sessions} Session
                                        </td>
                                        <td className="text-center">
                                            <span className={`text-sm font-black px-3 py-1 rounded-full border border-current uppercase ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="text-center font-black text-sm">
                                            <span className={status.color}>{log.avgRate}%</span>
                                        </td>
                                        <td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock size={12} className="text-green-500" />
                                                <span className="text-sm font-black text-green-500">{log.totalTime} นาที</span>
                                            </div>
                                        </td>
                                        <td className="pr-8 text-right rounded-r-[2rem] border-r border-white/5">
                                            <button className="p-2.5 bg-white/5 hover:bg-red-600 rounded-xl transition-all shadow-lg active:scale-95">
                                                <Search size={14} className="text-gray-200 group-hover:text-white" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                        <ShieldAlert size={56} className="mb-4 text-red-600" />
                        <p className="text-xs font-black uppercase">Data Stream Empty for {selectedYear}</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: xl; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(220,38,38,0.3); }
      `}</style>
        </div>
    );
};

export default YearlyForensicLog;