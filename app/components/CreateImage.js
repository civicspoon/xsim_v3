"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ItemRegistration from './ItemRegistoration';

export default function DualViewEditor() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const topCanvasRef = useRef(null);
    const sideCanvasRef = useRef(null);

    // --- Data States ---
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [itemList, setItemList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [areas, setAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(1);
    const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
    
    // --- Mode/Interaction States ---
    const [isPreExisting, setIsPreExisting] = useState(false); 
    const [dragOverView, setDragOverView] = useState(null); 

    // --- Metadata States ---
    const [baggageCode, setBaggageCode] = useState('');
    const [examType, setExamType] = useState('CBT');

    // --- Processing States ---
    const [images, setImages] = useState({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
    const [threshold, setThreshold] = useState(230);
    const [opacity, setOpacity] = useState(1);
    const [multiplyEnabled, setMultiplyEnabled] = useState(true);

    const [topRect, setTopRect] = useState({ x: 100, y: 100, w: 120, h: 120 });
    const [sideRect, setSideRect] = useState({ x: 100, z: 100, w: 120, h: 120 });

    const [dragState, setDragState] = useState({
        isActive: false, view: null, mode: null, offset: { x: 0, y: 0 }
    });

    const resetEditor = () => {
        setSelectedItem(null);
        setSelectedCategoryId('');
        setItemList([]);
        setBaggageCode('');
        setImages({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
        setTopRect({ x: 100, y: 100, w: 120, h: 120 });
        setSideRect({ x: 100, z: 100, w: 120, h: 120 });
        setThreshold(230);
        setIsPreExisting(false);
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
    };

    const closeRegistration = () => setIsRegistrationOpen(false);

    // 1. Initial Load
    useEffect(() => {
        fetch(`${API_URL}/itemCategory/`).then(res => res.json()).then(setCategories);
        fetch(`${API_URL}/area/`).then(res => res.json()).then(setAreas);
    }, [API_URL]);

    // 2. Load Items
    useEffect(() => {
        if (!selectedCategoryId) { setItemList([]); return; }
        setSelectedItem(null);
        setImages(p => ({ ...p, itemTop: null, itemSide: null }));
        fetch(`${API_URL}/itemImage/category/${selectedCategoryId}`).then(res => res.json()).then(setItemList);
    }, [selectedCategoryId, API_URL]);

    // 3. Metadata Sync
    useEffect(() => {
        if (!selectedAreaId || !selectedCategoryId) { setBaggageCode(''); return; }
        const fetchCode = async () => {
            try {
                const res = await fetch(`${API_URL}/baggage/nextCode?areaID=${selectedAreaId}&itemCategoryID=${selectedCategoryId}`);
                const data = await res.json();
                setBaggageCode(`2026-AOTAVSEC-XSIM${examType}-${{1:'CB', 2:'HB', 3:'CM'}[selectedAreaId] || 'XX'}-${parseInt(selectedCategoryId)===1?'C':'T'}${data.nextNumber || '00001'}`);
            } catch (err) { console.error(err); }
        };
        fetchCode();
    }, [selectedAreaId, selectedCategoryId, examType, API_URL]);

    // --- Interaction Handlers ---
    const handleFileDrop = (e, viewType) => {
        e.preventDefault();
        setDragOverView(null);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                const key = viewType === 'top' ? 'bgTop' : 'bgSide';
                setImages(p => ({ ...p, [key]: img }));
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleMouseDown = (e, viewType) => {
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const currentRect = viewType === 'top' ? topRect : sideRect;
        const currentY = viewType === 'top' ? currentRect.y : currentRect.z;

        if (mouseX >= (currentRect.x + currentRect.w - 15) && mouseX <= (currentRect.x + currentRect.w) &&
            mouseY >= (currentY + currentRect.h - 15) && mouseY <= (currentY + currentRect.h)) {
            setDragState({ isActive: true, view: viewType, mode: 'resize', offset: { x: mouseX - currentRect.w, y: mouseY - currentRect.h } });
            return;
        }
        if (mouseX >= currentRect.x && mouseX <= currentRect.x + currentRect.w && mouseY >= currentY && mouseY <= currentY + currentRect.h) {
            setDragState({ isActive: true, view: viewType, mode: 'move', offset: { x: mouseX - currentRect.x, y: mouseY - currentRect.h } });
        }
    };

    const handleMouseMove = (e) => {
        if (!dragState.isActive) return;
        const canvas = dragState.view === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = Math.round(e.clientX - rect.left);
        const mouseY = Math.round(e.clientY - rect.top);
        const setter = dragState.view === 'top' ? setTopRect : setSideRect;
        const axisY = dragState.view === 'top' ? 'y' : 'z';

        if (dragState.mode === 'move') {
            setter(p => ({ ...p, x: mouseX - dragState.offset.x, [axisY]: mouseY - dragState.offset.y }));
        } else {
            setter(p => ({ ...p, w: Math.max(20, mouseX - dragState.offset.x), h: Math.max(20, mouseY - dragState.offset.y) }));
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        const t = new Image(); const s = new Image();
        t.crossOrigin = s.crossOrigin = "anonymous";
        let loaded = 0;
        const onLoaded = () => { if (++loaded === 2) { 
            setImages(p => ({ ...p, itemTop: t, itemSide: s }));
            if (!isPreExisting) {
                setTopRect(p => ({ ...p, w: t.width, h: t.height }));
                setSideRect(p => ({ ...p, w: s.width, h: s.height }));
            }
        }};
        t.onload = s.onload = onLoaded;
        t.src = `${API_URL}/${item.top}?t=${Date.now()}`;
        s.src = `${API_URL}/${item.side}?t=${Date.now()}`;
    };

    const processAndDraw = useCallback((ctx, bg, itm, view, rectObj, isExporting = false) => {
        if (!ctx) return;
        ctx.canvas.width = bg?.width || 800; ctx.canvas.height = bg?.height || 600;
        ctx.globalCompositeOperation = 'source-over';
        
        if (bg) ctx.drawImage(bg, 0, 0);
        else { ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }

        const currentY = view === 'top' ? rectObj.y : rectObj.z;

        if (!isPreExisting && itm?.complete) {
            const tmp = document.createElement('canvas'); const tCtx = tmp.getContext('2d');
            tmp.width = rectObj.w; tmp.height = rectObj.h;
            tCtx.drawImage(itm, 0, 0, rectObj.w, rectObj.h);
            const d = tCtx.getImageData(0, 0, rectObj.w, rectObj.h);
            for (let i = 0; i < d.data.length; i += 4) {
                if ((0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]) > threshold) d.data[i + 3] = 0;
            }
            tCtx.putImageData(d, 0, 0);
            if (multiplyEnabled) ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmp, rectObj.x, currentY);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (!isExporting) {
            if (isPreExisting) {
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                ctx.strokeRect(rectObj.x, currentY, rectObj.w, rectObj.h);
                ctx.setLineDash([]);
            }
            ctx.fillStyle = isPreExisting ? '#ef4444' : '#f59e0b';
            ctx.fillRect(rectObj.x + rectObj.w - 8, currentY + rectObj.h - 8, 8, 8);
        }
    }, [isPreExisting, threshold, multiplyEnabled]);

    useEffect(() => {
        processAndDraw(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, false);
        processAndDraw(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, false);
    }, [images, topRect, sideRect, processAndDraw]);

    const uploadCanvas = async () => {
        // 🔥 ปรับ Logic Validation: ถ้า Category ID คือ 1 (Clear) ไม่ต้องเช็ค selectedItem
        const isClearCategory = selectedCategoryId === "1"; 
        
        if (!baggageCode) { Swal.fire('Warning', 'Select Area and Category first', 'warning'); return; }
        if (!isClearCategory && !selectedItem) { Swal.fire('Warning', 'Select an Item for this threat category', 'warning'); return; }

        Swal.fire({ title: 'Deploying...', didOpen: () => Swal.showLoading() });

        try {
            processAndDraw(topCanvasRef.current.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, true);
            processAndDraw(sideCanvasRef.current.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, true);

            const formData = new FormData();
            const topB = await new Promise(r => topCanvasRef.current.toBlob(r, "image/png"));
            const sideB = await new Promise(r => sideCanvasRef.current.toBlob(r, "image/png"));
            
            processAndDraw(topCanvasRef.current.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, false);
            processAndDraw(sideCanvasRef.current.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, false);

            formData.append("top", topB, "top.png");
            formData.append("side", sideB, "side.png");
            formData.append("itemImageID", selectedItem?.id || "0"); // ส่ง 0 ถ้าไม่มีไอเทม
            formData.append("areaID", selectedAreaId);
            formData.append("itemCategoryID", selectedCategoryId);
            formData.append("examType", examType);
            formData.append("code", baggageCode);
            formData.append("itemPos", JSON.stringify({ top: topRect, side: sideRect }));
            formData.append("isPreExisting", isPreExisting ? 1 : 0);

            const res = await fetch(`${API_URL}/baggage/canvas-upload`, { method: "POST", body: formData });
            if (res.ok) { Swal.fire({ icon: 'success', title: 'Saved Simulation!', timer: 1500 }); resetEditor(); }
            else throw new Error("Upload error");
        } catch (error) { 
            Swal.fire('Error', error.message, 'error'); 
            processAndDraw(topCanvasRef.current.getContext('2d'), images.bgTop, images.itemTop, 'top', topRect, false);
            processAndDraw(sideCanvasRef.current.getContext('2d'), images.bgSide, images.itemSide, 'side', sideRect, false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans" onMouseMove={handleMouseMove} onMouseUp={() => setDragState(p => ({ ...p, isActive: false }))}>
            <div className="flex-1 p-4 pb-48 overflow-y-auto">
                <div className="flex gap-6 mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 justify-center items-center shadow-lg">
                    <div className="flex gap-4 border-r border-slate-700 pr-6">
                        {areas.map(area => (
                            <label key={area.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={selectedAreaId === area.id} onChange={() => setSelectedAreaId(area.id)} className="accent-orange-500" />
                                <span className={`text-xs font-bold ${selectedAreaId === area.id ? 'text-orange-500' : 'text-slate-400'}`}>{area.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <input readOnly value={baggageCode} className="bg-black border border-slate-700 text-orange-500 font-mono text-[10px] px-3 py-1 rounded w-64 focus:outline-none" />
                        <select value={examType} onChange={e => setExamType(e.target.value)} className="bg-slate-800 text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
                            <option value="CBT">CBT</option><option value="CBA">CBA</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 justify-center shadow-md">
                    {['bgTop', 'bgSide'].map(key => (
                        <div key={key} className="flex flex-col gap-1 px-4 border-r last:border-0 border-slate-700">
                            <span className="text-[12px] font-bold text-orange-500 uppercase italic">Source: {key === 'bgTop' ? 'TOP' : 'SIDE'}</span>
                            <input type="file" className="text-[10px] text-slate-400 file:bg-slate-800 file:text-white file:border-0 file:rounded file:px-2 cursor-pointer" onChange={e => {
                                if (e.target.files[0]) {
                                    const img = new Image(); img.onload = () => setImages(p => ({ ...p, [key]: img }));
                                    img.src = URL.createObjectURL(e.target.files[0]);
                                }
                            }} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mb-6">
                   <button onClick={() => setIsPreExisting(false)} className={`px-6 py-2 rounded-full text-xs font-black border transition-all ${!isPreExisting ? 'bg-orange-600 border-orange-400 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>OVERLAY MODE</button>
                   <button onClick={() => setIsPreExisting(true)} className={`px-6 py-2 rounded-full text-xs font-black border transition-all ${isPreExisting ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>PRE-EXISTING MODE</button>
                </div>

                <div className="flex flex-row gap-6 justify-center">
                    {['top', 'side'].map(v => (
                        <div key={v} 
                            onDragOver={(e) => { e.preventDefault(); setDragOverView(v); }}
                            onDragLeave={() => setDragOverView(null)}
                            onDrop={(e) => handleFileDrop(e, v)}
                            className={`bg-black border-2 rounded-2xl shadow-2xl overflow-hidden relative transition-all ${dragOverView === v ? 'border-blue-500 scale-[1.01]' : 'border-slate-800'}`}>
                            <div className="bg-slate-800 text-[10px] px-4 py-2 font-black uppercase flex justify-between border-b border-slate-700">
                                <span>TERMINAL: {v.toUpperCase()}</span>
                                <span className="text-orange-500 italic">Drag/Drop Background</span>
                            </div>
                            <canvas ref={v === 'top' ? topCanvasRef : sideCanvasRef} onMouseDown={e => handleMouseDown(e, v)} className="cursor-crosshair bg-slate-900" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-85 bg-slate-900 border-l border-slate-800 p-6 flex flex-col z-20 shadow-2xl">
                <h2 className="text-orange-500 font-black text-xl mb-6 border-b border-slate-800 pb-4 italic text-center uppercase tracking-tighter">X-SIM V3 REGISTRY</h2>
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Category</label>
                    <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full bg-black text-white border-2 border-slate-800 rounded-xl py-3 px-4 text-xs font-black outline-none focus:border-orange-500 transition-all">
                        <option value="" disabled>-- Classify --</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {selectedCategoryId === "1" ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-center">
                            <span className="text-3xl mb-2">✅</span>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Normal Category Selected<br/>No item required for deployment
                            </span>
                        </div>
                    ) : (
                        itemList.map(item => (
                            <div key={item.id} onClick={() => handleSelectItem(item)} className={`group relative bg-slate-800/40 border border-slate-700 rounded-xl p-3 hover:border-orange-500 cursor-pointer flex gap-4 items-center transition-all ${selectedItem?.id === item.id ? 'border-orange-600 bg-slate-800 shadow-md' : ''}`}>
                                <img src={`${API_URL}/${item.top}`} className="w-12 h-12 object-contain bg-black rounded p-1" />
                                <span className="text-[10px] font-black uppercase truncate">{item.name}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    <button onClick={() => setIsRegistrationOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-3 rounded-xl uppercase">Item Registration</button>
                    <button onClick={uploadCanvas} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-4 rounded-xl shadow-lg uppercase italic">Deploy Simulation ↗</button>
                </div>
            </div>

            {isRegistrationOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-orange-500 font-black italic uppercase">Item Management</h3>
                            <button onClick={closeRegistration} className="text-slate-500 hover:text-white p-2">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6"><ItemRegistration /></div>
                    </div>
                </div>
            )}
        </div>
    );
}