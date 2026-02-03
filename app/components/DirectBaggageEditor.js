"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import ItemRegistration from './ItemRegistoration';

export default function IndependentDualEditor() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    const topCanvasRef = useRef(null);
    const sideCanvasRef = useRef(null);

    // --- State ---
    const [images, setImages] = useState({ bgTop: null, bgSide: null });
    
    // แยกพิกัดของแต่ละจอออกจากกัน
    const [topRect, setTopRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [sideRect, setSideRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const [isInteracting, setIsInteracting] = useState(false);
    const [interactionMode, setInteractionMode] = useState(null); // 'drawing' | 'moving'
    const [activeView, setActiveView] = useState(null); // 'top' | 'side'
    
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // --- Interaction Logic ---
    const handleMouseDown = (e, view) => {
        const b = e.target.getBoundingClientRect();
        const mx = Math.round(e.clientX - b.left);
        const my = Math.round(e.clientY - b.top);
        
        const currentRect = view === 'top' ? topRect : sideRect;
        const isInside = (mx > currentRect.x && mx < currentRect.x + currentRect.w && 
                          my > currentRect.y && my < currentRect.y + currentRect.h);

        setActiveView(view);
        
        if (isInside && currentRect.w > 0) {
            setInteractionMode('moving');
            setDragOffset({ x: mx - currentRect.x, y: my - currentRect.y });
        } else {
            setInteractionMode('drawing');
            setStartPos({ x: mx, y: my });
            const resetRect = { x: mx, y: my, w: 0, h: 0 };
            if (view === 'top') setTopRect(resetRect);
            else setSideRect(resetRect);
        }
        setIsInteracting(true);
    };

    const handleMouseMove = (e) => {
        if (!isInteracting) return;
        const b = e.target.getBoundingClientRect();
        const mx = Math.round(e.clientX - b.left);
        const my = Math.round(e.clientY - b.top);

        if (interactionMode === 'drawing') {
            const nw = mx - startPos.x;
            const nh = my - startPos.y;
            const fx = nw < 0 ? mx : startPos.x;
            const fy = nh < 0 ? my : startPos.y;
            const fw = Math.abs(nw);
            const fh = Math.abs(nh);
            
            const updated = { x: fx, y: fy, w: fw, h: fh };
            if (activeView === 'top') setTopRect(updated);
            else setSideRect(updated);
        } 
        else if (interactionMode === 'moving') {
            const nx = mx - dragOffset.x;
            const ny = my - dragOffset.y;
            const updated = { ... (activeView === 'top' ? topRect : sideRect), x: nx, y: ny };
            if (activeView === 'top') setTopRect(updated);
            else setSideRect(updated);
        }
    };

    const handleMouseUp = () => {
        setIsInteracting(false);
        setInteractionMode(null);
        setActiveView(null);
    };

    // --- Render Logic ---
    const render = useCallback(() => {
        const draw = (ctx, bg, rectData, label) => {
            if (!ctx) return;
            ctx.canvas.width = 800; ctx.canvas.height = 600;
            
            if (bg) ctx.drawImage(bg, 0, 0, 800, 600);
            else { ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, 800, 600); }

            if (rectData.w > 0) {
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.strokeRect(rectData.x, rectData.y, rectData.w, rectData.h);
                ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
                ctx.fillRect(rectData.x, rectData.y, rectData.w, rectData.h);
                
                ctx.fillStyle = '#f97316';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(`${label}: ${rectData.x},${rectData.y}`, rectData.x, rectData.y - 10);
            }
        };

        draw(topCanvasRef.current?.getContext('2d'), images.bgTop, topRect, "TOP_ZONE");
        draw(sideCanvasRef.current?.getContext('2d'), images.bgSide, sideRect, "SIDE_ZONE");
    }, [images, topRect, sideRect]);

    useEffect(() => { render(); }, [render]);

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 select-none" onMouseUp={handleMouseUp}>
            
            <div className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 justify-between">
                <span className="text-orange-500 font-black tracking-widest text-xs uppercase italic">X-Sim Independent Axis Mode</span>
                <div className="flex gap-6 text-[10px] font-mono text-slate-400">
                    <span>TOP: [{topRect.x}, {topRect.y}]</span>
                    <span>SIDE: [{sideRect.x}, {sideRect.y}]</span>
                </div>
            </div>

            <div className="flex-1 flex p-4 gap-4 overflow-hidden">
                {/* Top View Monitor */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">FEED_01: TOP</span>
                        <input type="file" onChange={e => {
                            const img = new Image();
                            img.onload = () => setImages(p => ({ ...p, bgTop: img }));
                            img.src = URL.createObjectURL(e.target.files[0]);
                        }} className="text-[9px] file:bg-orange-600 file:border-0 file:rounded file:text-white" />
                    </div>
                    <div className="flex-1 bg-black rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl">
                        <canvas ref={topCanvasRef} 
                                onMouseDown={e => handleMouseDown(e, 'top')} 
                                onMouseMove={handleMouseMove} 
                                className="w-full h-full object-contain cursor-crosshair" />
                    </div>
                </div>

                {/* Side View Monitor */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500">FEED_02: SIDE</span>
                        <input type="file" onChange={e => {
                            const img = new Image();
                            img.onload = () => setImages(p => ({ ...p, bgSide: img }));
                            img.src = URL.createObjectURL(e.target.files[0]);
                        }} className="text-[9px] file:bg-orange-600 file:border-0 file:rounded file:text-white" />
                    </div>
                    <div className="flex-1 bg-black rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl">
                        <canvas ref={sideCanvasRef} 
                                onMouseDown={e => handleMouseDown(e, 'side')} 
                                onMouseMove={handleMouseMove} 
                                className="w-full h-full object-contain cursor-crosshair" />
                    </div>
                </div>
            </div>

            {/* Save Actions */}
            <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex justify-center gap-4">
                <button onClick={() => { setTopRect({x:0,y:0,w:0,h:0}); setSideRect({x:0,y:0,w:0,h:0}); }} className="px-8 py-2 bg-slate-800 rounded-lg text-xs font-bold uppercase hover:text-red-500 transition-colors">Reset All Zones</button>
                <button className="px-12 py-2 bg-emerald-600 rounded-lg text-xs font-black uppercase italic tracking-widest shadow-lg shadow-emerald-900/20">Sync & Save Registry</button>
            </div>
        </div>
    );
}