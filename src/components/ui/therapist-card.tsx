import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, ShieldCheck, Star, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TherapistCardProps {
    name: string;
    specialization: string;
    languages: string[];
    yearsOfExperience: number;
    rating: number;
    reviewCount: number;
    whatsappNumber: string;
    isVerified: boolean;
}

const containerVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.08, duration: 0.4, ease: "easeOut" as const },
    },
};

const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export const TherapistCard: React.FC<TherapistCardProps> = ({
    name,
    specialization,
    languages,
    yearsOfExperience,
    rating,
    reviewCount,
    whatsappNumber,
    isVerified,
}) => {
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;

    const initials = name
        .split(" ")
        .filter((w) => w.length > 0)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <motion.div
            className={cn(
                "relative flex-shrink-0 rounded-2xl overflow-hidden",
            )}
            style={{
                width: 240,
                background: "linear-gradient(145deg, #ffffff, #faf5ff, #fdf2f8)",
                border: "1.5px solid rgba(168, 85, 247, 0.15)",
                boxShadow: "0 8px 32px rgba(168,85,247,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
                y: -6,
                boxShadow: "0 20px 48px rgba(168,85,247,0.15), 0 4px 12px rgba(0,0,0,0.06)",
                transition: { duration: 0.25 },
            }}
        >
            {/* Top accent bar */}
            <div style={{
                height: 4,
                background: "linear-gradient(90deg, #e91e8c, #a855f7, #6366f1)",
            }} />

            <div style={{ padding: "20px 18px 18px" }}>
                {/* Avatar + Name */}
                <motion.div variants={childVariants} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: "linear-gradient(135deg, #a855f7, #e91e8c)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: 1,
                        boxShadow: "0 4px 12px rgba(168,85,247,0.25)",
                    }}>
                        {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {name}
                            </span>
                            {isVerified && (
                                <ShieldCheck style={{ width: 14, height: 14, color: "#22c55e", flexShrink: 0 }} />
                            )}
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, display: "block", marginTop: 1 }}>
                            {specialization}
                        </span>
                    </div>
                </motion.div>

                {/* Stats row */}
                <motion.div variants={childVariants} style={{
                    display: "flex", gap: 6, marginBottom: 12,
                }}>
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 4,
                        background: "#fffbeb", borderRadius: 10, padding: "6px 10px",
                        border: "1px solid rgba(251,191,36,0.2)",
                    }}>
                        <Star style={{ width: 13, height: 13, color: "#f59e0b", fill: "#f59e0b" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>{rating}</span>
                        <span style={{ fontSize: 9, color: "#b45309", fontWeight: 500 }}>({reviewCount})</span>
                    </div>
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 4,
                        background: "#f0f9ff", borderRadius: 10, padding: "6px 10px",
                        border: "1px solid rgba(56,189,248,0.2)",
                    }}>
                        <Clock style={{ width: 13, height: 13, color: "#0ea5e9" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0c4a6e" }}>{yearsOfExperience} yrs</span>
                    </div>
                </motion.div>

                {/* Languages */}
                <motion.div variants={childVariants} style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
                    {languages.map((lang) => (
                        <span
                            key={lang}
                            style={{
                                padding: "3px 8px", borderRadius: 8,
                                background: "#f5f3ff", border: "1px solid rgba(168,85,247,0.12)",
                                fontSize: 10, fontWeight: 600, color: "#7c3aed",
                            }}
                        >
                            {lang}
                        </span>
                    ))}
                </motion.div>

                {/* WhatsApp Button */}
                <motion.a
                    variants={childVariants}
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        width: "100%", padding: "10px 0", borderRadius: 12,
                        background: "#25D366", color: "#fff",
                        fontSize: 13, fontWeight: 700, textDecoration: "none",
                        boxShadow: "0 4px 14px rgba(37,211,102,0.3)",
                        transition: "all 0.2s",
                        border: "none", cursor: "pointer",
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(37,211,102,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                >
                    <MessageCircle style={{ width: 14, height: 14 }} />
                    Message on WhatsApp
                </motion.a>
            </div>
        </motion.div>
    );
};
