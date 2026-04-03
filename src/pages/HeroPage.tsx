import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Shield, Zap, Heart, Activity } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroPage: React.FC = () => {
    return (
        <div style={{ minHeight: "100vh", background: "#fff", color: "#000", overflowX: "hidden" }}>
            {/* Hero Section */}
            <section style={{ paddingTop: 160, paddingBottom: 100, position: "relative" }}>
                {/* Decorative background blobs */}
                <div style={{ position: "absolute", top: 100, left: "10%", width: 400, height: 400, background: "rgba(233,30,140,0.1)", borderRadius: "50%", filter: "blur(80px)", zIndex: 0 }} />
                <div style={{ position: "absolute", top: 300, right: "10%", width: 500, height: 500, background: "rgba(168,85,247,0.1)", borderRadius: "50%", filter: "blur(100px)", zIndex: 0 }} />

                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                    <div style={{ maxWidth: 600 }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 50, border: "2px solid #000", background: "#fff", boxShadow: "4px 4px 0px #000", marginBottom: 32 }}
                        >
                            <Sparkles size={14} className="text-pink-500" />
                            <span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>Multimodal AI Assessment</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ fontFamily: "var(--font-display)", fontSize: 84, lineHeight: 0.9, fontWeight: 900, marginBottom: 24, letterSpacing: "-2px" }}
                        >
                            Listen to your <br />
                            <span style={{ color: "#e91e8c" }}>inner signals.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={{ fontSize: 20, color: "#475569", fontWeight: 600, lineHeight: 1.5, marginBottom: 48, maxWidth: 500 }}
                        >
                            MindSense AI uses facial micro-expressions, vocal stress markers, and semantic analysis to provide a real-time risk score.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            style={{ display: "flex", gap: 20 }}
                        >
                            <Link to="/auth?redirect=/chat" style={{ textDecoration: "none" }}>
                                <button className="neo-btn" style={{ background: "#e91e8c", color: "#fff", padding: "20px 40px", fontSize: 18 }}>
                                    START ASSESSMENT <ArrowRight className="ml-2" />
                                </button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Visual: iPhone Mockup */}
                    <motion.div initial={{ opacity: 0, filter: "blur(10px)", scale: 1.1 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} transition={{ duration: 1 }}
                        style={{ position: "relative" }}
                    >
                        {/* Phone Frame */}
                        <div style={{ width: 320, height: 650, borderRadius: 45, background: "#1a1a1c", padding: 8, boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 2px #000", position: "relative", zIndex: 10 }}>
                            <div style={{ width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "linear-gradient(180deg, #fce4ec 0%, #ffffff 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ position: "absolute", top: 12, width: 80, height: 26, borderRadius: 13, background: "#000" }} />
                                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, #f472b6, #8b5cf6)", filter: "blur(12px)", opacity: 0.6, position: "absolute" }} />
                                <span style={{ fontSize: 40, position: "relative" }}>🧠</span>
                                <div style={{ marginTop: 20, textAlign: "center" }}>
                                    <p style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>Emotional Risk</p>
                                    <p style={{ fontWeight: 900, fontSize: 48, color: "#e91e8c" }}>50</p>
                                    <div style={{ width: 120, height: 8, background: "#000", borderRadius: 4, margin: "10px auto" }} />
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
                            style={{ position: "absolute", top: 100, right: -100, width: 220, padding: 20, background: "#fff", border: "3px solid #000", borderRadius: 20, boxShadow: "8px 8px 0px #000", zIndex: 20 }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Activity size={16} className="text-green-600" />
                                </div>
                                <span style={{ fontWeight: 900, fontSize: 14 }}>TEXT SIGNAL</span>
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>"I've been feeling better lately..."</p>
                            <div style={{ marginTop: 8, fontSize: 10, fontWeight: 900, color: "#22c55e" }}>SENTIMENT: POSITIVE</div>
                        </motion.div>

                        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                            style={{ position: "absolute", bottom: 80, left: -140, width: 220, padding: 20, background: "#fff", border: "3px solid #000", borderRadius: 20, boxShadow: "8px 8px 0px #000", zIndex: 20 }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fef3c7", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Activity size={16} className="text-amber-600" />
                                </div>
                                <span style={{ fontWeight: 900, fontSize: 14 }}>FACE SIGNAL</span>
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Micro-expression detected: Anxiety</p>
                            <div style={{ marginTop: 8, fontSize: 10, fontWeight: 900, color: "#f59e0b" }}>CONFIDENCE: HIGH</div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features/Trust Section */}
            <section style={{ padding: "100px 0", background: "#f8fafc", borderTop: "4px solid #000" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
                    <div style={{ textAlign: "center", marginBottom: 80 }}>
                        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900 }}>Privacy by <span style={{ color: "#e91e8c" }}>Nature</span></h2>
                        <p style={{ fontWeight: 700, color: "#64748b" }}>No video or audio is ever recorded. We only process mathematical vectors.</p>
                    </div>

                    <div style={{ gridTemplateColumns: "repeat(3, 1fr)", display: "grid", gap: 32 }}>
                        <FeatureCard icon={<Shield size={32} />} title="Vector-Only Processing" desc="Faces are converted to anonymized math. Originals are purged instantly." />
                        <FeatureCard icon={<Zap size={32} />} title="Groq-Powered LLM" desc="Ultra-low latency inference for real-time empathetic support sessions." />
                        <FeatureCard icon={<Heart size={32} />} title="Crisis Support" desc="Automatic detection and direct pathways to licensed professional help." />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: "60px 0", background: "#000", color: "#fff", textAlign: "center" }}>
                <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 32 }}>🧠</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, opacity: 0.5, textTransform: "uppercase", letterSpacing: 2 }}>© 2026 MindSense AI • Mental Health Platform</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div style={{ padding: 40, background: "#fff", border: "4px solid #000", borderRadius: 32, boxShadow: "10px 10px 0px #000" }}>
        <div style={{ marginBottom: 24, color: "#e91e8c" }}>{icon}</div>
        <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.5px" }}>{title}</h3>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#64748b", lineHeight: 1.5 }}>{desc}</p>
    </div>
);
