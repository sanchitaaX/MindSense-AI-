import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

export const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, setUser);
        return unsub;
    }, []);

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        navigate("/");
    };

    const links = [
        { to: "/", label: "Home" },
        { to: "/chat", label: "Chat" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/pricing", label: "Pricing" },
    ];

    const isHero = location.pathname === "/";

    return (
        <nav
            style={{
                position: "fixed",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 100,
                width: 900,
                background: isHero ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 50,
                border: isHero ? "1px solid rgba(233, 30, 140, 0.4)" : "1px solid rgba(255,255,255,0.6)",
                padding: "8px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: isHero ? "0 4px 20px rgba(0,0,0,0.05)" : "0 8px 32px rgba(0,0,0,0.05)",
            }}
        >
            {/* Brand */}
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <div className={`p-1.5 rounded-[12px] shadow-[2px_2px_0px_rgba(0,0,0,0.5)] flex items-center justify-center ${isHero ? 'bg-white/80 backdrop-blur-md border-[1.5px] border-pink-400' : 'bg-white border-2 border-slate-900'}`}>
                    <img src="/src/assets/logo.png" alt="MindSense Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
                </div>
                <span
                    style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: "-0.5px",
                        color: "var(--text-primary)",
                        textShadow: isHero ? "0px 1px 8px rgba(255,255,255,0.7)" : "none",
                    }}
                >
                    MindSense AI
                </span>
            </Link>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {links.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        style={{
                            textDecoration: "none",
                            padding: "8px 18px",
                            borderRadius: 50,
                            fontSize: 14,
                            fontWeight: 600,
                            color:
                                location.pathname === link.to
                                    ? "white"
                                    : "var(--text-secondary)",
                            textShadow: isHero && location.pathname !== link.to ? "0px 1px 8px rgba(255,255,255,0.7)" : "none",
                            background:
                                location.pathname === link.to
                                    ? "linear-gradient(135deg, #e91e8c, #9c27b0)"
                                    : "transparent",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {/* Auth area */}
            {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* User pill */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 14px 6px 6px",
                            borderRadius: 50,
                            background: isHero ? "rgba(255,255,255,0.1)" : "rgba(233,30,140,0.08)",
                            border: isHero ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(233,30,140,0.2)",
                        }}
                    >
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #e91e8c, #9c27b0)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 800,
                                color: "white",
                                flexShrink: 0,
                            }}
                        >
                            {(user.displayName || user.email || "U")[0].toUpperCase()}
                        </div>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                maxWidth: 120,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {user.displayName || user.email?.split("@")[0] || "User"}
                        </span>
                    </div>

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 18px",
                            borderRadius: 50,
                            border: isHero ? "1px solid rgba(255,255,255,0.3)" : "2px solid #000",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-body)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <LogOut size={14} />
                        Log Out
                    </button>
                </div>
            ) : (
                <Link to="/auth" style={{ textDecoration: "none" }}>
                    <button className="neo-btn neo-btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
                        Sign In
                    </button>
                </Link>
            )}
        </nav>
    );
};
