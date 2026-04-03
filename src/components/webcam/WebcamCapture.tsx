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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            style={{
                                background: "rgba(255,255,255,0.95)",
                                backdropFilter: "blur(24px)",
                                borderRadius: 28,
                                padding: "36px 32px",
                                maxWidth: 380,
                                width: "100%",
                                border: "1px solid rgba(233,30,140,0.15)",
                                boxShadow: "0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.5) inset",
                            }}
                        >
                            {/* Icon */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    background: "linear-gradient(135deg, #e91e8c, #a855f7)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 8px 24px rgba(233,30,140,0.3)",
                                }}>
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, textAlign: "center", marginBottom: 8, color: "#0f172a" }}>
                                Enable Face Reading?
                            </h3>
                            <p style={{ color: "#64748b", textAlign: "center", fontSize: 13, lineHeight: 1.6, marginBottom: 28, fontWeight: 500 }}>
                                MindSense will use your camera to detect micro-expressions in real time. <strong style={{ color: "#0f172a" }}>Nothing is ever recorded</strong> — only emotion scores are used.
                            </p>

                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={() => setShowConsent(false)}
                                    style={{
                                        flex: 1, padding: "12px 0", borderRadius: 14,
                                        border: "2px solid #e2e8f0", background: "#fff",
                                        fontWeight: 700, fontSize: 14, color: "#64748b",
                                        cursor: "pointer", transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                                >
                                    Not Now
                                </button>
                                <button
                                    onClick={() => { setShowConsent(false); onToggle(true); }}
                                    style={{
                                        flex: 1, padding: "12px 0", borderRadius: 14,
                                        border: "none",
                                        background: "linear-gradient(135deg, #e91e8c, #a855f7)",
                                        fontWeight: 700, fontSize: 14, color: "#fff",
                                        cursor: "pointer", transition: "all 0.2s",
                                        boxShadow: "0 4px 16px rgba(233,30,140,0.35)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(233,30,140,0.4)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(233,30,140,0.35)"; }}
                                >
                                    <Camera className="w-4 h-4" />
                                    Enable
                                </button>
                            </div>

                            <p style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", marginTop: 16, fontWeight: 500 }}>
                                🔒 Your privacy is our priority. You can disable this anytime.
                            </p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
