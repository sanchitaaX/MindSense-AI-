import React, { useEffect, useRef, useState, useCallback } from "react";

const CALM_PALETTE = [
    { hex: "#5B9BD5", name: "Sky Blue" },
    { hex: "#4EADAB", name: "Teal" },
    { hex: "#6A8FC8", name: "Periwinkle" },
    { hex: "#7EC8C8", name: "Aqua" },
    { hex: "#8E7CC3", name: "Soft Purple" },
    { hex: "#A8D8D8", name: "Pale Teal" },
    { hex: "#B8C4E8", name: "Lavender" },
    { hex: "#C3D9D9", name: "Mist" },
];

const VIBRANT_PALETTE = [
    ...CALM_PALETTE,
    { hex: "#F4A261", name: "Tangerine" },
    { hex: "#E76F51", name: "Coral" },
    { hex: "#F7C59F", name: "Peach" },
    { hex: "#E9C46A", name: "Saffron" },
    { hex: "#D4A5A5", name: "Dusty Rose" },
    { hex: "#A8C686", name: "Sage" },
    { hex: "#FFD166", name: "Sunshine" },
    { hex: "#EF8DC0", name: "Blossom" },
];

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillHex: string, canvasW: number, canvasH: number) {
    const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
    const data = imgData.data;
    const [fr, fg, fb] = hexToRgb(fillHex);

    const idx = (x: number, y: number) => (y * canvasW + x) * 4;
    const si = idx(startX, startY);
    const tr = data[si], tg = data[si + 1], tb = data[si + 2];

    if (tr < 60 && tg < 60 && tb < 60) return false;
    if (tr === fr && tg === fg && tb === fb) return false;

    const tolerance = 40;
    function match(i: number) {
        return Math.abs(data[i] - tr) <= tolerance &&
            Math.abs(data[i + 1] - tg) <= tolerance &&
            Math.abs(data[i + 2] - tb) <= tolerance;
    }

    const stack = [[startX, startY]];
    const visited = new Uint8Array(canvasW * canvasH);
    visited[startY * canvasW + startX] = 1;

    while (stack.length) {
        const [cx, cy] = stack.pop()!;
        const ci = idx(cx, cy);
        data[ci] = fr; data[ci + 1] = fg; data[ci + 2] = fb; data[ci + 3] = 255;

        const neighbors = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
        for (const [nx, ny] of neighbors) {
            if (nx < 0 || ny < 0 || nx >= canvasW || ny >= canvasH) continue;
            const ni = ny * canvasW + nx;
            if (visited[ni]) continue;
            visited[ni] = 1;
            if (match(ni * 4)) stack.push([nx, ny]);
        }
    }
    ctx.putImageData(imgData, 0, 0);
    return true;
}

function drawPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 2;

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -90, 28, 55, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -58, 18, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -22, 10, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();

    const corners = [[0.18, 0.18], [0.82, 0.18], [0.18, 0.82], [0.82, 0.82]];
    corners.forEach(([fx, fy]) => {
        const ox = fx * w, oy = fy * h;
        ctx.beginPath();
        ctx.arc(ox, oy, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ox, oy, 10, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(a);
            ctx.beginPath();
            ctx.ellipse(0, -28, 6, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    });

    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeRect(16, 16, w - 32, h - 32);
}

function estimateUnfilled(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const data = ctx.getImageData(0, 0, w, h).data;
    let unfilled = 0;
    for (let i = 0; i < data.length; i += 40) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 220 && g > 220 && b > 210) unfilled++;
    }
    return unfilled;
}

export interface ColoringCanvasProps {
    riskScore?: number;
    onShapeFilled?: (data: any) => void;
    width?: number;
    height?: number;
}

export const ColoringCanvas: React.FC<ColoringCanvasProps> = ({
    riskScore = 50,
    onShapeFilled,
    width = 600,
    height = 500,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const baselineRef = useRef(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [filled, setFilled] = useState(0);
    const [clarityTotal, setClarityTotal] = useState(0);
    const [showReset, setShowReset] = useState(false);

    const isHighRisk = riskScore >= 60;
    const palette = isHighRisk ? CALM_PALETTE : VIBRANT_PALETTE;
    const defaultColor = palette[0].hex;

    useEffect(() => {
        if (!palette.find(p => p.hex === selectedColor)) {
            setSelectedColor(palette[0].hex);
        }
    }, [riskScore, palette, selectedColor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        drawPattern(ctx, width, height);
        baselineRef.current = estimateUnfilled(ctx, width, height);
        setSelectedColor(defaultColor);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, height]);

    const handleFill = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        const color = selectedColor || defaultColor;
        const changed = floodFill(ctx, x, y, color, width, height);
        if (!changed) return;

        const newFilled = filled + 1;
        const clarityAwarded = 10;
        const newClarity = clarityTotal + clarityAwarded;
        const remaining = Math.max(0, estimateUnfilled(ctx, width, height));
        const pct = Math.round(100 * (1 - remaining / (baselineRef.current || 1)));

        setFilled(newFilled);
        setClarityTotal(newClarity);
        if (pct > 90) setShowReset(true);

        if (onShapeFilled) {
            onShapeFilled({
                color,
                shapesFilledTotal: newFilled,
                clarityAwarded,
                clarityTotal: newClarity,
                completionPct: pct,
                shapesLeft: remaining,
            });
        }
    }, [selectedColor, defaultColor, filled, clarityTotal, width, height, onShapeFilled]);

    function handleReset() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        drawPattern(ctx, width, height);
        baselineRef.current = estimateUnfilled(ctx, width, height);
        setFilled(0);
        setShowReset(false);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: width }}>
                <div>
                    <span style={{ fontWeight: 700, color: "#2d7a6b", fontSize: "1rem" }}>Mindful Colouring</span>
                    {isHighRisk && (
                        <span style={{ marginLeft: 8, fontSize: "0.72rem", color: "#7cc8b5", background: "#e8f8f3", border: "1.5px solid #b8e4d8", borderRadius: 20, padding: "2px 10px" }}>
                            🌊 Calm palette active
                        </span>
                    )}
                </div>
                <span style={{ fontSize: "0.78rem", color: "#2d7a6b", fontWeight: 600 }}>
                    ✨ {clarityTotal} CP earned
                </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "10px 16px", background: "white", borderRadius: 16, border: "1.5px solid #e0f2ec", width: "100%", maxWidth: width }}>
                {palette.map(({ hex, name }) => (
                    <button
                        key={hex}
                        title={name}
                        onClick={() => setSelectedColor(hex)}
                        style={{
                            width: 32, height: 32,
                            borderRadius: "50%",
                            background: hex,
                            border: selectedColor === hex ? "3px solid #2d7a6b" : "2px solid rgba(0,0,0,0.1)",
                            cursor: "pointer",
                            transform: selectedColor === hex ? "scale(1.22)" : "scale(1)",
                            transition: "transform 0.15s, border 0.15s",
                            boxShadow: selectedColor === hex ? "0 0 0 3px #b8e4d8" : "none",
                        }}
                    />
                ))}
                {!isHighRisk && (
                    <span style={{ fontSize: "0.72rem", color: "#7cc8b5", alignSelf: "center", marginLeft: 4 }}>
                        🎨 Full palette unlocked!
                    </span>
                )}
            </div>

            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(45,122,107,0.12)", cursor: "crosshair" }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{ display: "block", maxWidth: "100%" }}
                    onClick={handleFill}
                />
                {showReset && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(232,248,243,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                        <div style={{ fontSize: "2rem" }}>🌸</div>
                        <p style={{ color: "#2d7a6b", fontWeight: 700, fontSize: "1rem" }}>Beautiful work!</p>
                        <p style={{ color: "#7cc8b5", fontSize: "0.85rem" }}>You earned {clarityTotal} Clarity Points</p>
                        <button onClick={handleReset} className="neo-btn" style={{ background: "#2d7a6b", color: "white", border: "none", borderRadius: 100, padding: "10px 28px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                            New Pattern
                        </button>
                    </div>
                )}
            </div>

            <p style={{ fontSize: "0.73rem", color: "#aac8bf", textAlign: "center" }}>
                Click anywhere inside a shape to fill it with colour · {filled} shapes filled
            </p>
        </div>
    );
};
