"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldAlert, MessageCircle, ArrowRight, Minimize2, Maximize2 } from "lucide-react";
import { useState } from "react";

interface CrisisPanelProps {
    isOpen: boolean;
    onMinimize?: () => void;
}

const therapists = [
    {
        name: "Nilesh Hiray",
        role: "Licensed Therapist",
        brand: "Fivetrees Technologies LLP",
        phone: "+919876543210",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nilesh"
    },
    {
        name: "Poonam Waghe",
        role: "Licensed Therapist",
        brand: "Fivetrees Technologies LLP",
        phone: "+919123456789",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Poonam"
    }
];

const helplines = [
    { name: "iCall (TISS)", number: "9152987821", type: "call" },
    { name: "Vandrevala", number: "18602662345", type: "call", note: "24/7" },
    { name: "AASRA", number: "9820466627", type: "call" },
    { name: "iCall WhatsApp", number: "9152987821", type: "wa" },
    { name: "Snehi", number: "04424640050", type: "call" }
];

export function CrisisPanel({ isOpen }: CrisisPanelProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[120] pointer-events-none flex justify-center p-4">
            <AnimatePresence>
                {!isMinimized ? (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="w-full max-w-lg bg-white border-t-8 border-x-4 border-slate-900 rounded-t-[3rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] pointer-events-auto overflow-y-auto max-h-[85vh] custom-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                    You&apos;re not alone 💙
                                </h3>
                                <p className="text-slate-500 font-bold mt-1">Help is here. Please reach out to any of these experts.</p>
                            </div>
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-3 hover:bg-slate-100 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Therapists */}
                            <section>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Dedicated Fivetrees Therapists</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {therapists.map((t) => (
                                        <div key={t.name} className="p-5 border-4 border-slate-900 rounded-3xl bg-slate-50 group hover:bg-white transition-colors">
                                            <div className="flex gap-4 items-center mb-4">
                                                <img src={t.image} alt={t.name} className="w-14 h-14 rounded-2xl border-2 border-slate-900 bg-white" />
                                                <div>
                                                    <p className="font-black text-lg text-slate-900">{t.name}</p>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={`tel:${t.phone}`} className="flex-1 py-3 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all text-xs font-black shadow-[3px_3px_0px_#000]">
                                                    <Phone className="w-3 h-3" /> CALL
                                                </a>
                                                <a href={`https://wa.me/${t.phone}`} target="_blank" className="flex-1 py-3 bg-green-500 text-white border-2 border-slate-900 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all text-xs font-black shadow-[3px_3px_0px_#000]">
                                                    <MessageCircle className="w-3 h-3" /> WHATSAPP
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Helplines */}
                            <section>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">India National Helplines</p>
                                <div className="space-y-2">
                                    {helplines.map((h) => (
                                        <div key={h.name} className="flex items-center justify-between p-4 border-2 border-slate-900 rounded-2xl bg-white hover:translate-x-1 transition-all">
                                            <div>
                                                <p className="font-black text-slate-900">{h.name}</p>
                                                {h.note && <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{h.note}</span>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono font-bold text-slate-400 text-sm">{h.number}</span>
                                                <a href={h.type === 'wa' ? `https://wa.me/${h.number}` : `tel:${h.number}`} className="p-2 bg-slate-900 text-white rounded-lg border-2 border-slate-900">
                                                    <ArrowRight className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Emergency Banner */}
                            <div className="p-6 bg-rose-50 border-4 border-rose-600 rounded-3xl flex gap-6 items-center">
                                <div className="w-16 h-16 rounded-full bg-rose-600 border-4 border-slate-900 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <ShieldAlert className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-rose-900 font-black text-xl">Immediate Danger?</p>
                                    <p className="text-rose-700 font-bold leading-tight">If you are in danger of harming yourself or others, please call 112 immediately.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-3 px-6 py-4 bg-rose-600 text-white border-4 border-slate-900 rounded-full font-black shadow-[8px_8px_0px_#000] pointer-events-auto hover:translate-y-[-4px] active:translate-y-[0px] transition-all"
                    >
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                        SUPPORT AVAILABLE 💙
                        <Maximize2 className="w-4 h-4 ml-2" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
