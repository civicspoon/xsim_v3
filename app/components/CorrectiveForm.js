'use client';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Trash2, Terminal, UserCheck, Search, Database, Clock, ShieldAlert, FileText, Activity } from 'lucide-react';

const CorrectiveForm = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';

    const [formData, setFormData] = useState({
        userId: '', areaId: '', itemCategory: '', correctiveTypeId: '', timeTarget: '', remark: ''
    });

    const [types, setTypes] = useState([]);
    const [searchEmid, setSearchEmid] = useState('');
    const [userData, setUserData] = useState(null);
    const [itemCategorys, setItemCategorys] = useState([]);
    const [areas, setAreas] = useState([]);
    const [userLogs, setUserLogs] = useState([]);

    const swalTerminal = Swal.mixin({
        background: '#0a0a0a',
        color: '#f97316',
        confirmButtonColor: '#ea580c',
        customClass: { popup: 'border border-orange-200 font-mono shadow-lg' }
    });

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [itemRes, typeRes, areaRes] = await Promise.all([
                    fetch(`${API_URL}/itemCategory`),
                    fetch(`${API_URL}/corrective/correctiveType`),
                    fetch(`${API_URL}/area`)
                ]);
                setItemCategorys(await itemRes.json());
                setTypes(await typeRes.json());
                setAreas(await areaRes.json());
            } catch (err) { console.error("Sync Error:", err); }
        };
        fetchDropdowns();
    }, [API_URL]);

    const filteredItems = itemCategorys.filter((item, index) => {
        const currentArea = String(formData.areaId);
        if (currentArea === '2') return index !== 4;
        if (currentArea === '5') return ![4, 5].includes(index);
        return true;
    });

    const fetchUserLogs = async (userId) => {
        const res = await fetch(`${API_URL}/corrective/allbyid/${userId}`);
        const data = await res.json();
        setUserLogs(Array.isArray(data) ? data : []);
    };

    const handleUserSearch = async () => {
        if (!searchEmid) return;
        try {
            const response = await fetch(`${API_URL}/users/emid/${searchEmid}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            setUserData(data);
            setFormData(prev => ({ ...prev, userId: data.id }));
            fetchUserLogs(data.id);
        } catch (err) {
            swalTerminal.fire({ icon: 'error', title: 'OPERATOR NOT FOUND' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/corrective`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: formData.userId,
                areaId: formData.areaId,
                itemCategoryId: formData.itemCategory === "77" ? null : formData.itemCategory,
                correctiveTypeId: formData.correctiveTypeId,
                timeTarget: formData.timeTarget,
                remark: formData.remark
            }),
        });
        if (res.ok) {
            fetchUserLogs(formData.userId);
            setFormData({ ...formData, itemCategory: '', correctiveTypeId: '', timeTarget: '', remark: '' });
            swalTerminal.fire({ icon: 'success', title: 'PROTOCOL UPDATED', timer: 1000 });
        }
    };

    const handleDeleteLog = async (logId) => {
        if (await swalTerminal.fire({ title: 'CONFIRM DELETE?', text: 'Remove this remedial directive?', showCancelButton: true }).then(r => r.isConfirmed)) {
            await fetch(`${API_URL}/corrective/${logId}`, { method: 'DELETE' });
            fetchUserLogs(userData.id);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-slate-300 font-mono p-4 md:p-6 flex flex-col overflow-hidden">
            
            {/* Header: Professional Admin Look */}
            <header className="flex justify-between items-center mb-6 bg-[#111] p-5 rounded-lg border border-white/10 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-300 rounded-lg text-black shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tighter text-white leading-none">Simulator Remedial Directive</h1>
                        <p className="text-[9px] text-orange-200 font-bold tracking-[0.3em] mt-1 uppercase">X-SIM V3 // Compliance & Training Management</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-black/40 rounded-lg border border-white/5">
                    <Activity size={16} className="text-green-200 animate-pulse" />
                    <span className="text-lg font-black tracking-widest uppercase">System Operational</span>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                
                {/* --- LEFT COLUMN: Authentication & Directives --- */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
                    
                    {/* Operator Auth Panel */}
                    <section className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-300"></div>
                        <label className="text-lg text-slate-200 font-black uppercase mb-4 block tracking-[0.2em]">Verify Personnel Identity</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/10 p-3 pl-10 text-cyan-400 outline-none focus:border-cyan-200 rounded-lg font-bold tracking-widest"
                                    placeholder="OPERATOR_EMID"
                                    value={searchEmid}
                                    onChange={(e) => setSearchEmid(e.target.value)}
                                />
                            </div>
                            <button onClick={handleUserSearch} className="bg-orange-300 px-5 rounded-lg text-black font-black hover:bg-orange-200 transition-all active:scale-95 shadow-lg shadow-orange-900/20">FETCH</button>
                        </div>
                        {userData && (
                            <div className="mt-4 flex items-center gap-4 bg-cyan-200/5 p-4 rounded-lg border border-cyan-200/20 animate-in fade-in slide-in-from-top-2">
                                <UserCheck className="text-cyan-400" size={24} />
                                <div>
                                    <p className="text-white font-black uppercase text-sm leading-none">{userData.name}</p>
                                    <p className="text-lg text-cyan-300 font-bold mt-1 uppercase tracking-tighter">Authorized for Protocol Update</p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Remedial Setup Form */}
                    <section className={`bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl shadow-lg flex-1 transition-all duration-200 ${!userData ? 'opacity-20 blur-[1px] grayscale pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex items-center gap-2 mb-6 text-orange-200">
                            <FileText size={18} />
                            <h2 className="text-sm font-black uppercase tracking-widest italic text-white">Issue Training Directive</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[9px] text-slate-200 font-black uppercase mb-1 block">Operational Area</label>
                                    <select required className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-orange-200 appearance-none" value={formData.areaId} onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}>
                                        <option value="">SELECT_AREA</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[9px] text-slate-200 font-black uppercase mb-1 block">Assignment Mode</label>
                                    <select required className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-orange-200 appearance-none" value={formData.correctiveTypeId} onChange={(e) => setFormData({ ...formData, correctiveTypeId: e.target.value })}>
                                        <option value="">TYPE</option>
                                        {types.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-[9px] text-slate-200 font-black uppercase mb-1 block">Target Proficiency</label>
                                    <select required className="w-full bg-black border border-white/10 p-3 rounded-lg text-white outline-none focus:border-orange-200 appearance-none" value={formData.itemCategory} onChange={(e) => setFormData({ ...formData, itemCategory: e.target.value })}>
                                        <option value="">ITEM</option>
                                        <option value="77" className="text-orange-200">ALL_CATEGORIES</option>
                                        {filteredItems.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-200 font-black uppercase mb-1 block">Remedial Time Target (Sec)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                    <input type="number" required className="w-full bg-black border border-white/10 p-3 pl-10 rounded-lg text-orange-200 font-black text-lg" value={formData.timeTarget} onChange={(e) => setFormData({ ...formData, timeTarget: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-200 font-black uppercase mb-1 block">Directive Remarks / Requirements</label>
                                <textarea className="w-full bg-black border border-white/10 p-3 rounded-lg text-white text-xs h-24 resize-none focus:border-orange-200 outline-none" placeholder="Enter specific instructions..." value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full py-4 bg-orange-300 hover:bg-orange-200 text-black font-black uppercase rounded-lg shadow-lg shadow-orange-900/40 transition-all transform active:scale-[0.98]">Issue Protocol Directive</button>
                        </form>
                    </section>
                </div>

                {/* --- RIGHT COLUMN: Directive History Log --- */}
                <div className="lg:col-span-8 flex flex-col bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-lg">
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Database size={18} className="text-cyan-200" />
                            <h2 className="text-sm font-black uppercase tracking-widest italic text-white underline decoration-cyan-200/30 underline-offset-8">Personnel Remedial Logs</h2>
                        </div>
                        <span className="text-[9px] bg-black px-4 py-1 rounded-full text-slate-400 font-black border border-white/10 tracking-widest uppercase italic">Active_Directives: {userLogs.length}</span>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[#0f0f0f] shadow-md">
                                <tr className="text-lg font-black uppercase tracking-widest text-slate-200 border-b border-white/5">
                                    <th className="p-5">Registry_ID</th>
                                    <th className="p-5">Area</th>
                                    <th className="p-5">Category</th>
                                    <th className="p-5">Mode</th>
                                    <th className="p-5">Requirement</th>
                                    <th className="p-5 text-right">Edit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {userLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-orange-300/5 transition-all text-lg group">
                                        <td className="p-5 font-mono text-slate-300 tracking-tighter">#REG-{log.id}</td>
                                        <td className="p-5 font-black uppercase text-white/80 tracking-tighter">{areas.find(a => a.id == log.areaId)?.name || 'N/A'}</td>
                                        <td className="p-5 font-bold text-orange-200">
                                            {log.itemCategoryId ? itemCategorys.find(c => c.id == log.itemCategoryId)?.name : 'GLOBAL_ALL'}
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-cyan-200/10 text-cyan-400 px-2 py-0.5 rounded text-[9px] font-black border border-cyan-200/20 uppercase tracking-tighter">
                                                {types.find(t => t.id == log.correctiveTypeId)?.name || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-white/90 font-mono font-black">{log.timeTarget}s</td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => handleDeleteLog(log.id)} className="p-2.5 text-slate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              hover:text-red-200 hover:bg-red-200/10 rounded-lg transition-all"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {userLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-32 text-center text-slate-700 italic uppercase tracking-[0.5em] text-lg">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Database size={48} />
                                                <span>NO_PERSONNEL_DIRECTIVES_DETECTED</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-3 bg-black/40 text-[8px] text-center text-slate-800 font-bold tracking-[0.6em] uppercase border-t border-white/5 italic">
                        Authorized Use Only // Simulator Governance Module // X-Sim 3.0.22
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
            `}</style>
        </div>
    );
};

export default CorrectiveForm;