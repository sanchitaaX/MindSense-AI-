"use client";

import { useState, useCallback, useRef } from "react";
import type { RiskScore, EmotionData } from "../types";

// ─── Helpers ──────────────────────────────────────────────
function calculateLevel(score: number): "low" | "moderate" | "high" {
    if (score <= 40) return "low";
    if (score <= 70) return "moderate";
    return "high";
}

/** Clamp a value between 0 and 100. */
function clamp(v: number): number {
    return Math.max(0, Math.min(100, v));
}

/**
 * Remap backend distress_score to a scale that makes intuitive sense:
 *  - 0       → 10  (positive / happy — pushes risk DOWN)
 *  - 1..10   → 45  (neutral chit-chat — anchors near midpoint)
 *  - 11..100 → 55 + raw*0.45  (negative — pushes risk UP, into 60-100)
 */
function remapDistress(raw: number): number {
    if (raw === 0) return 10;
    if (raw <= 10) return 45;
    return clamp(55 + raw * 0.45);
}

// ─── Constants ────────────────────────────────────────────
const TEXT_EMA_ALPHA = 0.35;   // Smoothing factor for text stream
const FACE_EMA_ALPHA = 0.40;   // Smoothing factor for face stream
const CRISIS_FLOOR = 75;       // Minimum score when crisis is detected
const MISMATCH_BONUS = 10;     // Added when one signal is high but the other is low

// ─── Hook ─────────────────────────────────────────────────
export function useRiskScore() {
    const [riskScore, setRiskScore] = useState<RiskScore>({
        score: 50,
        level: "moderate",
        mode: "A",
        textScore: 50,
        faceScore: 0,
        voiceScore: 0,
        dominantEmotion: "neutral",
    });

    const [webcamActive, setWebcamActive] = useState(false);
    const [micActive, setMicActive] = useState(false);

    const webcamRef = useRef(false);
    const micRef = useRef(false);

    // ── Webcam toggle ─────────────────────────────────────
    const setWebcamActiveWrapped = useCallback((val: boolean) => {
        webcamRef.current = val;
        setWebcamActive(val);
        if (!val) {
            // When webcam is turned off, revert to text-only score
            setRiskScore((prev) => {
                const score = Math.round(clamp(prev.textScore));
                return { ...prev, faceScore: 0, dominantEmotion: "neutral", score, level: calculateLevel(score) };
            });
        }
    }, []);

    // ── Mic toggle (plumbing for Mode B) ──────────────────
    const setMicActiveWrapped = useCallback((val: boolean) => {
        micRef.current = val;
        setMicActive(val);
    }, []);

    // ══════════════════════════════════════════════════════
    //  MODE A: Text score update  (called after every message)
    // ══════════════════════════════════════════════════════
    const updateTextScore = useCallback(
        (distressScore: number, dominantEmotion: string, crisisDetected?: boolean) => {
            setRiskScore((prev) => {
                const isWebcam = webcamRef.current;

                // 1. Remap the raw backend score
                const mapped = remapDistress(distressScore);

                // 2. EMA: blend with previous text history
                const smoothedText = clamp((prev.textScore * (1 - TEXT_EMA_ALPHA)) + (mapped * TEXT_EMA_ALPHA));

                // 3. Build fused score using Mode A formula
                let fused: number;
                if (isWebcam && prev.faceScore > 0) {
                    // Mode A: Text × 0.65 + Face × 0.35
                    fused = (smoothedText * 0.65) + (prev.faceScore * 0.35);

                    // Mismatch bonus: face is distressed but text seems fine (hidden distress)
                    if (prev.faceScore > 55 && smoothedText < 30) {
                        fused += MISMATCH_BONUS;
                    }
                    // Mismatch bonus: text is distressed but face seems fine
                    if (smoothedText > 55 && prev.faceScore < 30) {
                        fused += MISMATCH_BONUS;
                    }
                } else {
                    // Text-only fallback
                    fused = smoothedText;
                }

                // 4. Crisis override: floor to ≥75 if backend flagged crisis
                if (crisisDetected) {
                    fused = Math.max(fused, CRISIS_FLOOR);
                }

                const score = Math.round(clamp(fused));

                return {
                    ...prev,
                    score,
                    level: calculateLevel(score),
                    mode: "A" as const,
                    textScore: smoothedText,
                    dominantEmotion,
                };
            });
        },
        []
    );

    // ══════════════════════════════════════════════════════
    //  MODE A: Face score update  (called every 2s by webcam)
    // ══════════════════════════════════════════════════════
    const updateFaceScore = useCallback(
        (data: EmotionData) => {
            setRiskScore((prev) => {
                const rawFace = clamp(data.distress_score);

                // If no face detected or error, fall back to text-only
                if (data.dominant_emotion === "no face detected" || data.dominant_emotion === "error") {
                    const score = Math.round(clamp(prev.textScore));
                    return { ...prev, score, level: calculateLevel(score), faceScore: 0, dominantEmotion: data.dominant_emotion || prev.dominantEmotion };
                }

                // EMA smooth the face stream independently
                const smoothedFace = clamp((prev.faceScore * (1 - FACE_EMA_ALPHA)) + (rawFace * FACE_EMA_ALPHA));

                // Mode A fusion: Text × 0.65 + Face × 0.35
                let fused = (prev.textScore * 0.65) + (smoothedFace * 0.35);

                // Mismatch bonus
                if (smoothedFace > 55 && prev.textScore < 30) fused += MISMATCH_BONUS;
                if (prev.textScore > 55 && smoothedFace < 30) fused += MISMATCH_BONUS;

                // Crisis override from face data (if backend flagged it)
                if (data.crisis_detected) {
                    fused = Math.max(fused, CRISIS_FLOOR);
                }

                const score = Math.round(clamp(fused));

                return {
                    ...prev,
                    score,
                    level: calculateLevel(score),
                    mode: "A" as const,
                    faceScore: smoothedFace,
                    dominantEmotion: data.dominant_emotion || prev.dominantEmotion,
                };
            });
        },
        []
    );

    return {
        riskScore,
        webcamActive,
        micActive,
        setWebcamActive: setWebcamActiveWrapped,
        setMicActive: setMicActiveWrapped,
        updateTextScore,
        updateFaceScore,
    };
}
