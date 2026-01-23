'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react"; // นำเข้า Icon Loader

function Page() {
  const router = useRouter();

  useEffect(() => {
    // 1. ล้างข้อมูลใน LocalStorage
    localStorage.clear();
    
    // 2. หน่วงเวลาเล็กน้อย (Optional) เพื่อให้ User เห็นว่ากำลัง Logout 
    // หรือสั่ง Push ไปหน้า Login ทันที
    const timeout = setTimeout(() => {
      router.push("/Login");
    }, 800); 

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner Animation */}
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
        
        <div className="text-2xl font-semibold tracking-widest animate-pulse">
          LOGGING OUT...
        </div>
        
        <p className="text-gray-400 text-sm">
          Clearing session and redirecting to login page
        </p>
      </div>
    </div>
  );
}

export default Page;