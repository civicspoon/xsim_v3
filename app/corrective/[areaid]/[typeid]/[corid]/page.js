"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOperatorProfile } from "@/app/lib/auth";
import Swal from "sweetalert2";

const ICON_CHAR = "🔍";
const canvasSize = { width: 850, height: 980 };
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const courseTime = 1; // minutes
const speed = 2.5;

// --------------------------- Canvas Class ---------------------------
class _Canvas {
    constructor(domId, onAnimationEnd) {
        this.domId = domId;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.originalImage = null;
        this.iconPosition = null;
        this.imageX = 0;
        this.imageY = 0;
        this.onAnimationEnd = onAnimationEnd;
        this.scale = 1;
        this.isPaused = false;
        this.animating = false;
        this.animationFrameId = null;
        this.lastDraw = { x: 0, y: 0, w: 0, h: 0 };
        this.debugOffsetY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        this.initInteraction();
    }

    initInteraction() {
        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.scale = Math.max(0.5, Math.min(5, this.scale + delta));
            this.redraw();
        });

        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.startX = e.offsetX - this.offsetX;
            this.startY = e.offsetY - this.offsetY;
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;
            const rect = this.canvas.getBoundingClientRect();
            this.offsetX = (e.clientX - rect.left) - this.startX;
            this.offsetY = (e.clientY - rect.top) - this.startY;
            this.redraw();
        });

        window.addEventListener("mouseup", () => { this.isDragging = false; });
    }

    start(w, h) {
        this.canvas.width = w; this.canvas.height = h;
        this.canvas.style.border = "2px solid #333";
        this.canvas.style.borderRadius = "24px";
        const domTarget = document.getElementById(this.domId);
        if (domTarget) { domTarget.innerHTML = ""; domTarget.appendChild(this.canvas); }
    }

    clearScreen() { 
        this.ctx.fillStyle = "white"; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); 
    }

    async drawImageFromURL(url) {
        this.stopAnimation();
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                this.originalImage = img;
                this.imageX = -img.width;
                this.imageY = (this.canvas.height - img.height) / 2;
                this.resetZoom();
                this.redraw();
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    animateLeftToRight() {
        if (!this.originalImage) return;
        this.animating = true;
        this.isPaused = false;

        const step = () => {
            if (!this.animating) return;
            if (!this.isPaused) {
                this.imageX += speed;
                this.redraw();
            }

            if (this.imageX > this.canvas.width) {
                this.stopAnimation();
                if (this.onAnimationEnd) this.onAnimationEnd();
                return;
            }
            this.animationFrameId = requestAnimationFrame(step);
        };
        this.animationFrameId = requestAnimationFrame(step);
    }

    stopAnimation() {
        this.animating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    redraw() {
        if (!this.originalImage) return;
        this.clearScreen();
        const img = this.originalImage;
        const drawW = img.width * this.scale;
        const drawH = img.height * this.scale;
        const drawX = this.imageX + this.offsetX;
        const drawY = ((this.canvas.height - drawH) / 2) + this.offsetY;

        this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
        this.lastDraw = { x: drawX, y: drawY, w: drawW, h: drawH };

        if (this.iconPosition) {
            this.ctx.font = `${40 * this.scale}px Arial`;
            this.ctx.fillStyle = "red";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
        }
    }

    resetZoom() {
        this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.iconPosition = null;
    }

    togglePause() { this.isPaused = !this.isPaused; }
    setIcon(x, y) { this.iconPosition = { x, y }; this.redraw(); }

    // Imaging Filters
    applyBrightness() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { data[i] = Math.min(255, data[i] * 1.5); data[i + 1] = Math.min(255, data[i + 1] * 1.5); data[i + 2] = Math.min(255, data[i + 2] * 1.5); } this.ctx.putImageData(imgData, 0, 0); }
    applyNegative() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2]; } this.ctx.putImageData(imgData, 0, 0); }
    applyBlackAndWhite() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } this.ctx.putImageData(imgData, 0, 0); }
    organicStrip() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const r = data[i], g = data[i + 1], b = data[i + 2]; const isO = r > 110 && g > 50 && g < 220 && b < 160 && r > g && g > b; if (isO) { const avg = (r + g + b) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } } this.ctx.putImageData(imgData, 0, 0); }
    organicOnly() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const r = data[i], g = data[i + 1], b = data[i + 2]; const isD = b > 30 && b > r && b > g - 20; const isL = b > 150 && g > 130 && r < 210; if (isD || isL) { const avg = (r + g + b) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } } this.ctx.putImageData(imgData, 0, 0); }
    superEnhance() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; const w = imgData.width, h = imgData.height; const copy = new Uint8ClampedArray(data); const gG = (x, y) => { if (x < 0 || x >= w || y < 0 || y >= h) return 0; const i = (y * w + x) * 4; return 0.299 * copy[i] + 0.587 * copy[i + 1] + 0.114 * copy[i + 2]; }; for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) { const gx = -1 * gG(x - 1, y - 1) + 1 * gG(x + 1, y - 1) - 2 * gG(x - 1, y) + 2 * gG(x + 1, y) - 1 * gG(x - 1, y + 1) + 1 * gG(x + 1, y + 1); const gy = -1 * gG(x - 1, y - 1) - 2 * gG(x, y - 1) - 1 * gG(x + 1, y - 1) + 1 * gG(x - 1, y + 1) + 2 * gG(x, y + 1) + 1 * gG(x + 1, y + 1); const e = Math.sqrt(gx * gx + gy * gy) * 1.5; const i = (y * w + x) * 4; data[i] = Math.min(255, (copy[i] * 1.1) + e - 10); data[i + 1] = Math.min(255, (copy[i + 1] * 1.1) + e - 10); data[i + 2] = Math.min(255, (copy[i + 2] * 1.1) + e - 10); } } this.ctx.putImageData(imgData, 0, 0); }
}

// --------------------------- Page Component ---------------------------
export default function Page() {
    const params = useParams();
    const router = useRouter();
    const { areaid: area, typeid, corid } = params;

    const [operatorName, setOperatorName] = useState("Loading...");
    const [category, setCategory] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [imageIndex, setImageIndex] = useState(0);
    const [imageList, setImageList] = useState([]);
    const [timeLeft, setTimeLeft] = useState(courseTime * 60);
    const [isFinished, setIsFinished] = useState(false);
    const [imgFunction, setImgFunction] = useState("Normal");
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [fars, setFars] = useState(0);
    const [categoryStats, setCategoryStats] = useState({});
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [lastClickInside, setLastClickInside] = useState(null);

    const leftCanvasRef = useRef(null);
    const rightCanvasRef = useRef(null);

    // Initial Load & Meta
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const profile = await getOperatorProfile();
                setOperatorName(profile.fullName);

                const [catRes, imgRes] = await Promise.all([
                    fetch(`${API_URL}/itemCategory`),
                    fetch(`${API_URL}/cbt/random/${area}/${typeid || 'all'}`)
                ]);

                let categories = await catRes.json();
                const imgData = await imgRes.json();

                if (area == 2) categories = categories.filter(cat => cat.id !== 5);
                else if (area == 3) categories = categories.filter(cat => cat.id !== 5 && cat.id !== 6);

                setCategory(categories);
                if (categories.length > 0) setSelectedAnswer(categories[0].id.toString());
                setImageList(Array.isArray(imgData) ? imgData : [imgData]);
            } catch (err) { console.error(err); }
        };
        fetchMetadata();

        leftCanvasRef.current = new _Canvas("canvasLeft", () => nextImage(false));
        rightCanvasRef.current = new _Canvas("canvasRight", () => { });
        rightCanvasRef.current.debugOffsetY = 177;
        leftCanvasRef.current.start(canvasSize.width, canvasSize.height);
        rightCanvasRef.current.start(canvasSize.width, canvasSize.height);

        const handleKey = (e) => {
            const key = e.key.toUpperCase();
            if (key === "Q") { leftCanvasRef.current?.applyBlackAndWhite(); rightCanvasRef.current?.applyBlackAndWhite(); setImgFunction("B&W"); }
            else if (key === "W") { leftCanvasRef.current?.applyNegative(); rightCanvasRef.current?.applyNegative(); setImgFunction("NEG"); }
            else if (key === "A") { leftCanvasRef.current?.organicOnly(); rightCanvasRef.current?.organicOnly(); setImgFunction("O2"); }
            else if (key === "S") { leftCanvasRef.current?.organicStrip(); rightCanvasRef.current?.organicStrip(); setImgFunction("OS"); }
            else if (key === "D") { leftCanvasRef.current?.applyBrightness(); rightCanvasRef.current?.applyBrightness(); setImgFunction("HI"); }
            else if (key === "R") { leftCanvasRef.current?.resetZoom(); leftCanvasRef.current?.redraw(); rightCanvasRef.current?.redraw(); setImgFunction("Normal"); }
            else if (key === "E") { leftCanvasRef.current?.superEnhance(); rightCanvasRef.current?.superEnhance(); setImgFunction("SEN"); }
            else if (e.code === "Space") { e.preventDefault(); leftCanvasRef.current?.togglePause(); rightCanvasRef.current?.togglePause(); }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [area, typeid]);

    // Animation & Image Triggering
    useEffect(() => {
        if (imageList.length > 0 && !isFinished) {
            const current = imageList[imageIndex];
            
            const trigger = async () => {
                await Promise.all([
                    leftCanvasRef.current.drawImageFromURL(`${API_URL}${current.top}`),
                    rightCanvasRef.current.drawImageFromURL(`${API_URL}${current.side}`)
                ]);
                leftCanvasRef.current.animateLeftToRight();
                rightCanvasRef.current.animateLeftToRight();
            };
            trigger();
        }
    }, [imageIndex, imageList, isFinished]);

    const nextImage = (wasAnswered = false) => {
        if (!wasAnswered) setFars(f => f + 1);
        
        leftCanvasRef.current?.stopAnimation();
        rightCanvasRef.current?.stopAnimation();
        
        setLastClickInside(null);
        setImgFunction("Normal");
        setImageIndex(prev => (prev >= imageList.length - 1 ? 0 : prev + 1));
    };

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (timeLeft > 0 && !isFinished) setTimeLeft(t => t - 1);
            else if (timeLeft === 0 && !isFinished) finishGame();
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isFinished]);

    // Interactive Click Handling
    useEffect(() => {
        if (!imageList.length || isFinished) return;
        const current = imageList[imageIndex];

        const handleCanvasClick = (canvasRef, e, imageData) => {
            if (!canvasRef.isPaused) return;
            const rect = canvasRef.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Re-calculate based on zoom/pan
            const imageX = (clickX - canvasRef.lastDraw.x) / canvasRef.scale;
            const imageY = ((clickY - canvasRef.lastDraw.y) / canvasRef.scale) - canvasRef.debugOffsetY;
            
            canvasRef.setIcon(clickX, clickY);
            
            const itemPos = typeof imageData.itemPos === 'string' ? JSON.parse(imageData.itemPos) : imageData.itemPos;
            if (itemPos) {
                const inside = imageX >= itemPos.x && imageX <= itemPos.x + itemPos.w && imageY >= itemPos.y && imageY <= itemPos.y + itemPos.h;
                setLastClickInside(inside);
            }
        };

        const lClick = (e) => handleCanvasClick(leftCanvasRef.current, e, current);
        const rClick = (e) => handleCanvasClick(rightCanvasRef.current, e, current);
        
        leftCanvasRef.current?.canvas.addEventListener("click", lClick);
        rightCanvasRef.current?.canvas.addEventListener("click", rClick);
        
        return () => {
            leftCanvasRef.current?.canvas.removeEventListener("click", lClick);
            rightCanvasRef.current?.canvas.removeEventListener("click", rClick);
        };
    }, [imageList, imageIndex, isFinished]);

    const checkAnswer = () => {
        if (!selectedAnswer || isFinished) return;
        const currentImage = imageList[imageIndex];
        const correctId = currentImage?.itemCategoryID;
        const selectedId = parseInt(selectedAnswer);

        // Correct if: category matches AND (it's "Normal" category 1 OR user clicked inside the bounding box)
        let isCorrect = (correctId === 1) ? (selectedId === 1) : (selectedId === correctId && lastClickInside);

        setCategoryStats(prev => {
            const s = prev[correctId] || { hits: 0, total: 0 };
            return { ...prev, [correctId]: { hits: s.hits + (isCorrect ? 1 : 0), total: s.total + 1 } };
        });

        if (isCorrect) {
            setScore(s => s + 1); setHits(h => h + 1);
            Swal.fire({ title: "CORRECT", timer: 600, icon: "success", showConfirmButton: false, background: '#111', color: '#fff' });
        } else {
            setFars(f => f + 1);
            const correctName = category.find(c => c.id === correctId)?.name || 'Unknown';
            setWrongAnswers(prev => [...prev, {
                baggageId: currentImage.id,
                code: currentImage.code,
                correct: correctName,
                user: category.find(c => c.id === selectedId)?.name || 'N/A'
            }]);
            Swal.fire({ title: "WRONG", text: `Target was: ${correctName}`, timer: 900, icon: "error", showConfirmButton: false, background: '#111', color: '#fff' });
        }
        nextImage(true);
    };

    const finishGame = async () => {
        if (isFinished) return;
        const efficiency = parseFloat(((hits / (hits + fars + 0.0001)) * 100).toFixed(1));

        let earnedMinutes = 0;
        if (efficiency >= 81) earnedMinutes = 20;
        else if (efficiency >= 71) earnedMinutes = 16;
        else if (efficiency >= 61) earnedMinutes = 14;
        else if (efficiency >= 50) earnedMinutes = 12;

        setIsFinished(true);
        leftCanvasRef.current?.stopAnimation();
        rightCanvasRef.current?.stopAnimation();

        try {
            const token = localStorage.getItem("token");
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            // Logic for Corrective mode vs Standard mode
            if (corid) {
                await fetch(`${API_URL}/correctivelog`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        correctiveId: parseInt(corid),
                        score, hits, fars,
                        hitsRate: efficiency,
                        time_used: earnedMinutes,
                        category_stats: JSON.stringify(categoryStats),
                        wrong_answers: JSON.stringify(wrongAnswers)
                    })
                });

                await fetch(`${API_URL}/corrective/${corid}/add-time`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ timeEarned: earnedMinutes })
                });
            } else {
                 await fetch(`${API_URL}/training/save`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ 
                        score, hits, fars, efficiency, 
                        categoryStats: JSON.stringify(categoryStats), 
                        wrongAnswers: JSON.stringify(wrongAnswers) 
                    })
                });
            }

            localStorage.setItem("session_result", JSON.stringify({ score, efficiency, earnedMinutes, userName: operatorName }));
            Swal.fire({ title: "COMPLETED", icon: "success", background: '#111', color: '#fff' })
                .then(() => router.push(`/cbt/${area}/${typeid}/summary`));
        } catch (err) { console.error(err); }
    };

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className="flex flex-col h-screen w-screen bg-[#050505] text-white tracking-tighter font-sans overflow-hidden">
            <div className="flex-1 flex overflow-hidden p-2">
                <div className="flex-1 flex items-center justify-center relative bg-[#0a0a0a] rounded-4xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="flex w-full h-full p-1 gap-1">
                        <div className="flex-1" id="canvasLeft"></div>
                        <div className="flex-1" id="canvasRight"></div>
                    </div>
                </div>

                <div className="w-50 bg-[#111] m-2 rounded-[2.5rem] flex flex-col gap-6 border border-white/10 p-6 shadow-2xl">
                    <h2 className="text-xs font-black text-red-600 uppercase tracking-widest text-center ">Threat Classification</h2>
                    <select
                        className="w-full bg-black border-2 border-white/10 p-3 rounded-2xl text-sm font-black h-100 outline-none"
                        size="10"
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                    >
                        {category.map(cat => (
                            <option key={cat.id} value={cat.id} className="p-4 hover:bg-red-600/20 checked:bg-red-600 text-sm mb-1">{cat.name.toUpperCase()}</option>
                        ))}
                    </select>

                    <button onClick={checkAnswer} className="w-full p-6 bg-red-600 hover:bg-red-700 text-2xl font-black transition-all active:scale-95 shadow-lg shadow-red-600/20 uppercase">
                        Confirm
                    </button>

                    <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-bold mb-1 tracking-widest">Imaging Filter</p>
                        <p className="text-xl text-yellow-500 font-black">{imgFunction}</p>
                    </div>
                </div>
            </div>

            <div className="h-30 bg-[#0d0d0d] flex items-center justify-around border-t border-white/10 px-12">
                <div className="text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Time Remaining</span>
                    <p className="text-5xl font-black text-yellow-500 font-mono tracking-tighter">{formatTime(timeLeft)}</p>
                </div>
                <div className="h-12 w-0.5 bg-white/10"></div>
                <div className="text-center min-w-50">
                    <span className="text-[10px] text-red-600 uppercase font-black tracking-widest ">Operator Identity</span>
                    <p className="text-lg font-black uppercase text-white/90 truncate w-full">{operatorName}</p>
                </div>
                <div className="h-12 w-0.5 bg-white/10"></div>
                <div className="flex gap-12 text-center">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black">Score</span>
                        <p className="text-4xl font-black">{score}</p>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-black">Efficiency</span>
                        <p className="text-4xl font-black text-blue-400">{((hits / (hits + fars + 0.0001)) * 100).toFixed(0)}%</p>
                    </div>
                </div>
                <button onClick={() => router.push("/dashboard")} className="bg-red-600/10 border border-red-600/20 px-6 py-3 rounded-xl text-xs font-black hover:bg-red-600 uppercase tracking-widest transition-all">Abort Mission</button>
            </div>
        </div>
    );
}