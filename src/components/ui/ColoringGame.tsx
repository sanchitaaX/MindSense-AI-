import React, { useEffect, useRef, useState } from 'react';

interface ColoringGameProps {
    riskScore?: number;
    onShapeFilled?: () => void;
}

export const ColoringGame: React.FC<ColoringGameProps> = ({ riskScore = 50, onShapeFilled }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentColor, setCurrentColor] = useState<string>('#ffffff');

    const isHighRisk = riskScore >= 66;

    const coolTones = ['#0d9488', '#0284c7', '#4f46e5', '#7e22ce', '#38bdf8', '#818cf8'];
    const vibrantTones = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#d946ef', '#ec4899'];
    const palette = isHighRisk ? coolTones : vibrantTones;

    // We will initialize currentColor safely when palette changes
    useEffect(() => {
        if (!palette.includes(currentColor)) {
            setCurrentColor(palette[0]);
        }
    }, [palette, currentColor]);

    // Better approach: Persist the paths across re-renders
    const pathsRef = useRef<{ path: Path2D, color: string }[] | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!pathsRef.current) {
            const paths: { path: Path2D, color: string }[] = [];
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            const bgPath = new Path2D();
            bgPath.arc(centerX, centerY, 180, 0, Math.PI * 2);
            paths.push({ path: bgPath, color: '#f8fafc' });

            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const px = centerX + Math.cos(angle) * 70;
                const py = centerY + Math.sin(angle) * 70;

                const p = new Path2D();
                p.arc(px, py, 70, 0, Math.PI * 2);
                paths.push({ path: p, color: '#f1f5f9' });
            }

            const centerPath = new Path2D();
            centerPath.arc(centerX, centerY, 50, 0, Math.PI * 2);
            paths.push({ path: centerPath, color: '#e2e8f0' });

            pathsRef.current = paths;
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!pathsRef.current) return;
            for (const item of pathsRef.current) {
                ctx.fillStyle = item.color;
                ctx.fill(item.path);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.stroke(item.path);
            }
        };

        draw();

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            if (!pathsRef.current) return;
            for (let i = pathsRef.current.length - 1; i >= 0; i--) {
                if (ctx.isPointInPath(pathsRef.current[i].path, x, y)) {
                    if (pathsRef.current[i].color !== currentColor) {
                        pathsRef.current[i].color = currentColor;
                        draw();
                        if (onShapeFilled) {
                            onShapeFilled();
                        }
                    }
                    break;
                }
            }
        };

        canvas.addEventListener('click', handleClick);
        return () => canvas.removeEventListener('click', handleClick);
    }, [currentColor, onShapeFilled]); // Re-bind click when color changes

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Color Palette */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {palette.map((color) => (
                    <button
                        key={color}
                        onClick={() => setCurrentColor(color)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: currentColor === color ? '3px solid #000' : '2px solid transparent',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                            transform: currentColor === color ? 'scale(1.1)' : 'scale(1)'
                        }}
                    />
                ))}
            </div>

            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 24,
                    background: '#ffffff',
                    cursor: 'crosshair',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
                }}
            />
            {isHighRisk && (
                <p style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>
                    *Palette is locked to calming cool tones based on your current state.
                </p>
            )}
        </div>
    );
};
