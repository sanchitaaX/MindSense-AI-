import React, { useEffect, useRef, useState } from 'react';

export const DinoGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let gameActive = true;

        let dino = { x: 50, y: 150, width: 20, height: 40, dy: 0, gravity: 0.6, jumpPower: -10 };
        let obstacles: { x: number, y: number, width: number, height: number }[] = [];
        let frameCount = 0;
        let currentScore = 0;

        const resetGame = () => {
            dino = { x: 50, y: 150, width: 20, height: 40, dy: 0, gravity: 0.6, jumpPower: -11 };
            obstacles = [];
            frameCount = 0;
            currentScore = 0;
            setScore(0);
            setGameOver(false);
            gameActive = true;
            loop();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault(); // Prevent scrolling
                if (!gameActive) {
                    resetGame();
                } else if (dino.y >= 150) {
                    dino.dy = dino.jumpPower;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        const drawDino = () => {
            ctx.fillStyle = '#475569';
            ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
        };

        const drawObstacles = () => {
            ctx.fillStyle = '#ef4444';
            obstacles.forEach(obs => {
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            });
        };

        const drawGround = () => {
            ctx.beginPath();
            ctx.moveTo(0, 190);
            ctx.lineTo(800, 190);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        const update = () => {
            // physics
            dino.y += dino.dy;
            if (dino.y < 150) {
                dino.dy += dino.gravity;
            } else {
                dino.y = 150;
                dino.dy = 0;
            }

            // obstacles
            if (frameCount % 90 === 0) {
                obstacles.push({ x: 800, y: 160, width: 20, height: 30 });
            }

            obstacles.forEach(obs => {
                obs.x -= 5 + Math.floor(currentScore / 500); // speed increases
            });

            // collision
            obstacles.forEach(obs => {
                if (
                    dino.x < obs.x + obs.width &&
                    dino.x + dino.width > obs.x &&
                    dino.y < obs.y + obs.height &&
                    dino.y + dino.height > obs.y
                ) {
                    gameActive = false;
                    setGameOver(true);
                }
            });

            // filter
            obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

            // score
            frameCount++;
            currentScore++;
            if (currentScore % 10 === 0) {
                setScore(currentScore);
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGround();
            drawDino();
            drawObstacles();

            ctx.fillStyle = '#000';
            ctx.font = '16px monospace';
            ctx.fillText(`Score: ${currentScore}`, 680, 30);

            if (!gameActive) {
                ctx.fillStyle = '#000';
                ctx.font = '24px fallback, sans-serif';
                ctx.fillText('Game Over! Press Space to Restart', 180, 100);
            }
        };

        const loop = () => {
            if (gameActive) {
                update();
                draw();
                animationFrameId = requestAnimationFrame(loop);
            } else {
                draw(); // Draw game over state
            }
        };

        loop();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ marginBottom: 16, color: '#64748b', fontSize: 14 }}>
                Hit <strong>Space</strong> or <strong>Up Arrow</strong> to jump!
            </p>
            <canvas
                ref={canvasRef}
                width={800}
                height={300}
                style={{
                    border: '2px solid #e2e8f0',
                    borderRadius: 16,
                    background: '#f8fafc',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}
            />
            {gameOver && (
                <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#e91e8c' }}>Final Score: {score}</p>
                </div>
            )}
        </div>
    );
};
