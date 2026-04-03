"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff } from "lucide-react";
import type { EmotionData } from "../../types";

interface WebcamCaptureProps {
    active: boolean;
    onToggle: (active: boolean) => void;
    onEmotionData: (data: EmotionData) => void;
    fastApiUrl: string;
}

export function WebcamCapture({
    active,
    onToggle,
    onEmotionData,
    fastApiUrl,
}: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [showConsent, setShowConsent] = useState(false);
    const [streamActive, setStreamActive] = useState(false);
    const [faceDetected, setFaceDetected] = useState<boolean | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        if (typeof window === "undefined") return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            onToggle(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(console.error);
                };
                setStreamActive(true);
            }
        } catch (err: any) {
            console.error("Webcam Error:", err);
            onToggle(false);
        }
    }, [onToggle]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setStreamActive(false);
    }, []);

    const captureFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !streamActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 480;
        canvas.height = 360;
        ctx.drawImage(videoRef.current, 0, 0, 480, 360);

        const base64 = canvas.toDataURL("image/jpeg", 0.85);

        try {
            const res = await fetch(`${fastApiUrl}/api/analyze-face`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_base64: base64 }),
            });

            if (res.ok) {
                const data: EmotionData = await res.json();
                const emotion = (data.dominant_emotion || "neutral").toLowerCase();

                if (emotion === "no face detected") {
                    setFaceDetected(false);
                    onEmotionData({ ...data, distress_score: 0 });
                } else {
                    setFaceDetected(true);
                    onEmotionData(data);
                }
            }
        } catch {
            setFaceDetected(false);
        }
    }, [streamActive, fastApiUrl, onEmotionData]);

    useEffect(() => {
        if (active && streamActive) {
            setFaceDetected(null);
            captureFrame();
            intervalRef.current = setInterval(captureFrame, 2000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [active, streamActive, captureFrame]);

    useEffect(() => {
        if (!active) stopCamera();
        else if (active && !streamActive) startCamera();
    }, [active, streamActive, stopCamera, startCamera]);

    return (
        <>
            <button
                onClick={() => (active ? onToggle(false) : setShowConsent(true))}
                className="neo-btn"
                style={{
                    background: active ? "#e91e8c" : "#fff",
                    color: active ? "#fff" : "#000",
                    border: "3px solid #000",
                    boxShadow: "4px 4px 0px #000",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14
                }}
            >
                {active ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                {active ? "Webcam On" : "Turn on Webcam"}
            </button>

            {active && (
                <motion.div
                    drag
                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Free drag within reasonable bounds
                    style={{ position: "fixed", top: 120, right: 32, zIndex: 100 }} // Very high z-index
                    className="w-28 overflow-hidden rounded-xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] cursor-move flex flex-col"
                >
                    {/* Header bar / Drag handle */}
                    <div style={{ padding: "6px 8px", background: "#000", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Live Camera</span>
                        <div style={{ display: "flex", gap: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                        </div>
                    </div>

                    <div className="relative w-full aspect-video bg-slate-900 border-b-4 border-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: "scaleX(-1)" }} // Mirror effect
                        />
                        {/* Hidden canvas for taking frames */}
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </div>

                    {/* Face Detection Status bar */}
                    <div className="p-2 text-center font-bold flex flex-col justify-center items-center bg-white shrink-0">
                        {faceDetected ? (
                            <span className="text-green-600 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border border-green-800" /> Face Detected
                            </span>
                        ) : (
                            <span className="text-red-600 flex items-center gap-1.5" style={{ fontSize: 11 }}>
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-red-800" /> No Face Detected
                            </span>
                        )}
                    </div>
                </motion.div>
            )}


            <AnimatePresence>
                {showConsent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-3xl p-8 max-w-sm pointer-events-auto"
                        >
                            <h3 className="text-2xl font-black mb-4">Waking up the Eye?</h3>
                            <p className="text-slate-600 mb-6 font-medium">MindSense will use your camera to read micro-expressions. No recording, just numbers. Stop anytime.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowConsent(false)} className="flex-1 py-3 border-2 border-slate-900 rounded-xl font-black hover:bg-slate-50">SHY</button>
                                <button onClick={() => { setShowConsent(false); onToggle(true); }} className="flex-1 py-3 bg-pink-500 text-white border-2 border-slate-900 rounded-xl font-black shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] active:translate-y-[0px] transition-all">ENABLE</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
