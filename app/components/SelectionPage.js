'use client'

import { useRouter } from "next/navigation";
import { Package, Luggage, Truck, ChevronRight,LayoutGrid } from "lucide-react";

export default function SelectionPage() {
  const router = useRouter();

  const categories = [
    {
      id: "cabin",
      title: "Cabin Baggage",
      thai: "สัมภาระพกพา",
      description: "ตรวจสอบกระเป๋าถือและสิ่งของที่จะนำขึ้นห้องโดยสาร",
      icon: <Luggage className="w-12 h-12" />,
      color: "from-blue-500 to-cyan-400",
      path: "/cbt/1" // ปรับ path ตามโครงสร้างของคุณ
    },
    {
      id: "hold",
      title: "Holding Baggage",
      thai: "สัมภาระลงทะเบียน",
      description: "ตรวจสอบกระเป๋าเดินทางขนาดใหญ่ที่โหลดใต้ท้องเครื่อง",
      icon: <Package className="w-12 h-12" />,
      color: "from-purple-600 to-pink-500",
      path: "/cbt/2"
    },
    {
      id: "cargo",
      title: "Cargo & Mail",
      thai: "สินค้าและไปรษณียภัณฑ์",
      description: "การตรวจความปลอดภัยสินค้าขนส่งทางอากาศและพัสดุ",
      icon: <Truck className="w-12 h-12" />,
      color: "from-amber-500 to-orange-400",
      path: "/cbt/3"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a]/90 rounded-3xl bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black flex flex-col items-center justify-center p-6">
      
      {/* Header Section */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
         <div className="flex items-center justify-center gap-4 mb-6">
            <LayoutGrid className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" size={40} />
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
              <span className="text-red-200">XSIM V3</span> <span className="text-red-600">CBT</span>
            </h1>
        </div>
        <p className="text-gray-400 text-3xl font-light italic">
          Please select your screening specialization
        </p>
        <div className="h-1 w-24 bg-red-600 mx-auto mt-6 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {categories.map((item, index) => (
          <div
            key={item.id}
            onClick={() => router.push(item.path)}
            style={{ animationDelay: `${index * 150}ms` }}
            className="group relative bg-gray-900/40 border border-gray-800 p-8 rounded-[2rem] cursor-pointer overflow-hidden transition-all duration-500 hover:scale-105 hover:border-gray-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in"
          >
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${item.color} opacity-10 blur-3xl group-hover:opacity-30 transition-opacity`}></div>

            {/* Icon & Title */}
            <div className={`mb-6 p-4 inline-block rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg shadow-black/20 group-hover:rotate-6 transition-transform duration-500`}>
              {item.icon}
            </div>

            <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-red-500 transition-colors">
              {item.title}
            </h3>
            <p className="text-yellow-500 font-semibold text-2xl font-medium mb-4">{item.thai}</p>
            
            <p className="text-gray-200 leading-relaxed text-xl mb-8">
              {item.description}
            </p>

            {/* Action Button Area */}
            <div className="flex items-center text-white font-bold group-hover:translate-x-2 transition-transform">
              START SESSION
              <ChevronRight className="ml-2 w-5 h-5 text-red-600" />
            </div>

            {/* Decorative Bar */}
            <div className={`absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r ${item.color} group-hover:w-full transition-all duration-500`}></div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-gray-500 text-sm flex gap-8 border-t border-gray-900 pt-8 w-full max-w-4xl justify-center">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Ready
        </div>
        <div>v3.0.1 Stable</div>
        <div>© 2026 Airport Security Training</div>
      </div>
    </div>
  );
}