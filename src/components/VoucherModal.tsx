"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { HighlightCard } from "./ui/card-5";

interface VoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    promoCode: string;
}

export function VoucherModal({ isOpen, onClose, promoCode }: VoucherModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#e91e8c', '#a855f7', '#ffffff'] });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#e91e8c', '#a855f7', '#ffffff'] });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(promoCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md"
                    >
                        <HighlightCard
                            title="You're doing great! 🎉"
                            description="Your emotional wellness shows real progress. A gift from Fivetrees:"
                            metricValue="20% OFF"
                            metricLabel={`Code: ${promoCode}`}
                            buttonText={copied ? "Copied!" : "Copy & Visit"}
                            onButtonClick={() => {
                                handleCopy();
                                setTimeout(() => window.open('https://fivetrees.in', '_blank'), 500);
                            }}
                            icon={<Sparkles className="w-6 h-6" />}
                            color="default"
                        />

                        {/* Top Right Close Button */}
                        <button onClick={onClose} className="absolute -top-4 -right-4 w-10 h-10 bg-white border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_#000] hover:bg-slate-100 z-50">
                            <X className="w-5 h-5 text-slate-900" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
