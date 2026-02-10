import React from 'react';
import { BookOpen, Keyboard, Target, Award, ChevronLeft, Move, ZoomIn, MousePointer2 } from 'lucide-react';

const ManualPage = () => {
  // ฟังก์ชันช่วยเลื่อนไปยัง ID ที่กำหนด
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 w-full bg-[#050505]/95 text-white font-sans selection:bg-red-600/30 overflow-y-auto scroll-smooth">
      
      {/* --- TOP FIXED NAV --- */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="hidden md:block">
            <span className="text-red-600 font-black italic tracking-tighter">X-SIM V.3</span>
          </div>

          <div className="flex gap-2 md:gap-6 mx-auto md:mr-0 ">
            {[
              { label: 'Overview', id: 'overview', icon: <BookOpen size={14} /> },
              { label: 'Controls', id: 'controls', icon: <MousePointer2 size={14} /> }, // เพิ่มเมนูใหม่
              { label: 'Filters', id: 'filters', icon: <Keyboard size={14} /> },
              { label: 'Rewards', id: 'rewards', icon: <Award size={14} /> },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => scrollToSection(nav.id)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 hover:border-red-600/50"
              >
                {nav.icon}
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Back Button */}
      <button 
        onClick={() => window.history.back()}
        className="fixed top-24 left-6 z-50 p-3 bg-white/5 hover:bg-red-600 border border-white/10 rounded-full transition-all group shadow-2xl"
      >
        <ChevronLeft size={24} className="group-hover:text-black" />
      </button>

      {/* Header Section */}
      <header className="relative pt-32 pb-24 px-6 border-b border-white/5 bg-linear-to-b from-red-950/20 to-transparent">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-1 bg-red-600 text-black text-[14px] font-black uppercase tracking-[0.3em] mb-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            Security Training Module
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-red-600 mb-6 uppercase italic">
            X-Sim V.3<br/>User Manual
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto uppercase tracking-widest font-bold">
            คู่มือการใช้งานระบบจำลองการตรวจสัมภาระ
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto p-6 md:p-12 space-y-32 pb-40">
        
        {/* Section 1: Overview */}
        <section id="overview" className="grid md:grid-cols-2 gap-12 items-center scroll-mt-32">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 text-red-600">
              <BookOpen size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Overview</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 text-lg leading-relaxed">
                <span className="text-white font-bold block mb-2 underline decoration-red-600">บทนำสู่ระบบจำลอง:</span>
                X-Sim V.3 คือเครื่องมือฝึกฝนทักษะการวิเคราะห์ภาพ X-ray แบบ Dual-View 
                ที่ถูกพัฒนาขึ้นเพื่อให้นักเรียนได้ฝึกการตัดสินใจภายใต้สถานการณ์เสมือนจริง 
              </p>
              <div className="p-4 bg-red-600/10 border-l-4 border-red-600 rounded-r-xl">
                <p className="text-sm text-red-400 font-black italic">
                  "มุ่งเน้นการคัดกรองวัตถุอันตรายด้วยความแม่นยำและความรวดเร็ว"
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#111] rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gray-800 relative group">
               <img src="../images/cbtUI.png" alt="UI Overview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
               <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end">
                  <span className="text-xs font-black tracking-widest uppercase text-red-400">Image 1</span>
                  <span className="text-sm font-bold">Main Control Interface</span>
               </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Controls (New Section) */}
        <section id="controls" className="space-y-12 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-blue-500">
              <MousePointer2 size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Interaction Guide</h2>
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">การควบคุมมุมมองและการระบุตำแหน่ง</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                <Keyboard size={24} />
              </div>
              <h3 className="text-xl font-black uppercase">1. Stop & Inspect</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                <span className="text-white font-bold block mb-1">ต้องหยุดภาพก่อน:</span>
                คุณต้องกด <kbd className="px-2 py-1 bg-white/10 rounded text-yellow-500 font-mono">Spacebar</kbd> เพื่อหยุดสายพานก่อนเท่านั้น จึงจะสามารถคลิกระบุตำแหน่งวัตถุบนหน้าจอได้
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                <Move size={24} />
              </div>
              <h3 className="text-xl font-black uppercase">2. Drag to Move</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                <span className="text-white font-bold block mb-1">การขยับภาพ:</span>
                คลิกเมาส์ซ้ายค้างที่รูปภาพแล้ว <span className="text-white font-bold underline">ลาก (Drag)</span> เพื่อเลื่อนขยับตำแหน่งภาพ X-ray ให้เห็นวัตถุได้ชัดเจนขึ้น
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-4xl space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                <ZoomIn size={24} />
              </div>
              <h3 className="text-xl font-black uppercase">3. Mouse Wheel Zoom</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                <span className="text-white font-bold block mb-1">การซูม:</span>
                ใช้ <span className="text-white font-bold underline">ลูกกลิ้งเมาส์ (Scroll Wheel)</span> เพื่อซูมขยายจุดที่น่าสงสัยได้อย่างอิสระทั้งในมุมมอง Top และ Side
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Hotkeys */}
        <section id="filters" className="space-y-10 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-yellow-300">
              <Keyboard size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Imaging Filters</h2>
            </div>
            <p className="text-gray-300 text-sm font-bold uppercase tracking-widest">คีย์ลัดสำหรับปรับเปลี่ยนโหมดภาพเพื่อการวิเคราะห์</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'Q', label: 'B&W', sub: 'ขาว-ดำ', color: 'bg-white/10' },
              { key: 'W', label: 'NEG', sub: 'ภาพเนกาทีฟ', color: 'bg-white/10' },
              { key: 'E', label: 'SEN', sub: 'เพิ่มความต่างความหนาแน่นวัตถุ', color: 'bg-blue-600/20' },
              { key: 'A', label: 'O2', sub: 'ดูเฉพาะสารอินทรีย์', color: 'bg-orange-600/20' },
              { key: 'S', label: 'OS', sub: 'ทำให้สารอินทรีย์หายไป', color: 'bg-green-600/20' },
              { key: 'D', label: 'HI', sub: 'เพิ่มความสว่าง 50%', color: 'bg-yellow-600/20' },
              { key: 'R', label: 'Reset', sub: 'รีเซ็ตภาพ/ซูม', color: 'bg-red-600/20' },
              { key: 'Space', label: 'Pause', sub: 'หยุด/เริ่มสายพาน', color: 'bg-white/10' },
            ].map((item) => (
              <div key={item.key} className={`${item.color} p-8 rounded-4xl border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-all cursor-default group`}>
                <kbd className="px-4 py-2 bg-black rounded-xl font-mono text-2xl font-black text-white border-b-4 border-white/20 mb-4 group-hover:border-yellow-300 transition-colors">
                  {item.key}
                </kbd>
                <span className="text-sm font-black uppercase tracking-tighter">{item.label}</span>
                <span className="text-[14px] text-gray-300 font-bold mt-1">{item.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Efficiency & Rewards */}
        <section id="rewards" className="space-y-10 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div className="flex items-center gap-3 justify-center md:justify-start text-green-500">
              <Award size={32} />
              <h2 className="text-4xl font-black uppercase tracking-tighter italic text-white">Efficiency Rewards</h2>
            </div>
            <p className="text-gray-300 text-sm font-bold uppercase tracking-widest text-right">เกณฑ์การได้รับแต้มเวลาสะสมจากความแม่นยำ</p>
          </div>

          <div className="overflow-x-auto rounded-4xl border border-white/10 bg-[#0a0a0a] shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                  <th className="p-8 text-sm font-black uppercase tracking-widest italic">Accuracy Range</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest italic">Time Credit (Mins)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { acc: '81% - 100%', credit: '20', color: 'text-green-400', label: 'ระดับยอดเยี่ยม' },
                  { acc: '71% - 80%', credit: '16', color: 'text-blue-400', label: 'ระดับดีมาก' },
                  { acc: '61% - 70%', credit: '14', color: 'text-yellow-400', label: 'ระดับดี' },
                  { acc: '50% - 60%', credit: '12', color: 'text-orange-400', label: 'ระดับผ่านเกณฑ์' },
                  { acc: 'Below 50%', credit: '0', color: 'text-red-500', label: 'ไม่ผ่านเกณฑ์' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="p-8 font-black text-2xl tracking-tighter group-hover:translate-x-2 transition-transform">
                      {row.acc}
                      <span className="block text-[14px] text-gray-500 mt-1 uppercase">{row.label}</span>
                    </td>
                    <td className={`p-8 font-black text-4xl italic ${row.color}`}>{row.credit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-10 border-t border-white/5">
            <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">X-Sim V.3 // Flyday FPV System</p>
            <p className="text-[14px] text-gray-700 font-bold mt-2 uppercase italic">สงวนลิขสิทธิ์เนื้อหาและระบบการฝึกซ้อม</p>
        </footer>
      </main>
    </div>
  );
};

export default ManualPage;