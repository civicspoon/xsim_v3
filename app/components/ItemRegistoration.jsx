'use client';
import { useState, useEffect } from 'react';

export default function ItemRegistration() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3015';
    
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        itemCategoryId: '',
        description: '' 
    });
    
    const [files, setFiles] = useState({ top: null, side: null, realImage: null });
    const [previews, setPreviews] = useState({ top: '', side: '', realImage: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch(`${API_URL}/itemCategory/`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Failed to load categories:", err);
            }
        }
        loadCategories();
    }, [API_URL]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('itemCategoryId', formData.itemCategoryId);
        data.append('description', formData.description);
        data.append('top', files.top);
        data.append('side', files.side);
        data.append('realImage', files.realImage);

        try {
            const res = await fetch(`${API_URL}/itemImage`, {
                method: 'POST',
                body: data,
            });

            if (res.ok) {
                // Using standard alert to match your style or you can use Swal here
                alert('DATA REGISTRY UPDATED: New item synchronized successfully.');
                setFormData({ name: '', itemCategoryId: '', description: '' });
                setFiles({ top: null, side: null, realImage: null });
                setPreviews({ top: '', side: '', realImage: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto bg-slate-950 text-slate-100 font-sans">
            {/* Header with Terminal Aesthetic */}
            <header className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                        Object <span className="text-orange-500">Registry</span>
                    </h1>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">X-Sim System Management v3.0</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 animate-pulse">● SYSTEM READY</span>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Technical Specs Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
                    <div>
                        <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Object Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-orange-500 font-mono focus:border-orange-500 outline-none transition-all shadow-inner"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="INPUT IDENTIFIER..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Hazard Classification</label>
                        <select
                            required
                            className="w-full bg-black border-2 border-slate-800 p-3 rounded-xl text-white font-bold focus:border-orange-500 outline-none cursor-pointer"
                            value={formData.itemCategoryId}
                            onChange={(e) => setFormData({ ...formData, itemCategoryId: e.target.value })}
                        >
                            <option value="" disabled className="text-slate-700">-- SELECT CLASS --</option>
                            {categories.slice(1).map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                                    {cat.name.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. Visual Data Capture Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['top', 'side', 'realImage'].map((type) => (
                        <div key={type} className="flex flex-col">
                            <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500 text-center">
                                {type === 'realImage' ? 'Optical Reference' : `${type} Imaging`}
                            </label>
                            
                            <div className={`w-full aspect-square relative border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-all group
                                ${previews[type] ? 'border-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.1)]' : 'border-slate-800 bg-black hover:border-slate-600'}`}>
                                
                                {previews[type] ? (
                                    <img src={previews[type]} alt="Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-center group-hover:scale-110 transition-transform">
                                        <div className="text-slate-700 text-3xl mb-1">⎙</div>
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Upload Feed</span>
                                    </div>
                                )}
                                
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => handleFileChange(e, type)}
                                />

                                {/* Overlay for existing images */}
                                {previews[type] && (
                                    <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                        <span className="text-[10px] font-black bg-black px-2 py-1 rounded text-white border border-orange-500">REPLACE SOURCE</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Detailed Intelligence Block */}
                <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <label className="block text-[10px] font-bold mb-2 uppercase tracking-widest text-slate-500">Threat Intelligence & Log Notes</label>
                    <textarea
                        rows="3"
                        required
                        className="w-full bg-black border-2 border-slate-800 p-4 rounded-xl text-slate-300 font-medium focus:border-orange-500 outline-none shadow-inner resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detail physical characteristics and internal density components..."
                    />
                </div>

                {/* Deployment Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 rounded-2xl font-black text-lg tracking-[0.2em] transition-all shadow-2xl uppercase italic
                        ${isSubmitting 
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                            : 'bg-orange-600 hover:bg-orange-500 text-white hover:shadow-orange-900/20 active:scale-[0.98]'}`}
                >
                    {isSubmitting ? 'Synchronizing...' : 'Register to Database ↗'}
                </button>
            </form>
        </div>
    );
}