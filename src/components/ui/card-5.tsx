import * as React from "react";
import { motion, type Variants } from "framer-motion";
import clsx from "clsx";

// Pre-defined color themes for the card
const colorThemes = {
    default: {
        from: "330 83% 52%", // Pink (#e91e8c approx)
        to: "291 64% 42%",   // Purple (#9c27b0 approx)
        foreground: "0 0% 100%",
    },
    blue: {
        from: "217 91% 60%",
        to: "221 83% 53%",
        foreground: "0 0% 100%",
    },
    violet: {
        from: "262 83% 58%",
        to: "262 70% 50%",
        foreground: "0 0% 100%",
    },
    orange: {
        from: "24 94% 52%",
        to: "35 92% 60%",
        foreground: "0 0% 100%",
    },
};

export interface HighlightCardProps {
    title: string;
    description: string;
    metricValue: string;
    metricLabel: string;
    buttonText: string;
    onButtonClick: () => void;
    icon: React.ReactNode;
    color?: keyof typeof colorThemes; // 'default' | 'blue' | 'violet' | 'orange'
    className?: string;
}

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut",
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" },
    },
};

export const HighlightCard = React.forwardRef<HTMLDivElement, HighlightCardProps>(
    (
        {
            title,
            description,
            metricValue,
            metricLabel,
            buttonText,
            onButtonClick,
            icon,
            color = "default",
            className,
        },
        ref
    ) => {
        // Get the selected color theme
        const theme = colorThemes[color] || colorThemes.default;

        return (
            <motion.div
                ref={ref}
                className={clsx(
                    "relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-lg border-4 border-slate-900",
                    className
                )}
                style={{
                    // Dynamically set CSS variables for color
                    "--card-from-color": `hsl(${theme.from})`,
                    "--card-to-color": `hsl(${theme.to})`,
                    "--card-foreground-color": `hsl(${theme.foreground})`,
                    // Apply colors and dot pattern
                    color: "var(--card-foreground-color)",
                    backgroundImage: `
            radial-gradient(circle at 1px 1px, hsla(0,0%,100%,0.15) 1px, transparent 0),
            linear-gradient(to bottom right, var(--card-from-color), var(--card-to-color))
          `,
                    backgroundSize: "0.5rem 0.5rem, 100% 100%",
                } as React.CSSProperties}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Bookmark shape */}
                <div className="absolute top-0 right-6 h-16 w-12 bg-white/95 backdrop-blur-sm [clip-path:polygon(0%_0%,_100%_0%,_100%_100%,_50%_75%,_0%_100%)] dark:bg-zinc-800/80">
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ color: "var(--card-from-color)" }}
                    >
                        {icon}
                    </div>
                </div>

                <div className="flex h-full flex-col justify-between">
                    {/* Top section */}
                    <div>
                        <motion.h3 variants={itemVariants} className="text-2xl font-bold tracking-tight">
                            {title}
                        </motion.h3>
                        <motion.p variants={itemVariants} className="mt-1 text-sm opacity-90 max-w-[80%] font-semibold">
                            {description}
                        </motion.p>
                    </div>

                    {/* Divider */}
                    <motion.div variants={itemVariants} className="my-4 h-px w-full bg-white/20" />

                    {/* Bottom section */}
                    <div className="flex items-end justify-between">
                        <motion.div variants={itemVariants}>
                            <p className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono)" }}>{metricValue}</p>
                            <p className="text-sm opacity-90 font-medium uppercase tracking-widest">{metricLabel}</p>
                        </motion.div>
                        <motion.button
                            variants={itemVariants}
                            onClick={onButtonClick}
                            className="rounded-full bg-white/30 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/40 border-2 border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                            aria-label={buttonText}
                        >
                            {buttonText}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        );
    }
);

HighlightCard.displayName = "HighlightCard";
