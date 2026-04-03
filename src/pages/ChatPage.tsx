import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import { useRiskScore } from "../hooks/useRiskScore";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { WebcamCapture } from "../components/webcam/WebcamCapture";
import { VoucherModal } from "../components/VoucherModal";
import { CrisisPanel } from "../components/CrisisPanel";
import { Canvas } from "@react-three/fiber";
import { FluidScene } from "../components/ui/living-fluid-hero";
import Loader from "../components/ui/loader-15";

export const ChatPage: React.FC = () => {
    const { messages, isLoading, sendMessage } = useChat();
    const {
        riskScore,
        webcamActive,
        setWebcamActive,
        updateTextScore,
        updateFaceScore,
    } = useRiskScore();

    const [inputVal, setInputVal] = useState("");
    const [voucherOpen, setVoucherOpen] = useState(false);
    const [crisisOpen, setCrisisOpen] = useState(false);
    const [promoCode, setPromoCode] = useState("");

    // Track triggers to fire only once per session
    const voucherTriggered = useRef(false);
    const crisisTriggered = useRef(false);
    const sessionId = useRef(`session-${Date.now()}`);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    // Save risk score snapshot to Firestore after every completed AI response
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.role !== "assistant" || isLoading) return;
        if (!auth || !auth.currentUser || !db) return;

        const uid = auth.currentUser.uid;
        const saveSnapshot = async () => {
            try {
                const { setDoc, doc, serverTimestamp } = await import("firebase/firestore");
                await setDoc(doc(db!, `users/${uid}/riskHistory`, sessionId.current), {
                    score: riskScore.score,
                    level: riskScore.level,
                    dominantEmotion: riskScore.dominantEmotion,
                    textScore: riskScore.textScore,
                    faceScore: riskScore.faceScore,
                    timestamp: serverTimestamp(),
                    sessionId: sessionId.current,
                    messageCount: messages.length
                }, { merge: true });
            } catch (e) {
                console.error("Risk snapshot save error:", e);
            }
        };

        saveSnapshot();
    }, [messages, isLoading]);

    // Risk triggers
    useEffect(() => {
        // Crisis escalation (> 75)
        if (riskScore.score > 75 && !crisisTriggered.current) {
            setCrisisOpen(true);
            crisisTriggered.current = true;
        }

        // Voucher reward (< 20 and >= 10 user messages and 1 out of 10 sessions) - only for logged-in non-anonymous users
        const checkAndTriggerVoucher = async () => {
            const user = auth?.currentUser;
            if (!user || user.isAnonymous) return;

            const userMessagesCount = messages.filter(m => m.role === 'user').length;
            if (riskScore.score < 20 && userMessagesCount >= 10 && !voucherTriggered.current) {
                try {
                    const { collection, getDocs, query, where } = await import("firebase/firestore");
                    // Count how many sessions this user has with >= 10 messages
                    const historyRef = collection(db!, `users/${user.uid}/riskHistory`);
                    const q = query(historyRef, where("messageCount", ">=", 10));
                    const snapshot = await getDocs(q);

                    // Trigger if the count is a multiple of 10
                    if (snapshot.size > 0 && snapshot.size % 10 === 0) {
                        triggerVoucher();
                    }
                } catch (e) {
                    console.error("Failed to verify session count", e);
                }
            }
        };

        checkAndTriggerVoucher();
    }, [riskScore.score, messages]);

    const triggerVoucher = async () => {
        const user = auth?.currentUser;
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/generate-voucher`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_uid: user.uid, risk_score: riskScore.score })
            });
            if (res.ok) {
                const data = await res.json();
                setPromoCode(data.code);
                setVoucherOpen(true);
                voucherTriggered.current = true;

                // Store in Firestore if available
                if (db && user) {
                    await setDoc(doc(db, `users/${user.uid}/vouchers`, sessionId.current), {
                        ...data,
                        generated_at: new Date().toISOString()
                    });
                }
            }
        } catch (e) {
            console.error("Voucher generation failed", e);
        }
    };

    const handleSend = () => {
        if (!inputVal.trim()) return;
        sendMessage(inputVal, riskScore.score);
        setInputVal("");
    };

    // Analyse text score on user msg
    useEffect(() => {
        const lastMsg = messages[messages.length - 2]; // Get the user's last message if assistant is typing
        if (lastMsg && lastMsg.role === "user" && isLoading) {
            fetch(`${API_BASE_URL}/api/analyze-text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: lastMsg.content })
            })
                .then(res => res.json())
                .then(data => updateTextScore(data.distress_score, data.dominant_emotion, data.crisis_detected))
                .catch(console.error);
        }
    }, [isLoading]);

    return (
        <div style={{ height: "100vh", display: "flex", paddingTop: 80, background: "linear-gradient(135deg, #f8f0f8, #fce4ec, #f0e6f6)", overflow: "hidden" }}>

            {/* Sidebar */}
            <div style={{ width: 300, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", borderRight: "2px solid #000", padding: "24px 16px", display: "flex", flexDirection: "column" }}>
                <button className="neo-btn w-full mb-6" style={{ background: "#000", color: "#fff" }}><Plus size={16} /> NEW SESSION</button>

                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: "#94a3b8", marginBottom: 12, letterSpacing: 1 }}>RISK ENGINE</p>
                    <div style={{ padding: 20, background: "#fff", border: "3px solid #000", borderRadius: 24, boxShadow: "4px 4px 0px #000" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800 }}>LIVE SCORE</span>
                            <span style={{ fontSize: 32, fontWeight: 900, color: riskScore.score > 70 ? "#ef4444" : riskScore.score > 40 ? "#f59e0b" : "#22c55e" }}>
                                {riskScore.score}
                            </span>
                        </div>
                        <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, overflow: "hidden", border: "2px solid #000" }}>
                            <motion.div animate={{ width: `${riskScore.score}%` }} style={{ height: "100%", background: riskScore.score > 70 ? "#ef4444" : riskScore.score > 40 ? "#f59e0b" : "#22c55e" }} />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 700, marginTop: 12, color: "#64748b", textTransform: "uppercase" }}>DETECTION: {riskScore.dominantEmotion}</p>
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <Link to="/dashboard" style={{ textDecoration: "none" }}>
                            <button className="neo-btn w-full" style={{ background: "#fff" }}><Star size={16} /> ANALYTICS</button>
                        </Link>
                    </div>
                </div>

            </div>

            {/* Main Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
                {/* 3D Living Fluid Background */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", opacity: 0.15 }}>
                    <Canvas camera={{ position: [0, 0, 4], fov: 75 }}>
                        <React.Suspense fallback={null}>
                            <FluidScene />
                        </React.Suspense>
                    </Canvas>
                </div>

                {/* Header */}
                <div style={{ position: "relative", zIndex: 10, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid rgba(0,0,0,0.05)" }}>
                    <div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>Session <span className="text-pink-500">Active</span></h2>
                        {riskScore.score > 75 && <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse mt-1">SUPPORT AVAILABLE 💙</span>}
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <WebcamCapture active={webcamActive} onToggle={setWebcamActive} onEmotionData={updateFaceScore} fastApiUrl={API_BASE_URL} />
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: 16 }} className="custom-scrollbar">
                    {messages.length === 0 && (
                        <div style={{ textAlign: "center", marginTop: 60 }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28 }}>How are you truly feeling?</h3>
                            <p style={{ color: "#64748b", fontWeight: 500 }}>I&apos;m here to listen without judgement.</p>
                        </div>
                    )}
                    <AnimatePresence>
                        {messages.map((m) => (
                            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "70%",
                                    padding: "16px 20px",
                                    borderRadius: m.role === "user" ? "24px 24px 4px 24px" : "24px 24px 24px 4px",
                                    background: m.role === "user" ? "#000" : "#fff",
                                    color: m.role === "user" ? "#fff" : "#000",
                                    border: "2px solid #000",
                                    boxShadow: "4px 4px 0px rgba(0,0,0,0.1)",
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                    fontWeight: 500,
                                    position: "relative",
                                    zIndex: 10
                                }}
                            >
                                {m.content || "..."}
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                                alignSelf: "flex-start",
                                padding: "16px 20px",
                                borderRadius: "24px 24px 24px 4px",
                                background: "#fff",
                                border: "2px solid #000",
                                boxShadow: "4px 4px 0px rgba(0,0,0,0.1)",
                                position: "relative",
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                overflow: "hidden"
                            }}>
                                <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", transform: "scale(0.15)", marginLeft: -85, marginRight: -85 }}>
                                    <Loader />
                                </div>
                                <span style={{ fontWeight: 600, color: "#e91e8c", fontSize: 13 }}>Thinking...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input */}
                <div style={{ padding: "0 32px 32px", position: "relative", zIndex: 10 }}>
                    <div style={{ display: "flex", gap: 12, padding: 8, background: "#fff", border: "3px solid #000", borderRadius: 32, boxShadow: "8px 8px 0px #000" }}>
                        <input
                            value={inputVal} onChange={e => setInputVal(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSend()}
                            placeholder="Share your thoughts..."
                            style={{ flex: 1, border: "none", outline: "none", padding: "0 16px", fontWeight: 600, fontSize: 16 }}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="neo-btn" style={{ background: "#e91e8c", color: "#fff", width: 50, height: 50, padding: 0, borderRadius: "50%" }}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <VoucherModal isOpen={voucherOpen} onClose={() => setVoucherOpen(false)} promoCode={promoCode} />
            <CrisisPanel isOpen={crisisOpen} />
        </div>
    );
};
