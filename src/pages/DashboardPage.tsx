import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Gift, Sparkles, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../components/ui/loader-15";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

interface RiskEntry {
    date: string;
    score: number;
    color: string;
    emotion: string;
}

interface Voucher {
    code: string;
    discount: number;
    date: string;
}

function getScoreColor(score: number) {
    if (score <= 33) return "#22c55e";
    if (score <= 66) return "#f59e0b";
    return "#ef4444";
}

function getScoreLabel(score: number) {
    if (score <= 33) return "Low Risk";
    if (score <= 66) return "Moderate Risk";
    return "High Risk";
}

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
    const [animated, setAnimated] = useState(0);
    const circumference = 2 * Math.PI * 80;
    const strokeDashoffset = circumference - (animated / 100) * circumference;
    const color = getScoreColor(score);

    useEffect(() => {
        let frame: number;
        let start: number;
        const duration = 1500;
        const tick = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setAnimated(Math.round(progress * score));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    return (
        <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="rgba(0,0,0,0.04)"
                    strokeWidth="12"
                />
                <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 100 100)"
                    style={{ transition: "stroke-dashoffset 0.1s ease" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                }}
            >
                <span
                    style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 42,
                        fontWeight: 800,
                        color: color,
                    }}
                >
                    {animated}
                </span>
                <span style={{ fontSize: 16, color: "var(--text-muted)" }}>/100</span>
            </div>
        </div>
    );
};

// Dummy data for non-logged in users (blurred background)
const dummyHistory = [
    { date: "Oct 12", score: 42, color: "#f59e0b", emotion: "neutral" },
    { date: "Oct 10", score: 25, color: "#22c55e", emotion: "happy" },
    { date: "Oct 08", score: 65, color: "#f59e0b", emotion: "anxious" },
    { date: "Oct 05", score: 80, color: "#ef4444", emotion: "sad" },
];

export const DashboardPage: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Real Data States
    const [scoreHistory, setScoreHistory] = useState<RiskEntry[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [currentScore, setCurrentScore] = useState(0);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (!auth) {
            setCheckingAuth(false);
            return;
        }
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setCheckingAuth(false);

            if (u) {
                fetchUserData(u.uid);
            } else {
                setScoreHistory(dummyHistory);
                setCurrentScore(42);
            }
        });
        return unsub;
    }, []);

    const fetchUserData = async (uid: string) => {
        if (!db) return;
        setLoadingData(true);
        try {
            // Fetch risk history
            const historyRef = collection(db, `users/${uid}/riskHistory`);
            const historyQuery = query(historyRef, orderBy("timestamp", "desc"), limit(10));
            const historySnap = await getDocs(historyQuery);

            const historyData: RiskEntry[] = [];
            historySnap.forEach(doc => {
                const data = doc.data();
                const date = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Just Now";
                historyData.push({
                    date,
                    score: data.score,
                    color: getScoreColor(data.score),
                    emotion: data.dominantEmotion || "neutral"
                });
            });

            if (historyData.length > 0) {
                setScoreHistory(historyData);
                setCurrentScore(historyData[0].score);
            } else {
                setScoreHistory([]);
                setCurrentScore(0); // Brand new user
            }

            // Fetch vouchers
            const vouchersRef = collection(db, `users/${uid}/vouchers`);
            const vouchersQuery = query(vouchersRef, orderBy("generated_at", "desc"));
            const vouchersSnap = await getDocs(vouchersQuery);

            const voucherData: Voucher[] = [];
            vouchersSnap.forEach(doc => {
                const data = doc.data();
                const d = new Date(data.generated_at);
                voucherData.push({
                    code: data.code,
                    discount: data.discount_percentage,
                    date: d.toLocaleDateString()
                });
            });
            setVouchers(voucherData);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const isLocked = !checkingAuth && !user;
    const activeHistory = isLocked ? dummyHistory : scoreHistory;

    return (
        <div
            className="mesh-bg"
            style={{
                minHeight: "100vh",
                paddingTop: 100,
                paddingBottom: 60,
                position: "relative",
            }}
        >
            <div style={{
                width: 900,
                margin: "0 auto",
                filter: isLocked ? "blur(12px) grayscale(40%)" : "none",
                opacity: isLocked ? 0.6 : 1,
                pointerEvents: isLocked ? "none" : "auto",
                transition: "filter 0.5s ease, opacity 0.5s ease",
            }}>
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 40,
                    }}
                >
                    <h1
                        style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 36,
                        }}
                    >
                        Your <span className="gradient-text">Dashboard</span>
                    </h1>
                    <Bell size={22} color="var(--text-secondary)" style={{ cursor: "pointer" }} />
                </div>

                {loadingData && !isLocked ? (
                    <div style={{ textAlign: "center", padding: "100px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ transform: "scale(0.4)", width: 80, height: 80, position: "relative", marginBottom: 20 }}>
                            <Loader />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Score Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: "rgba(255,255,255,0.6)",
                                backdropFilter: "blur(20px)",
                                borderRadius: 28,
                                border: "1px solid rgba(255,255,255,0.7)",
                                padding: "40px",
                                textAlign: "center",
                                marginBottom: 28,
                                boxShadow: "0 8px 32px rgba(233,30,140,0.06)",
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: 2,
                                    color: "#e91e8c",
                                    marginBottom: 20,
                                }}
                            >
                                Latest Risk Score
                            </p>

                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                                {activeHistory.length === 0 ? (
                                    <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "4px dashed #cbd5e1", borderRadius: "50%", color: "#94a3b8" }}>No Data Yet</div>
                                ) : (
                                    <CircularProgress score={currentScore} />
                                )}
                            </div>

                            {activeHistory.length > 0 && (
                                <>
                                    <p
                                        style={{
                                            fontSize: 18,
                                            fontWeight: 700,
                                            color: getScoreColor(currentScore),
                                            marginBottom: 8,
                                        }}
                                    >
                                        {getScoreLabel(currentScore)}
                                    </p>
                                    <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, margin: "0 auto", textTransform: "capitalize" }}>
                                        Primary detected state: <strong>{activeHistory[0]?.emotion}</strong>
                                    </p>
                                </>
                            )}
                        </motion.div>

                        {/* Two Columns: History & Vouchers */}
                        <div style={{ display: "flex", gap: 24 }}>

                            {/* Score History */}
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        fontFamily: "var(--font-display)",
                                        fontSize: 20,
                                        marginBottom: 16,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    Recent Snapshots
                                </h3>
                                <div
                                    style={{
                                        background: "rgba(255,255,255,0.6)",
                                        backdropFilter: "blur(10px)",
                                        borderRadius: 18,
                                        padding: "20px",
                                        border: "1px solid rgba(255,255,255,0.7)",
                                        minHeight: 250
                                    }}
                                >
                                    {activeHistory.length === 0 ? (
                                        <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginTop: 40 }}>Complete a chat session to see history.</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                            {activeHistory.map((entry, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: "100%" }}
                                                    transition={{ delay: 0.1 + i * 0.05 }}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 12, color: "var(--text-muted)", width: 56, flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                                                        {entry.date}
                                                    </span>

                                                    {/* Bar */}
                                                    <div style={{ flex: 1, height: 28, borderRadius: 14, background: "rgba(0,0,0,0.03)", position: "relative", overflow: "hidden" }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${entry.score}%` }}
                                                            transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: "easeOut" }}
                                                            style={{
                                                                height: "100%",
                                                                borderRadius: 14,
                                                                background: `linear-gradient(90deg, ${entry.color}, ${entry.color}cc)`,
                                                            }}
                                                        />
                                                        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                            {entry.score > 20 ? entry.emotion : ""}
                                                        </span>
                                                    </div>

                                                    <span style={{ fontSize: 14, fontWeight: 800, color: entry.color, fontFamily: "var(--font-mono)", width: 32, textAlign: "right" }}>
                                                        {entry.score}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Vouchers & Rewards */}
                            <div style={{ flex: 1 }}>
                                <h3
                                    style={{
                                        fontFamily: "var(--font-display)",
                                        fontSize: 20,
                                        marginBottom: 16,
                                        color: "var(--text-primary)",
                                    }}
                                >
                                    Earned Rewards
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {vouchers.length === 0 && !isLocked && (
                                        <div style={{ padding: "30px", textAlign: "center", background: "rgba(255,255,255,0.4)", borderRadius: 18, border: "1px dashed #cbd5e1" }}>
                                            <Gift size={32} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
                                            <p style={{ color: "#64748b", fontSize: 14 }}>Maintain a low risk score to earn wellness vouchers.</p>
                                        </div>
                                    )}
                                    {isLocked && (
                                        <div style={{ padding: "20px", background: "linear-gradient(135deg, #e91e8c, #9c27b0)", borderRadius: 18, color: "white" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                <Sparkles size={20} />
                                                <h4 style={{ fontWeight: 800, fontSize: 16 }}>MindSense+ Therapy</h4>
                                            </div>
                                            <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>Example Voucher (Locked)</p>
                                            <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: 8, fontFamily: "var(--font-mono)", textAlign: "center", fontWeight: 800, letterSpacing: 2 }}>
                                                MIND-XXXX-XXXX
                                            </div>
                                        </div>
                                    )}
                                    {vouchers.map((voucher, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + i * 0.1 }}
                                            style={{
                                                background: "linear-gradient(135deg, #e91e8c, #9c27b0)",
                                                borderRadius: 18,
                                                padding: "20px",
                                                color: "white",
                                                boxShadow: "0 10px 20px rgba(233,30,140,0.15)",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            {/* Decorative circle */}
                                            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "rgba(255,255,255,0.1)", borderRadius: "50%" }} />

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                        <Gift size={16} />
                                                        <h4 style={{ fontWeight: 800, fontSize: 15 }}>Therapy Discount</h4>
                                                    </div>
                                                    <p style={{ fontSize: 12, opacity: 0.8 }}>Earned on {voucher.date}</p>
                                                </div>
                                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 20, fontSize: 14, fontWeight: 900 }}>
                                                    {voucher.discount}% OFF
                                                </div>
                                            </div>

                                            <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: 10, fontFamily: "var(--font-mono)", textAlign: "center", fontWeight: 700, letterSpacing: 2, border: "1px dashed rgba(255,255,255,0.3)" }}>
                                                {voucher.code}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
                    <Link to="/chat" style={{ textDecoration: "none", flex: 1 }}>
                        <button
                            className="neo-btn neo-btn-primary"
                            style={{ width: "100%", padding: "16px 0", fontSize: 16 }}
                        >
                            Start Session
                        </button>
                    </Link>
                    <Link to="/pricing" style={{ textDecoration: "none", flex: 1 }}>
                        <button
                            className="neo-btn neo-btn-secondary"
                            style={{ width: "100%", padding: "16px 0", fontSize: 16 }}
                        >
                            Upgrade Plan
                        </button>
                    </Link>
                </div>
            </div>

            {/* Lock Overlay */}
            {isLocked && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.1)",
                }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            width: 440,
                            background: "white",
                            border: "4px solid black",
                            borderRadius: 32,
                            padding: "48px 32px",
                            textAlign: "center",
                            boxShadow: "16px 16px 0px black",
                        }}
                    >
                        <div style={{
                            width: 80,
                            height: 80,
                            background: "#fee2e2",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px",
                        }}>
                            <Lock size={40} color="#ef4444" />
                        </div>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, marginBottom: 12 }}>Analytics Locked</h2>
                        <p style={{ color: "#64748b", marginBottom: 32, fontSize: 15, fontWeight: 500 }}>
                            Sign in to your MindSense account to view your personalized wellbeing insights and history.
                        </p>
                        <Link to="/auth?redirect=/dashboard" style={{ textDecoration: "none" }}>
                            <button className="neo-btn neo-btn-primary" style={{ width: "100%", padding: "18px", fontSize: 16 }}>
                                Secure Sign In
                            </button>
                        </Link>
                        <Link to="/" style={{ textDecoration: "none", display: "block", marginTop: 20, color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>
                            ← Back to Home
                        </Link>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
