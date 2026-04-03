import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldQuestion } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth, db, signInAnonymously, firebaseEnabled } from "../lib/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import Loader from "../components/ui/loader-15";

const SECURITY_QUESTIONS = [
    "What was the name of the street you grew up on?",
    "What was the make of your first car?",
    "What city were you born in?",
    "What was the name of your primary school?",
];

type AuthMode = "signin" | "signup";

export const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get("redirect") || "/chat";

    const [mode, setMode] = useState<AuthMode>("signin");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [signupStep, setSignupStep] = useState<1 | 2>(1);
    const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [securityAnswer, setSecurityAnswer] = useState("");

    const getInternalEmail = (user: string) => {
        const clean = user.toLowerCase().replace(/[^a-z0-9]/g, "");
        return `${clean || "user"}@mindsense-ai.com`;
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!firebaseEnabled || !auth) {
                // Demo mode — bypass Firebase
                navigate(redirect);
                return;
            }
            const email = getInternalEmail(username);
            await signInWithEmailAndPassword(auth, email, password);
            navigate(redirect);
        } catch {
            setError("Invalid username or password.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username.length < 3) return setError("Username too short.");
        if (password.length < 8) return setError("Password min 8 chars.");

        if (!firebaseEnabled || !db) {
            setSignupStep(2);
            setError("");
            return;
        }
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
            if (userDoc.exists()) {
                setError("Username taken.");
            } else {
                setSignupStep(2);
                setError("");
            }
        } catch {
            setError("Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!firebaseEnabled || !auth || !db) {
                navigate(redirect);
                return;
            }
            const email = getInternalEmail(username);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), salt);

            await setDoc(doc(db, "usernames", username.toLowerCase()), { uid });
            await setDoc(doc(db, "users", uid), {
                username: username.toLowerCase(),
                securityQuestion: selectedQuestion,
                securityAnswerHash: hash,
                createdAt: new Date().toISOString()
            });

            navigate(redirect);
        } catch {
            setError("Registration failed. Try a different username.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnonymous = async () => {
        setLoading(true);
        try {
            if (firebaseEnabled && auth) {
                await signInAnonymously(auth);
            }
            navigate(redirect);
        } catch {
            navigate(redirect);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px 14px 46px",
        borderRadius: 16,
        border: "2px solid #e5e7eb",
        fontSize: 15,
        fontFamily: "var(--font-body)",
        background: "#fafafa",
        color: "#1a1a2e",
        outline: "none",
        transition: "border-color 0.2s",
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 20px 40px",
            background: "linear-gradient(135deg, #f0e6f6 0%, #fce4ec 50%, #e8f0fe 100%)",
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    width: "100%",
                    maxWidth: 460,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    borderRadius: 32,
                    padding: "48px 44px",
                    boxShadow: "0 24px 64px rgba(233,30,140,0.12), 0 0 0 1px rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.8)",
                }}
            >
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: "linear-gradient(135deg, #e91e8c, #9c27b0)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px", fontSize: 30,
                        boxShadow: "0 8px 24px rgba(233,30,140,0.3)"
                    }}>🧠</div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
                        {mode === "signin" ? "Welcome back" : "Create account"}
                    </h1>
                    <p style={{ color: "#6b7280", fontSize: 14 }}>
                        {mode === "signin" ? "Sign in to your MindSense account" : "Start your wellbeing journey"}
                    </p>
                    {!firebaseEnabled && (
                        <div style={{ marginTop: 12, padding: "8px 16px", background: "#fef3c7", borderRadius: 10, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                            ⚠️ Demo Mode — Firebase not configured
                        </div>
                    )}
                </div>

                {/* Tab switcher */}
                <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 14, padding: 4, marginBottom: 28 }}>
                    {(["signin", "signup"] as AuthMode[]).map(m => (
                        <button key={m} onClick={() => { setMode(m); setError(""); setSignupStep(1); }}
                            style={{
                                flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                                fontWeight: 700, fontSize: 14, transition: "all 0.2s",
                                background: mode === m ? "#fff" : "transparent",
                                color: mode === m ? "#e91e8c" : "#6b7280",
                                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            }}
                        >
                            {m === "signin" ? "Sign In" : "Sign Up"}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── SIGN IN ─────────────────────────────── */}
                    {mode === "signin" && (
                        <motion.form key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                            onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ position: "relative" }}>
                                <User size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={inputStyle} />
                            </div>
                            <div style={{ position: "relative" }}>
                                <Lock size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
                                <button type="button" onClick={() => setShowPassword(s => !s)}
                                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{error}</p>}
                            <button type="submit" disabled={loading} className="neo-btn neo-btn-primary" style={{ width: "100%", marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", height: 48 }}>
                                {loading ? <div style={{ transform: "scale(0.15)", width: 30, height: 30, marginLeft: -85, marginRight: -85 }}><Loader /></div> : "Sign In"}
                            </button>
                        </motion.form>
                    )}

                    {/* ── SIGN UP ─────────────────────────────── */}
                    {mode === "signup" && (
                        <motion.div key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            {signupStep === 1 ? (
                                <form onSubmit={handleSignUpStep1} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <div style={{ position: "relative" }}>
                                        <User size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required style={inputStyle} />
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <Lock size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                                        <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8 chars)" required style={inputStyle} />
                                        <button type="button" onClick={() => setShowPassword(s => !s)}
                                            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {error && <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{error}</p>}
                                    <button type="submit" disabled={loading} className="neo-btn neo-btn-primary" style={{ width: "100%", marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", height: 48 }}>
                                        {loading ? <div style={{ transform: "scale(0.15)", width: 30, height: 30, marginLeft: -85, marginRight: -85 }}><Loader /></div> : "Continue →"}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleSignUpFinal} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <button type="button" onClick={() => setSignupStep(1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", marginBottom: 4 }}>
                                        <ArrowLeft size={14} /> Back
                                    </button>
                                    <div style={{ position: "relative" }}>
                                        <ShieldQuestion size={18} color="#9ca3af" style={{ position: "absolute", left: 14, top: 16 }} />
                                        <select value={selectedQuestion} onChange={e => setSelectedQuestion(e.target.value)}
                                            style={{ ...inputStyle, paddingTop: 14, paddingBottom: 14, appearance: "none" }}>
                                            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                        </select>
                                    </div>
                                    <input value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} placeholder="Your answer (remembered forever)" required style={inputStyle} />
                                    {error && <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{error}</p>}
                                    <button type="submit" disabled={loading} className="neo-btn neo-btn-primary" style={{ width: "100%", marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", height: 48 }}>
                                        {loading ? <div style={{ transform: "scale(0.15)", width: 30, height: 30, marginLeft: -85, marginRight: -85 }}><Loader /></div> : "Create Account"}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>

                {/* Continue anonymously */}
                <button onClick={handleAnonymous} disabled={loading}
                    className="neo-btn neo-btn-secondary" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", height: 48 }}>
                    {loading ? <div style={{ transform: "scale(0.15)", width: 30, height: 30, marginLeft: -85, marginRight: -85 }}><Loader /></div> : "👤 Continue Anonymously"}
                </button>

                <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
                    <Link to="/" style={{ color: "#e91e8c", fontWeight: 600, textDecoration: "none" }}>← Back to home</Link>
                </p>
            </motion.div>
        </div>
    );
};
