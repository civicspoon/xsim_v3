"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

const ICON_CHAR = "🔍";
const canvasSize = { width: 850, height: 980 };
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const courseTime = 20; // minutes
const speed = 2;

// --------------------------- Canvas Class ---------------------------
class _Canvas {
    constructor(domId, imageX, imageY, onAnimationEnd) {
        this.domId = domId;
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.originalImage = null;
        this.iconPosition = null;
        this.imageX = imageX || -820;
        this.imageY = imageY || 0;
        this.onAnimationEnd = onAnimationEnd;
        this.scale = 1;
        this.isPaused = false;
        this.animating = false;
        this.lastDraw = { x: 0, y: 0, w: 0, h: 0 };
        this.debugOffsetY = 0;
    }

    start(w, h) {
        this.canvas.width = w; this.canvas.height = h;
        this.canvas.style.border = "2px solid #333";
        this.canvas.style.borderRadius = "24px";
        const domTarget = document.getElementById(this.domId);
        if (domTarget) { domTarget.innerHTML = ""; domTarget.appendChild(this.canvas); }
        this.clearScreen();
    }

    clearScreen() { this.ctx.fillStyle = "white"; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }

    async drawImageFromURL(url) {
        try {
            const img = new Image(); img.crossOrigin = "anonymous"; img.src = url;
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
            this.originalImage = img; this.imageX = -img.width;
            this.imageY = (this.canvas.height - (img.height * this.scale)) / 2;
            this.redraw();
        } catch (err) { console.error("Load Error:", err); }
    }

    animateLeftToRight() {
        if (!this.originalImage) return;
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animating = true; this.imageX = -this.originalImage.width; this.isPaused = false;
        const step = () => {
            if (!this.isPaused) { this.imageX += speed; this.redraw(); }
            if (this.imageX > this.canvas.width) {
                this.animating = false; this.animationFrameId = null;
                if (this.onAnimationEnd) this.onAnimationEnd(); return;
            }
            this.animationFrameId = requestAnimationFrame(step);
        };
        step();
    }

    redraw() {
        if (!this.originalImage) return;
        const img = this.originalImage; this.clearScreen();
        const drawW = img.width * this.scale; const drawH = img.height * this.scale;
        const drawX = this.imageX; const drawY = (this.canvas.height - drawH) / 2;
        this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
        this.lastDraw = { x: drawX, y: drawY, w: drawW, h: drawH };
        if (this.iconPosition) {
            this.ctx.font = `${40 * this.scale}px Arial`; this.ctx.fillStyle = "red";
            this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
            this.ctx.fillText(ICON_CHAR, this.iconPosition.x, this.iconPosition.y);
        }
    }

    handleWheel(e) {
        e.preventDefault(); const zoomSpeed = 0.1;
        if (e.deltaY < 0) this.scale = Math.min(this.scale + zoomSpeed, 5);
        else this.scale = Math.max(this.scale - zoomSpeed, 0.2);
        this.redraw();
    }

    resetZoom() { this.scale = 1; this.iconPosition = null; }
    togglePause() { this.isPaused = !this.isPaused; }
    setIcon(x, y) { this.iconPosition = { x, y }; this.redraw(); }
    restoreOriginal() { this.iconPosition = null; this.redraw(); }

    applyBrightness() {
        if (!this.originalImage) return;
        this.redraw();
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.5);
            data[i + 1] = Math.min(255, data[i + 1] * 1.5);
            data[i + 2] = Math.min(255, data[i + 2] * 1.5);
        }
        this.ctx.putImageData(imgData, 0, 0);
    }

    applyNegative() {
        if (!this.originalImage) return; this.redraw();
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) { data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2]; }
        this.ctx.putImageData(imgData, 0, 0);
    }

    applyBlackAndWhite() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } this.ctx.putImageData(imgData, 0, 0); }
    organicStrip() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const r = data[i], g = data[i + 1], b = data[i + 2]; const isO = r > 110 && g > 50 && g < 220 && b < 160 && r > g && g > b; if (isO) { const avg = (r + g + b) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } } this.ctx.putImageData(imgData, 0, 0); }
    organicOnly() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; for (let i = 0; i < data.length; i += 4) { const r = data[i], g = data[i + 1], b = data[i + 2]; const isD = b > 30 && b > r && b > g - 20; const isL = b > 150 && g > 130 && r < 210; if (isD || isL) { const avg = (r + g + b) / 3; data[i] = data[i + 1] = data[i + 2] = avg; } } this.ctx.putImageData(imgData, 0, 0); }
    superEnhance() { if (!this.originalImage) return; this.redraw(); const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height); const data = imgData.data; const w = imgData.width, h = imgData.height; const copy = new Uint8ClampedArray(data); const gG = (x, y) => { if (x < 0 || x >= w || y < 0 || y >= h) return 0; const i = (y * w + x) * 4; return 0.299 * copy[i] + 0.587 * copy[i + 1] + 0.114 * copy[i + 2]; }; for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) { const gx = -1 * gG(x - 1, y - 1) + 1 * gG(x + 1, y - 1) - 2 * gG(x - 1, y) + 2 * gG(x + 1, y) - 1 * gG(x - 1, y + 1) + 1 * gG(x + 1, y + 1); const gy = -1 * gG(x - 1, y - 1) - 2 * gG(x, y - 1) - 1 * gG(x + 1, y - 1) + 1 * gG(x - 1, y + 1) + 2 * gG(x, y + 1) + 1 * gG(x + 1, y + 1); const e = Math.sqrt(gx * gx + gy * gy) * 1.5; const i = (y * w + x) * 4; data[i] = Math.min(255, (copy[i] * 1.1) + e - 10); data[i + 1] = Math.min(255, (copy[i + 1] * 1.1) + e - 10); data[i + 2] = Math.min(255, (copy[i + 2] * 1.1) + e - 10); } } this.ctx.putImageData(imgData, 0, 0); }
}

// --------------------------- Main Page ---------------------------
export default function Page() {
    const params = useParams();
    const router = useRouter();
    const [category, setCategory] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [imageIndex, setImageIndex] = useState(0);
    const [imageList, setImageList] = useState([]);
    const [user, setUser] = useState(null);
    const [timeLeft, setTimeLeft] = useState(courseTime * 60);
    const [isFinished, setIsFinished] = useState(false);
    const leftCanvasRef = useRef(null);
    const rightCanvasRef = useRef(null);
    const [lastClickInside, setLastClickInside] = useState(null);
    const [clicked, setClicked] = useState(false);
    const [afkStrikes, setAfkStrikes] = useState(0);
    const afkTimerRef = useRef(null);
    const [imgFunction, setImgFunction] = useState("Normal");

    const area = params.areaid;
    const typeid = params.typeid;
    const [score, setScore] = useState(0);
    const [hits, setHits] = useState(0);
    const [fars, setFars] = useState(0);

    const fetchCategory = async () => { try { const res = await fetch(`${API_URL}/itemCategory`); const data = await res.json(); setCategory(data || []); } catch (err) { console.error(err); } };
    const fetchImages = async () => { try { const res = await fetch(`${API_URL}/cbt/random/${area}/${typeid || 'all'}`); if (!res.ok) throw new Error('Fail'); const data = await res.json(); setImageList(Array.isArray(data) ? data : [data]); } catch (err) { console.error(err); } };
    const fetchUser = async () => { try { const XuserId = localStorage.getItem("XuserId"); const res = await fetch(`${API_URL}/users/${XuserId}`); const data = await res.json(); setUser(data); } catch (err) { console.error(err); } };

    const resetAfkTimer = () => { if (afkTimerRef.current) clearTimeout(afkTimerRef.current); afkTimerRef.current = setTimeout(() => handleAfkDetected(), 60000); };
    const handleAfkDetected = () => {
        leftCanvasRef.current.isPaused = true; rightCanvasRef.current.isPaused = true;
        setAfkStrikes((prev) => {
            const newStrikes = prev + 1;
            if (newStrikes >= 3) { Swal.fire({ title: "Disconnected", icon: "error" }).then(() => window.location.href = "/"); }
            else { Swal.fire({ title: "AFK Detected", text: `Strike ${newStrikes}/3`, icon: "warning" }).then(() => { leftCanvasRef.current.isPaused = false; rightCanvasRef.current.isPaused = false; resetAfkTimer(); }); }
            return newStrikes;
        });
    };

    useEffect(() => {
        window.addEventListener("mousemove", resetAfkTimer); window.addEventListener("keydown", resetAfkTimer); window.addEventListener("click", resetAfkTimer);
        leftCanvasRef.current = new _Canvas("canvasLeft", -820, 0, () => nextImage(false));
        rightCanvasRef.current = new _Canvas("canvasRight", -820, 0, () => { });
        rightCanvasRef.current.debugOffsetY = 177;
        leftCanvasRef.current.start(canvasSize.width, canvasSize.height);
        rightCanvasRef.current.start(canvasSize.width, canvasSize.height);

        const keyHandler = (e) => {
            const key = e.key.toUpperCase();
            if (key === "Q") { leftCanvasRef.current.applyBlackAndWhite(); rightCanvasRef.current.applyBlackAndWhite(); setImgFunction("B&W"); }
            if (key === "W") { leftCanvasRef.current.applyNegative(); rightCanvasRef.current.applyNegative(); setImgFunction("NEG"); }
            if (key === "A") { leftCanvasRef.current.organicOnly(); rightCanvasRef.current.organicOnly(); setImgFunction("O2"); }
            if (key === "S") { leftCanvasRef.current.organicStrip(); rightCanvasRef.current.organicStrip(); setImgFunction("OS"); }
            if (key === "D") { leftCanvasRef.current.applyBrightness(); rightCanvasRef.current.applyBrightness(); setImgFunction("HI"); }
            if (key === "R") { leftCanvasRef.current.resetZoom(); rightCanvasRef.current.resetZoom(); leftCanvasRef.current.redraw(); rightCanvasRef.current.redraw(); setImgFunction("Normal"); }
            if (key === "E") { leftCanvasRef.current.superEnhance(); rightCanvasRef.current.superEnhance(); setImgFunction("SEN"); }
            if (key === " ") { leftCanvasRef.current.togglePause(); rightCanvasRef.current.togglePause(); }
        };
        window.addEventListener("keydown", keyHandler);
        fetchCategory(); fetchImages(); fetchUser(); resetAfkTimer();
        return () => {
            window.removeEventListener("keydown", keyHandler); window.removeEventListener("mousemove", resetAfkTimer);
            window.removeEventListener("keydown", resetAfkTimer); window.removeEventListener("click", resetAfkTimer);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => { if (!leftCanvasRef.current?.isPaused && timeLeft > 0) setTimeLeft(t => t - 1); }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
        if (!imageList.length || isFinished) return;
        const current = imageList[imageIndex];
        leftCanvasRef.current?.drawImageFromURL(`${API_URL}${current.top}`).then(() => leftCanvasRef.current.animateLeftToRight());
        rightCanvasRef.current?.drawImageFromURL(`${API_URL}${current.side}`).then(() => rightCanvasRef.current.animateLeftToRight());

        const handleCanvasClick = (canvasRef, e, imageData) => {
            if (!canvasRef.isPaused) return;
            const rect = canvasRef.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top;
            const imageX = (clickX - canvasRef.lastDraw.x) / canvasRef.scale;
            const imageY = ((clickY - canvasRef.lastDraw.y) / canvasRef.scale) - canvasRef.debugOffsetY;
            canvasRef.setIcon(clickX, clickY);
            const itemPos = typeof imageData.itemPos === 'string' ? JSON.parse(imageData.itemPos) : imageData.itemPos;
            if (itemPos) { setLastClickInside(imageX >= itemPos.x && imageX <= itemPos.x + itemPos.w && imageY >= itemPos.y && imageY <= itemPos.y + itemPos.h); setClicked(true); }
        };
        const lClick = (e) => handleCanvasClick(leftCanvasRef.current, e, current);
        const rClick = (e) => handleCanvasClick(rightCanvasRef.current, e, current);
        leftCanvasRef.current.canvas.addEventListener("click", lClick);
        rightCanvasRef.current.canvas.addEventListener("click", rClick);
        return () => { leftCanvasRef.current.canvas.removeEventListener("click", lClick); rightCanvasRef.current.canvas.removeEventListener("click", rClick); };
    }, [imageList, imageIndex, isFinished]);

    const nextImage = (ans = false) => {
        if (!ans) setFars(f => f + 1);
        leftCanvasRef.current.resetZoom(); rightCanvasRef.current.resetZoom();
        setSelectedAnswer(""); setLastClickInside(null); setClicked(false);
        if (imageIndex >= imageList.length - 1) { setImageIndex(0); fetchImages(); }
        else { setImageIndex(p => p + 1); }
    };

    const checkAnswer = () => {
        if (!imageList.length || !selectedAnswer || isFinished) return;

        const currentImage = imageList[imageIndex];

        // 🎯 ใช้ itemCategoryID จากก้อนหลักในการเช็คกับค่าที่เลือกจาก Select
        const correctId = currentImage?.itemCategoryID;

        // แปลง selectedAnswer เป็น Number เพื่อเทียบกับ ID จาก API
        let isCorrect = (parseInt(selectedAnswer) === correctId);

        /* เงื่อนไขเพิ่มเติม: 
           ถ้าคำตอบที่ถูกต้องไม่ใช่ 'Clear' (สมมติว่า ID ของ Clear คือ 1)
           ผู้ใช้ "ต้อง" คลิกให้โดนตำแหน่งวัตถุ (lastClickInside ต้องเป็น true) ด้วยถึงจะถือว่าถูก
        */
        if (correctId !== 1 && !lastClickInside) {
            isCorrect = false;
        }

        if (isCorrect) {
            setScore(s => s + 1);
            setHits(h => h + 1);
            Swal.fire({
                title: "CORRECT",
                text: `Threat Identified: ${currentImage.item?.name || 'Clear'}`,
                timer: 800,
                icon: "success",
                showConfirmButton: false,
                background: '#111',
                color: '#fff'
            });
        } else {
            setFars(f => f + 1);
            Swal.fire({
                title: "WRONG",
                text: `Correct Answer: ${category.find(c => c.id === correctId)?.name || 'Unknown'}`,
                timer: 1000,
                icon: "error",
                showConfirmButton: false,
                background: '#111',
                color: '#fff'
            });
        }

        // ไปยังภาพถัดไป
        nextImage(true);
    };

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className="flex flex-col h-screen w-screen bg-[#050505] overflow-hidden text-white italic tracking-tighter font-sans">
            <div className="flex-1 flex overflow-hidden p-2">
                <div className="flex-1 flex items-center justify-center relative bg-[#0a0a0a] rounded-[2rem] border border-white/5 shadow-2xl">
                    <div className="flex w-full h-full p-1 gap-1">
                        <div className="flex-1 flex items-center justify-center" id="canvasLeft"></div>
                        <div className="flex-1 flex items-center justify-center" id="canvasRight"></div>
                    </div>
                </div>

                <div className={`w-[360px] text-center bg-[#111] m-2  rounded-[2.5rem] flex flex-col gap-6 border border-white/10 shadow-2xl transition-all ${isFinished ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                    <div className="flex full items-center gap-3 mb-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-red-600">Operator Terminal</h2>
                    </div>

                    <p className="text-[14px] text-center  text-gray-500 font-bold uppercase tracking-widest ">Select Threat Classification</p>

                    <select
                        className="flex w-full bg-black border-2 border-white/10 focus:border-red-600 focus:ring-0 p-3 text-center rounded-2xl text-sm font-black transition-all cursor-pointer appearance-none shadow-inner overflow-y-auto"
                        size="7"
                        value={selectedAnswer}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        style={{ whiteSpace: 'normal' }}
                    >
                        {category
                            .filter(cat => !(Number(area) === 2 && [5].includes(cat.id)) && !(Number(area) === 3 && [6, 5].includes(cat.id)))
                            .map((cat) => (
                                <option
                                    key={cat.id}
                                    value={cat.id}
                                    className="p-1 hover:bg-red-600/20 checked:bg-red-600 checked:text-white text-sm rounded-lg mb-1 transition-colors"
                                    style={{
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word',
                                        display: 'block',
                                        padding: '10px',
                                        lineHeight: '1.2',
                                        marginBottom: '4px'
                                    }}
                                >
                                    {cat.name.toUpperCase()} - {cat.id}
                                </option>
                            ))}
                    </select>

                    {selectedAnswer && (
                        <button
                            onClick={checkAnswer}
                            className="w-full p-6 bg-red-600 hover:bg-red-700 text-white text-2xl font-black shadow-xl shadow-red-600/20 active:scale-95 transition-all transform hover:skew-x-2 italic"
                        >
                            CONFIRM
                        </button>
                    )}

                    <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold text-center mb-1">Current Filter</p>
                        <p className="text-[18px] text-center text-yellow-500 font-black tracking-tighter drop-shadow-sm">{imgFunction}</p>
                    </div>
                </div>
            </div>

            <div className="h-[120px] bg-[#0d0d0d] flex items-center justify-around border-t border-white/10 px-12 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Time Remaining</span>
                    <span className="text-5xl font-black text-yellow-500 font-mono tracking-tighter drop-shadow-md">{formatTime(timeLeft)}</span>
                </div>

                <div className="h-12 w-[2px] bg-white/10 mx-4"></div>

                <div className="flex flex-col items-center min-w-[250px]">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-1 italic underline decoration-2">Operator Identity</span>
                    <span className="text-2xl font-black uppercase tracking-tighter text-white/90">{user?.fname} {user?.lname}</span>
                </div>

                <div className="h-12 w-[2px] bg-white/10 mx-4"></div>

                <div className="flex gap-16">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Score</span>
                        <span className="text-4xl font-black text-white">{score}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">AFK Strike</span>
                        <span className="text-4xl font-black text-white">{afkStrikes}/3</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">Efficiency</span>
                        <span className="text-4xl font-black text-blue-400">{(hits / (hits + fars + 0.0001) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </div>

            <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-red-600/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed -top-20 -right-20 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        </div>
    );
}