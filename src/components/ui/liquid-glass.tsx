"use client";
import React from "react";

interface GlassEffectProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const GlassEffect: React.FC<GlassEffectProps> = ({
    children,
    className = "",
    style = {},
    onClick,
}) => {
    const glassStyle: React.CSSProperties = {
        boxShadow: "0 6px 6px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.05)",
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        ...style,
    };

    return (
        <div
            onClick={onClick}
            className={`relative flex font-semibold overflow-hidden cursor-pointer transition-all duration-700 ${className}`}
            style={glassStyle}
        >
            <div
                className="absolute inset-0 z-0 overflow-hidden"
                style={{
                    borderRadius: "inherit",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                }}
            />
            <div
                className="absolute inset-0 z-10"
                style={{
                    borderRadius: "inherit",
                    background: "rgba(255, 255, 255, 0.25)",
                }}
            />
            <div
                className="absolute inset-0 z-20 overflow-hidden"
                style={{
                    borderRadius: "inherit",
                    boxShadow:
                        "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3)",
                }}
            />
            <div className="relative z-30">{children}</div>
        </div>
    );
};

export const GlassButton: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}> = ({ children, onClick, className = "" }) => (
    <GlassEffect
        onClick={onClick}
        className={`rounded-2xl px-6 py-3 hover:px-7 hover:py-3.5 ${className}`}
    >
        <div
            className="transition-all duration-700 hover:scale-95"
            style={{
                transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
            }}
        >
            {children}
        </div>
    </GlassEffect>
);

export const GlassFilter: React.FC = () => (
    <svg style={{ display: "none" }}>
        <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
        >
            <feTurbulence
                type="fractalNoise"
                baseFrequency="0.001 0.005"
                numOctaves={1}
                seed={17}
                result="turbulence"
            />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feSpecularLighting
                in="softMap"
                surfaceScale={5}
                specularConstant={1}
                specularExponent={100}
                lightingColor="white"
                result="specLight"
            >
                <fePointLight x={-200} y={-200} z={300} />
            </feSpecularLighting>
            <feComposite
                in="specLight"
                operator="arithmetic"
                k1={0}
                k2={1}
                k3={1}
                k4={0}
                result="litImage"
            />
            <feDisplacementMap
                in="SourceGraphic"
                in2="softMap"
                scale={200}
                xChannelSelector="R"
                yChannelSelector="G"
            />
        </filter>
    </svg>
);
