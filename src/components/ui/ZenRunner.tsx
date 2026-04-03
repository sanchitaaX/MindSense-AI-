import React, { useEffect, useRef, useState } from "react";

const GROUND_Y_OFFSET = 40;
const W = 750, H = 220;

const T = {
    sky1: "#e2f4ef", sky2: "#f5fbf8",
    ground: "#2d7a6b", groundTop: "#7cc8b5",
    dino: "#2d7a6b", dinoAccent: "#1a5c4f",
    obstacle1: "#e07b6a", obstacle3: "#f5a58a",
    particle: ["#7cc8b5", "#b8e4d8", "#2d7a6b", "#e8f8f3"],
};

export interface ZenRunnerProps {
    onClarityEarned?: (points: number) => void;
}

export const ZenRunner: React.FC<ZenRunnerProps> = ({ onClarityEarned }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<any>(null);
    const animRef = useRef<number>(0);
    const [uiScore, setUiScore] = useState(0);
    const [uiClarity, setUiClarity] = useState(0);
    const [uiState, setUiState] = useState("idle"); // idle | running | dead

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const GROUND_Y = H - GROUND_Y_OFFSET;

        function rr(x: number, y: number, w: number, h: number, r: number, fill: string) {
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fillStyle = fill; ctx.fill();
        }

        function burst(x: number, y: number, count = 8, particles: any[]) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
                const spd = 2 + Math.random() * 3;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd - 1,
                    life: 1, decay: 0.025 + Math.random() * 0.02,
                    size: 3 + Math.random() * 4,
                    color: T.particle[Math.floor(Math.random() * T.particle.length)],
                });
            }
        }

        function makeState() {
            const clouds = Array.from({ length: 4 }, (_, i) => ({
                x: 80 + i * 190, y: 20 + Math.random() * 60,
                w: 60 + Math.random() * 70, h: 22 + Math.random() * 14,
                speed: 0.6 + Math.random() * 0.5,
            }));
            const groundDots = Array.from({ length: 18 }, (_, i) => ({
                x: i * 48, y: GROUND_Y + 6 + Math.random() * 8,
                r: 2 + Math.random() * 3,
            }));
            return {
                status: "idle",
                frame: 0, speed: 5,
                score: 0, clarityPoints: 0, hiScore: 0,
                dino: {
                    x: 80, y: GROUND_Y, w: 34, h: 44,
                    vy: 0, jumps: 0, maxJumps: 2,
                    gravity: 0.55, jumpForce: -13,
                    legPhase: 0,
                },
                obstacles: [] as any[], clouds, groundDots, particles: [] as any[],
                obstacleTimer: 0, obstacleInterval: 95,
            };
        }

        gameRef.current = makeState();

        function jump() {
            const g = gameRef.current;
            if (g.status === "idle") { g.status = "running"; setUiState("running"); return; }
            if (g.status === "dead") {
                const prev = g.clarityPoints;
                gameRef.current = { ...makeState(), status: "running", clarityPoints: prev, hiScore: g.hiScore };
                setUiState("running");
                return;
            }
            const d = g.dino;
            if (d.jumps < d.maxJumps) {
                d.vy = d.jumpForce - d.jumps * 1.5;
                d.jumps++;
                burst(d.x + d.w / 2, d.y - d.h / 2, 6, g.particles);
            }
        }

        function handleKey(e: KeyboardEvent) {
            if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
        }
        function handleTap(e: PointerEvent) { e.preventDefault(); jump(); }

        document.addEventListener("keydown", handleKey);
        if (canvas) canvas.addEventListener("pointerdown", handleTap);

        function spawnCloud(g: any) {
            g.clouds.push({
                x: W + 60, y: 20 + Math.random() * 60,
                w: 60 + Math.random() * 70, h: 22 + Math.random() * 14,
                speed: 0.6 + Math.random() * 0.5,
            });
        }

        function spawnObstacle(g: any) {
            const type = Math.floor(Math.random() * 3);
            const cfgs = [{ w: 20, h: 50 }, { w: 28, h: 40 }, { w: 36, h: 35 }];
            const c = cfgs[type];
            g.obstacles.push({ x: W + 10, y: GROUND_Y - c.h, w: c.w, h: c.h, type, passed: false });
            if (type === 2) {
                g.obstacles.push({ x: W + 52, y: GROUND_Y - c.h + 8, w: c.w - 8, h: c.h - 8, type, passed: false });
            }
        }

        function aabb(d: any, o: any) {
            return d.x + 8 < o.x + o.w - 4 &&
                d.x + d.w - 8 > o.x + 4 &&
                d.y - d.h + 4 < o.y + o.h &&
                d.y > o.y + 4;
        }

        function update() {
            const g = gameRef.current;
            g.frame++;
            g.dino.legPhase++;

            if (g.status === "running") {
                g.speed = 5 + Math.min(g.frame * 0.003, 8);
                const newScore = Math.floor(g.frame / 6);
                if (newScore !== g.score) {
                    g.score = newScore;
                    if (g.score > g.hiScore) g.hiScore = g.score;
                    setUiScore(g.score);
                }
            }

            const d = g.dino;
            d.vy += d.gravity;
            d.y += d.vy;
            if (d.y >= GROUND_Y) { d.y = GROUND_Y; d.vy = 0; d.jumps = 0; }

            if (g.frame % 90 === 0) spawnCloud(g);
            g.clouds.forEach((c: any) => c.x -= c.speed);
            for (let i = g.clouds.length - 1; i >= 0; i--) {
                if (g.clouds[i].x < -120) g.clouds.splice(i, 1);
            }

            g.groundDots.forEach((dot: any) => {
                dot.x -= g.speed * 0.4;
                if (dot.x < -10) dot.x = W + 10;
            });

            if (g.status !== "running") return;

            g.obstacleTimer++;
            if (g.obstacleTimer >= g.obstacleInterval) {
                spawnObstacle(g);
                g.obstacleTimer = 0;
                g.obstacleInterval = Math.max(55, 95 - g.frame * 0.04);
            }

            for (let i = g.obstacles.length - 1; i >= 0; i--) {
                const o = g.obstacles[i];
                o.x -= g.speed;

                if (!o.passed && o.x + o.w < d.x) {
                    o.passed = true;
                    g.clarityPoints += 5;
                    setUiClarity(g.clarityPoints);
                    if (onClarityEarned) onClarityEarned(5);
                    burst(d.x + 20, d.y - d.h / 2, 10, g.particles);
                }

                if (aabb(d, o)) {
                    g.status = "dead";
                    setUiState("dead");
                    burst(d.x + d.w / 2, d.y - d.h / 2, 18, g.particles);
                }
                if (o.x < -60) g.obstacles.splice(i, 1);
            }

            for (let i = g.particles.length - 1; i >= 0; i--) {
                const p = g.particles[i];
                p.x += p.vx; p.y += p.vy; p.vy += 0.1;
                p.life -= p.decay;
                if (p.life <= 0) g.particles.splice(i, 1);
            }
        }

        function render() {
            if (!ctx) return;
            const g = gameRef.current;
            ctx.clearRect(0, 0, W, H);

            const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
            grad.addColorStop(0, T.sky1); grad.addColorStop(1, T.sky2);
            ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

            g.clouds.forEach((c: any) => {
                ctx.fillStyle = "rgba(255,255,255,0.85)";
                ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.22, c.y + 4, c.w * 0.28, c.h * 0.45, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.22, c.y + 5, c.w * 0.25, c.h * 0.4, 0, 0, Math.PI * 2); ctx.fill();
            });

            ctx.fillStyle = T.groundTop; ctx.fillRect(0, GROUND_Y, W, 4);
            ctx.fillStyle = T.ground; ctx.fillRect(0, GROUND_Y + 4, W, H - GROUND_Y);
            g.groundDots.forEach((dot: any) => {
                ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fill();
            });

            g.obstacles.forEach((o: any) => {
                rr(o.x + o.w * 0.3, o.y, o.w * 0.4, o.h, 4, T.obstacle1);
                if (o.type === 0) {
                    rr(o.x, o.y + o.h * 0.3, o.w * 0.3, o.h * 0.22, 3, T.obstacle1);
                    rr(o.x, o.y + o.h * 0.08, o.w * 0.12, o.h * 0.25, 3, T.obstacle1);
                } else if (o.type === 1) {
                    rr(o.x + o.w * 0.68, o.y + o.h * 0.25, o.w * 0.32, o.h * 0.2, 3, T.obstacle1);
                } else {
                    rr(o.x, o.y + o.h * 0.35, o.w * 0.32, o.h * 0.18, 3, T.obstacle1);
                    rr(o.x + o.w * 0.7, o.y + o.h * 0.28, o.w * 0.3, o.h * 0.18, 3, T.obstacle1);
                }
                ctx.fillStyle = T.obstacle3;
                ctx.fillRect(o.x + o.w * 0.35, o.y + 6, 3, o.h * 0.4);
            });

            const d = g.dino;
            const bounce = g.status === "running" && d.jumps === 0 ? Math.sin(d.legPhase * 0.18) * 1.5 : 0;
            const dy = d.y + bounce;
            ctx.beginPath(); ctx.ellipse(d.x + d.w / 2, GROUND_Y + 2, 14, 4, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fill();
            rr(d.x, dy - d.h + 6, d.w, d.h - 6, 8, T.dino);
            rr(d.x + 8, dy - d.h - 10, d.w - 4, 20, 6, T.dino);
            ctx.beginPath(); ctx.arc(d.x + d.w - 2, dy - d.h - 4, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = "#fff"; ctx.fill();
            ctx.beginPath(); ctx.arc(d.x + d.w - 1, dy - d.h - 4, 2, 0, Math.PI * 2);
            ctx.fillStyle = T.dinoAccent; ctx.fill();
            ctx.beginPath(); ctx.ellipse(d.x + 2, dy - d.h - 2, 6, 10, -0.4, 0, Math.PI * 2);
            ctx.fillStyle = "#7cc8b5"; ctx.fill();

            if (g.status === "running" && d.jumps === 0) {
                const leg1 = Math.sin(d.legPhase * 0.18) > 0;
                ctx.fillStyle = T.dinoAccent;
                ctx.fillRect(d.x + 6, dy - 8, 7, leg1 ? 14 : 8);
                ctx.fillRect(d.x + 6, dy - 8 + (leg1 ? 14 : 8) - 2, leg1 ? 9 : 7, 4);
                ctx.fillRect(d.x + 18, dy - 8, 7, leg1 ? 8 : 14);
                ctx.fillRect(d.x + 18, dy - 8 + (leg1 ? 8 : 14) - 2, leg1 ? 7 : 9, 4);
            } else {
                ctx.fillStyle = T.dinoAccent;
                ctx.fillRect(d.x + 6, dy - 8, 7, 12);
                ctx.fillRect(d.x + 18, dy - 8, 7, 12);
            }

            g.particles.forEach((p: any) => {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.globalAlpha = p.life * 0.8;
                ctx.fillStyle = p.color; ctx.fill();
                ctx.globalAlpha = 1;
            });

            if (g.status === "idle") {
                ctx.fillStyle = T.ground; ctx.font = "bold 15px DM Sans";
                ctx.textAlign = "center";
                ctx.fillText("Press SPACE or tap to start", W / 2, GROUND_Y / 2 + 6);
                ctx.font = "500 12px DM Sans"; ctx.fillStyle = "#7cc8b5";
                ctx.fillText("Earn Clarity Points by running!", W / 2, GROUND_Y / 2 + 26);
                ctx.textAlign = "left";
            }
            if (g.status === "dead") {
                ctx.fillStyle = "rgba(232,248,243,0.82)"; ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = T.ground; ctx.font = "bold 22px DM Sans"; ctx.textAlign = "center";
                ctx.fillText("Take a breath... 🌿", W / 2, GROUND_Y / 2 - 8);
                ctx.font = "600 13px DM Sans";
                ctx.fillText(`Score: ${g.score}   •   Best: ${g.hiScore}`, W / 2, GROUND_Y / 2 + 16);
                ctx.font = "500 12px DM Sans"; ctx.fillStyle = "#7cc8b5";
                ctx.fillText("Press SPACE or tap to try again", W / 2, GROUND_Y / 2 + 38);
                ctx.textAlign = "left";
            }
        }

        function loop() {
            update(); render();
            animRef.current = requestAnimationFrame(loop);
        }

        animRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animRef.current);
            document.removeEventListener("keydown", handleKey);
            if (canvas) canvas.removeEventListener("pointerdown", handleTap);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, width: "100%", maxWidth: 780, margin: "0 auto", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", paddingBottom: 10 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#2d7a6b" }}>
                    Zen <span style={{ color: "#7cc8b5" }}>Runner</span> 🌿
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ background: "white", border: "2px solid #b8e4d8", borderRadius: 100, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, color: "#2d7a6b" }}>
                        <span style={{ color: "#7cc8b5", fontSize: "0.7rem" }}>SCORE </span>{uiScore}
                    </span>
                    <span style={{ background: "linear-gradient(135deg, #e8f8f3, #d4f0e6)", border: "2px solid #7cc8b5", borderRadius: 100, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, color: "#2d7a6b" }}>
                        ✨ {uiClarity} CP
                    </span>
                </div>
            </div>

            <div style={{ width: "100%", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px rgba(45,122,107,0.12)" }}>
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    style={{ display: "block", width: "100%", cursor: "pointer", touchAction: "none" }}
                />
            </div>

            <div style={{ display: "flex", gap: 10, padding: "8px 20px", background: "white", borderRadius: 100, marginTop: 10, border: "1.5px solid #e0f2ec", fontSize: "0.74rem", color: "#5a9e8e", fontWeight: 500, flexWrap: "wrap", justifyContent: "center" }}>
                <kbd style={{ background: "#f0f7f4", border: "1.5px solid #b8e4d8", borderRadius: 6, padding: "2px 8px", fontWeight: 700, color: "#2d7a6b" }}>SPACE</kbd>
                or
                <kbd style={{ background: "#f0f7f4", border: "1.5px solid #b8e4d8", borderRadius: 6, padding: "2px 8px", fontWeight: 700, color: "#2d7a6b" }}>↑</kbd>
                to jump · Double jump available!
            </div>

            {uiState === "dead" && (
                <p style={{ marginTop: 8, fontSize: "0.75rem", color: "#7cc8b5", fontWeight: 500, textAlign: "center" }}>
                    Running correlates with lower stress scores in your next check-in 🌱
                </p>
            )}
        </div>
    );
};
