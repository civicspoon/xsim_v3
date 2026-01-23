"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import CategorySelect from './CategorySelect';
import Swal from 'sweetalert2'; // Import SweetAlert2

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

    // --- Metadata States ---
    const [baggageCode, setBaggageCode] = useState('');
    const [examType, setExamType] = useState('CBT');

    // --- Processing States ---
    const [images, setImages] = useState({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
    const [rect, setRect] = useState({ x: 100, y: 100, z: 100, w: 100, h: 100 });
    const [threshold, setThreshold] = useState(230);
    const [opacity, setOpacity] = useState(1);
    const [multiplyEnabled, setMultiplyEnabled] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // --- RESET FUNCTION ---
    const resetEditor = () => {
        // Reset Selection States
        setSelectedItem(null);
        setSelectedCategoryId('');
        setItemList([]);
        setBaggageCode('');
        
        // Reset Images
        setImages({ bgTop: null, itemTop: null, bgSide: null, itemSide: null });
        
        // Reset Item Controls
        setRect({ x: 100, y: 100, z: 100, w: 100, h: 100 });
        setThreshold(230);
        
        // Reset File Inputs manually if necessary (via refs or key reset)
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
    };

    // 1. Initial Load
    useEffect(() => {
        fetch(`${API_URL}/itemCategory/`).then(res => res.json()).then(setCategories);
        fetch(`${API_URL}/area/`).then(res => res.json()).then(setAreas);
    }, [API_URL]);

    // 2. Load Items
    useEffect(() => {
        if (!selectedCategoryId) { setItemList([]); return; }
        fetch(`${API_URL}/itemImage/category/${selectedCategoryId}`).then(res => res.json()).then(setItemList);
    }, [selectedCategoryId, API_URL]);

    // 3. Metadata Sync
    useEffect(() => {
        if (!selectedAreaId || !selectedItem || !selectedCategoryId) return;
        const fetchCode = async () => {
            try {
                const res = await fetch(`${API_URL}/baggage/nextCode?areaID=${selectedAreaId}&itemImageID=${selectedItem.id}`);
                const data = await res.json();
                const year = 2026;
                const areaMap = { 1: 'CB', 2: 'HB', 3: 'CM' };
                const catPrefix = parseInt(selectedCategoryId) > 1 ? 'T' : 'C';
                setBaggageCode(`${year}-AOTAVSEC-XSIM${examType}-${areaMap[selectedAreaId] || 'XX'}-${catPrefix}${data.nextNumber || '00001'}`);
            } catch (err) {
                console.error("Code fetch error", err);
            }
        };
        fetchCode();
    }, [selectedAreaId, selectedItem, selectedCategoryId, examType, API_URL]);

    // --- Handlers ---
    const handleMouseDown = (e, viewType) => {
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        const itemY = viewType === 'top' ? rect.y : rect.z;
        if (mouseX >= rect.x && mouseX <= rect.x + rect.w && mouseY >= itemY && mouseY <= itemY + rect.h) {
            setIsDragging(true);
            setDragOffset({ x: mouseX - rect.x, y: mouseY - itemY });
        }
    };

    const handleMouseMove = (e, viewType) => {
        if (!isDragging) return;
        const canvas = viewType === 'top' ? topCanvasRef.current : sideCanvasRef.current;
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = Math.round(e.clientX - canvasRect.left);
        const mouseY = Math.round(e.clientY - canvasRect.top);
        if (viewType === 'top') setRect(p => ({ ...p, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }));
        else setRect(p => ({ ...p, x: mouseX - dragOffset.x, z: mouseY - dragOffset.y }));
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        const t = new Image(); const s = new Image();
        t.crossOrigin = s.crossOrigin = "anonymous";
        let l = 0; const c = () => { if (++l === 2) { setImages(p => ({ ...p, itemTop: t, itemSide: s })); setRect(p => ({ ...p, w: t.width, h: t.height })); }};
        t.onload = s.onload = c;
        t.src = `${API_URL}/${item.top}?t=${Date.now()}`;
        s.src = `${API_URL}/${item.side}?t=${Date.now()}`;
    };

    const processAndDraw = useCallback((ctx, bg, itm, view) => {
        if (!ctx) return;
        ctx.canvas.width = bg?.width || 800; ctx.canvas.height = bg?.height || 600;
        ctx.globalCompositeOperation = 'source-over';
        if (bg) ctx.drawImage(bg, 0, 0); 
        else { 
            ctx.fillStyle = "#0f172a"; 
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
        }

        if (itm?.complete) {
            const tmp = document.createElement('canvas'); const tCtx = tmp.getContext('2d');
            tmp.width = rect.w; tmp.height = rect.h;
            tCtx.drawImage(itm, 0, 0, rect.w, rect.h);
            const d = tCtx.getImageData(0, 0, rect.w, rect.h);
            for (let i = 0; i < d.data.length; i += 4) {
                if ((0.299 * d.data[i] + 0.587 * d.data[i+1] + 0.114 * d.data[i+2]) > threshold) d.data[i+3] = 0;
                else d.data[i+3] *= opacity;
            }
            tCtx.putImageData(d, 0, 0);
            if (multiplyEnabled) ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmp, rect.x, view === 'top' ? rect.y : rect.z);
        }
    }, [rect, threshold, opacity, multiplyEnabled]);

    useEffect(() => {
        processAndDraw(topCanvasRef.current?.getContext('2d'), images.bgTop, images.itemTop, 'top');
        processAndDraw(sideCanvasRef.current?.getContext('2d'), images.bgSide, images.itemSide, 'side');
    }, [images, processAndDraw]);

    const uploadCanvas = async () => {
        if (!selectedItem || !baggageCode) {
            Swal.fire('Warning', 'Please select an item and ensure the code is generated.', 'warning');
            return;
        }

        // Show Loading
        Swal.fire({
            title: 'Saving Simulation...',
            html: 'Uploading data to registry',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const formData = new FormData();
            const topB = await new Promise(r => topCanvasRef.current.toBlob(r, "image/png"));
            const sideB = await new Promise(r => sideCanvasRef.current.toBlob(r, "image/png"));
            
            formData.append("top", topB, "top.png"); 
            formData.append("side", sideB, "side.png");
            formData.append("itemImageID", selectedItem.id); 
            formData.append("areaID", selectedAreaId);
            formData.append("itemCategoryID", selectedCategoryId); 
            formData.append("examType", examType);
            formData.append("code", baggageCode); 
            formData.append("itemPos", JSON.stringify(rect));

            const res = await fetch(`${API_URL}/baggage/canvas-upload`, { method: "POST", body: formData });
            
            if (res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Baggage Saved!',
                    text: 'The simulation has been stored successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
                resetEditor(); // Reset after successful post
            } else {
                const errData = await res.json();
                throw new Error(errData.message || "Upload failed");
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans rounded-2xl" onMouseUp={() => setIsDragging(false)}>
            
            <div className="flex-1 p-4 pb-40 overflow-y-auto">
                {/* 1. TOP SELECTION BAR */}
                <div className="flex gap-6 mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 justify-center items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Area:</span>
                    <div className="flex gap-4">
                        {areas.map(area => (
                            <label key={area.id} className="flex items-center gap-2 cursor-pointer group">
                                <input type="radio" checked={selectedAreaId === area.id} onChange={() => setSelectedAreaId(area.id)} className="w-4 h-4 accent-orange-500" />
                                <span className={`text-xs font-bold transition-colors ${selectedAreaId === area.id ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-200'}`}>{area.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="ml-8 pl-8 border-l border-slate-700 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Registry:</span>
                        <input readOnly value={baggageCode} className="bg-black border border-slate-700 text-orange-500 font-mono text-[10px] px-3 py-1 rounded w-64 focus:outline-none" />
                        <select value={examType} onChange={e => setExamType(e.target.value)} className="bg-slate-800 text-[10px] font-bold px-2 py-1 rounded border border-slate-700">
                            <option value="CBT">CBT</option>
                            <option value="CBA">CBA</option>
                        </select>
                    </div>
                </div>

                {/* Background Selectors */}
                <div className="flex gap-4 mb-6 bg-slate-900/80 p-4 rounded-xl border border-slate-800 justify-center">
                    {['bgTop', 'bgSide'].map(key => (
                        <div key={key} className="flex flex-col gap-1 px-4 border-r last:border-0 border-slate-700">
                            <span className="text-[16px] font-bold text-orange-500 uppercase">{key === 'bgTop' ? 'Top View BG' : 'Side View BG'}</span>
                            <input type="file" className="text-[10px]" onChange={e => {
                                if (e.target.files[0]) {
                                    const img = new Image(); img.onload = () => setImages(p => ({ ...p, [key]: img }));
                                    img.src = URL.createObjectURL(e.target.files[0]);
                                }
                            }} />
                        </div>
                    ))}
                </div>

                <div className="flex flex-row gap-6 justify-center">
                    {['top', 'side'].map(v => (
                        <div key={v} className="bg-black border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
                            <div className="bg-slate-800 text-[10px] px-2 py-1 font-bold uppercase tracking-widest flex justify-between">
                                <span>{v} View</span>
                                {images[v === 'top' ? 'bgTop' : 'bgSide'] && <span className="text-emerald-500 text-[8px]">BG LOADED</span>}
                            </div>
                            <canvas ref={v === 'top' ? topCanvasRef : sideCanvasRef} onMouseDown={e => handleMouseDown(e, v)} onMouseMove={e => handleMouseMove(e, v)} className="cursor-move" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 flex flex-col shadow-2xl z-20 rounded-2xl">
                <h2 className="text-orange-500 font-black text-lg mb-4 border-b border-slate-800 pb-2 italic text-center uppercase tracking-tighter">X-SIM V3 REGISTRY</h2>
                <CategorySelect categories={categories} value={selectedCategoryId} onChange={setSelectedCategoryId} skipFirst={true} className="mb-6 text-black" />
                <div className="flex-1 overflow-y-auto space-y-2">
                    {itemList.map(item => (
                        <div key={item.id} onClick={() => handleSelectItem(item)} className={`bg-slate-800/80 border border-slate-700 rounded-lg p-2 hover:border-orange-500 cursor-pointer flex gap-3 items-center group ${selectedItem?.id === item.id ? 'border-orange-500 bg-slate-800' : ''}`}>
                            <div className="w-12 h-12 bg-black rounded border border-slate-600 flex-shrink-0 overflow-hidden">
                                <img src={`${API_URL}/${item.top}`} alt="p" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs font-bold truncate group-hover:text-orange-400">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Control Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md p-4 border-t border-slate-700 flex flex-row items-center justify-between gap-6 z-50">
                <div className="flex items-center gap-6 border-r border-slate-800 pr-6">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={multiplyEnabled} onChange={e => setMultiplyEnabled(e.target.checked)} className="h-4 w-4 accent-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Multiply</span>
                    </div>
                    <div className="w-24">
                        <span className="text-[10px] text-yellow-500 block font-bold uppercase">Luma: {threshold}</span>
                        <input type="range" min="0" max="255" value={threshold} onChange={e => setThreshold(+e.target.value)} className="w-full h-1 accent-yellow-500" />
                    </div>
                </div>
                <div className="flex gap-4 items-center flex-1">
                    {['x', 'y', 'z'].map(axis => (
                        <div key={axis} className="flex flex-col">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Pos {axis}</span>
                            <input type="number" value={rect[axis]} onChange={e => setRect(p => ({ ...p, [axis]: +e.target.value }))} className="w-16 bg-black text-[10px] p-1 rounded border border-slate-700" />
                        </div>
                    ))}
                    <div className="flex flex-col ml-2">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">W / H</span>
                        <div className="flex gap-1">
                            <input type="number" value={rect.w} onChange={e => setRect(p => ({ ...p, w: +e.target.value }))} className="w-12 bg-black text-[10px] p-1 rounded border border-slate-700" />
                            <input type="number" value={rect.h} onChange={e => setRect(p => ({ ...p, h: +e.target.value }))} className="w-12 bg-black text-[10px] p-1 rounded border border-slate-700" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={resetEditor} className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black px-4 py-2 rounded-lg">RESET</button>
                    <button onClick={uploadCanvas} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg uppercase tracking-wider">Save Simulation</button>
                </div>
            </div>
        </div>
    );
}