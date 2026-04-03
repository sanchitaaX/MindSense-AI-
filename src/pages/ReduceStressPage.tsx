import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRiskScore } from "../hooks/useRiskScore";
import { ColoringCanvas } from "../components/ui/ColoringCanvas";
import { ZenRunner } from "../components/ui/ZenRunner";

export const ReduceStressPage: React.FC = () => {
    const { riskScore } = useRiskScore();
    const [clarityPoints, setClarityPoints] = useState(0);

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
            <div style={{ width: 1000, margin: "0 auto", padding: "0 20px" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, marginBottom: 16 }}>
                        Reduce <span className="gradient-text">Stress</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
                        Take a breather. Engage in a calming coloring session or let off some steam with a quick game.
                    </p>
                    <div style={{ marginTop: 20, display: "inline-block", background: "rgba(233,30,140,0.1)", padding: "6px 16px", borderRadius: 20, color: "#e91e8c", fontWeight: 700 }}>
                        Global Clarity Points: {clarityPoints}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: "rgba(255,255,255,0.6)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 28,
                            border: "1px solid rgba(255,255,255,0.7)",
                            padding: "40px",
                            boxShadow: "0 8px 32px rgba(233,30,140,0.06)",
                        }}
                    >
                        <ColoringCanvas
                            riskScore={riskScore.score}
                            onShapeFilled={(data) => setClarityPoints(prev => prev + data.clarityAwarded)}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            background: "rgba(255,255,255,0.6)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 28,
                            border: "1px solid rgba(255,255,255,0.7)",
                            padding: "40px",
                            boxShadow: "0 8px 32px rgba(233,30,140,0.06)",
                        }}
                    >
                        <ZenRunner onClarityEarned={(pts) => setClarityPoints(prev => prev + pts)} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
