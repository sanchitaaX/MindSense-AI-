import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";

interface PricingPlan {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    isPopular?: boolean;
    accent: string;
}

const Counter = ({ from, to }: { from: number; to: number }) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const controls = animate(from, to, {
            duration: 1,
            onUpdate(value) {
                node.textContent = value.toFixed(0);
            },
        });
        return () => controls.stop();
    }, [from, to]);
    return <span ref={nodeRef} />;
};

const PLANS: PricingPlan[] = [
    {
        name: "Starter",
        monthlyPrice: 29,
        yearlyPrice: 290,
        features: ["1 User", "Text Analysis Only", "5 Sessions/week", "Basic Reports"],
        isPopular: false,
        accent: "bg-pink-500",
    },
    {
        name: "Pro",
        monthlyPrice: 99,
        yearlyPrice: 990,
        features: ["5 Users", "Text + Voice + Facial", "Unlimited Sessions", "Priority Support"],
        isPopular: true,
        accent: "bg-purple-500",
    },
    {
        name: "Enterprise",
        monthlyPrice: 199,
        yearlyPrice: 1990,
        features: ["Unlimited Users", "All Modalities", "Custom Integrations", "24/7 Dedicated Support"],
        isPopular: false,
        accent: "bg-violet-600",
    },
];

const accentMap: Record<string, string> = {
    "bg-pink-500": "#ec4899",
    "bg-purple-500": "#a855f7",
    "bg-violet-600": "#7c3aed",
};

const PricingCard: React.FC<{
    plan: PricingPlan;
    isYearly: boolean;
    index: number;
}> = ({ plan, isYearly, index }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 15, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);
    const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const previousPrice = !isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const color = accentMap[plan.accent] || "#e91e8c";

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            style={{ rotateX, rotateY, perspective: 1000 }}
            onMouseMove={(e) => {
                if (!cardRef.current) return;
                const rect = cardRef.current.getBoundingClientRect();
                mouseX.set((e.clientX - (rect.x + rect.width / 2)) / rect.width);
                mouseY.set((e.clientY - (rect.y + rect.height / 2)) / rect.height);
            }}
            onMouseLeave={() => {
                mouseX.set(0);
                mouseY.set(0);
            }}
        >
            <div
                style={{
                    position: "relative",
                    background: "white",
                    borderRadius: 20,
                    padding: 28,
                    border: "3px solid #1a1a2e",
                    boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.9)",
                    transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "8px 8px 0px 0px rgba(0,0,0,0.9)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0px 0px rgba(0,0,0,0.9)";
                }}
            >
                {/* Price Badge */}
                <motion.div
                    animate={{
                        rotate: [0, 10, 0, -10, 0],
                        scale: [1, 1.1, 0.9, 1.1, 1],
                        y: [0, -5, 5, -3, 0],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
                    style={{
                        position: "absolute",
                        top: -16,
                        right: -16,
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #1a1a2e",
                        boxShadow: "3px 3px 0px 0px rgba(0,0,0,0.9)",
                        color: "white",
                        flexDirection: "column",
                    }}
                >
                    <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
                        $<Counter from={previousPrice} to={currentPrice} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700 }}>/{isYearly ? "yr" : "mo"}</div>
                </motion.div>

                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1a1a2e", marginBottom: 8 }}>
                    {plan.name}
                </h3>

                {plan.isPopular && (
                    <motion.span
                        animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            background: color,
                            color: "white",
                            fontWeight: 700,
                            borderRadius: 6,
                            fontSize: 11,
                            border: "2px solid #1a1a2e",
                            boxShadow: "2px 2px 0px 0px rgba(0,0,0,0.9)",
                            marginBottom: 12,
                        }}
                    >
                        POPULAR
                    </motion.span>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
                    {plan.features.map((feature, i) => (
                        <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ x: 5, scale: 1.02, transition: { type: "spring", stiffness: 400 } }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "#fafafa",
                                borderRadius: 8,
                                border: "2px solid #1a1a2e",
                                boxShadow: "2px 2px 0px 0px rgba(0,0,0,0.9)",
                            }}
                        >
                            <motion.span
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    background: color,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    border: "1px solid #1a1a2e",
                                    boxShadow: "1px 1px 0px 0px rgba(0,0,0,0.9)",
                                    flexShrink: 0,
                                }}
                            >
                                ✓
                            </motion.span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{feature}</span>
                        </motion.div>
                    ))}
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95, rotate: [-1, 1, 0] }}
                    style={{
                        width: "100%",
                        padding: "12px 0",
                        borderRadius: 12,
                        background: color,
                        color: "white",
                        fontWeight: 900,
                        fontSize: 14,
                        border: "2px solid #1a1a2e",
                        boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.9)",
                        cursor: "pointer",
                        transition: "box-shadow 0.2s",
                    }}
                >
                    GET STARTED →
                </motion.button>
            </div>
        </motion.div>
    );
};

export const PricingPage: React.FC = () => {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f0f0f0",
                paddingTop: 120,
                paddingBottom: 60,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background effects */}
            <div style={{ position: "absolute", inset: 0 }}>
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: "absolute",
                            width: 8,
                            height: 8,
                            background: "rgba(0,0,0,0.05)",
                            borderRadius: "50%",
                            left: `${(i * 13) % 100}%`,
                            top: `${(i * 17) % 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, (i % 20) - 10, 0],
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3 + (i % 3),
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            {/* Grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                }}
            />

            <div style={{ width: 900, margin: "0 auto", position: "relative", zIndex: 10 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1
                            style={{
                                fontSize: 44,
                                fontWeight: 900,
                                color: "#1a1a2e",
                                background: "linear-gradient(to right, white, #f5f5f5)",
                                display: "inline-block",
                                padding: "16px 40px",
                                borderRadius: 16,
                                border: "4px solid #1a1a2e",
                                boxShadow: "8px 8px 0px 0px rgba(0,0,0,0.9), 15px 15px 15px -3px rgba(0,0,0,0.1)",
                            }}
                        >
                            Choose Your Plan
                        </h1>
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                height: 8,
                                background: "linear-gradient(to right, #1a1a2e, #6b7280, #1a1a2e)",
                                borderRadius: 4,
                                marginTop: 12,
                                maxWidth: 300,
                                margin: "12px auto 0",
                            }}
                        />
                    </motion.div>
                </div>

                {/* Toggle */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 40,
                    }}
                >
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: !isYearly ? "#1a1a2e" : "#6b7280",
                        }}
                    >
                        Monthly
                    </span>
                    <motion.button
                        onClick={() => setIsYearly(!isYearly)}
                        style={{
                            width: 64,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            background: "#e5e7eb",
                            borderRadius: 50,
                            padding: 4,
                            border: "2px solid #1a1a2e",
                            boxShadow: "2px 2px 0px 0px rgba(0,0,0,0.9)",
                            cursor: "pointer",
                        }}
                    >
                        <motion.div
                            animate={{ x: isYearly ? 32 : 0 }}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "white",
                                border: "2px solid #1a1a2e",
                            }}
                        />
                    </motion.button>
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: isYearly ? "#1a1a2e" : "#6b7280",
                        }}
                    >
                        Yearly
                    </span>
                    {isYearly && (
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ color: "#22c55e", fontWeight: 600, fontSize: 14 }}
                        >
                            Save 20%
                        </motion.span>
                    )}
                </div>

                {/* Cards */}
                <div style={{ display: "flex", gap: 28, justifyContent: "center" }}>
                    {PLANS.map((plan, index) => (
                        <div key={plan.name} style={{ flex: 1, maxWidth: 300 }}>
                            <PricingCard plan={plan} isYearly={isYearly} index={index} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
