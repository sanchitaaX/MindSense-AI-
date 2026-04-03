"use client";

import { useState, useCallback, useRef } from "react";
import type { RiskScore, EmotionData } from "../types";

function calculateLevel(score: number): "low" | "moderate" | "high" {
    if (score <= 40) return "low";
    if (score <= 70) return "moderate";
    return "high";
}

export function useRiskScore() {
    const [riskScore, setRiskScore] = useState<RiskScore>({
        score: 50, // CRITICAL: Start at 50
        level: "moderate",
        textScore: 50,
        faceScore: 0,
        voiceScore: 0,
        dominantEmotion: "neutral",
    });

    const [webcamActive, setWebcamActive] = useState(false);
    const [micActive, setMicActive] = useState(false);

    const webcamRef = useRef(false);
    const micRef = useRef(false);

    const setWebcamActiveWrapped = useCallback((val: boolean) => {
        webcamRef.current = val;
        setWebcamActive(val);
        if (!val) {
            setRiskScore((prev) => {
                const score = Math.round(Math.max(0, Math.min(100, prev.textScore)));
                return {
                    ...prev,
                    faceScore: 0,
                    dominantEmotion: "neutral",
                    score,
                    level: calculateLevel(score),
                };
            });
        }
    }, []);

    const setMicActiveWrapped = useCallback((val: boolean) => {
        micRef.current = val;
        setMicActive(val);
    }, []);

    const updateTextScore = useCallback(
        (distressScore: number, dominantEmotion: string) => {
            setRiskScore((prev) => {
                const isWebcam = webcamRef.current;

                let incomingScore = Math.min(100, distressScore);

                // Scale remapping: backend sends ~20 for "sad", ~80 for "suicide", 0 for "happy"
                // We want: 0 -> decay fast (drops to 10), 10 -> anchor to 50, 20+ -> scales 60 to 100.
                if (incomingScore === 0) {
                    incomingScore = 15; // Drives it low
                } else if (incomingScore <= 10) {
                    incomingScore = 50; // Neutral keeps it steady around 50
                } else {
                    // Normalize [11...100] to push into [60...100] scale
                    incomingScore = 55 + (incomingScore * 0.45);
                }

                // Exponential Moving Average: 35% weight to new mapped message distress, 65% retention of history
                const alpha = 0.35;
                let newTextScore = (prev.textScore * (1 - alpha)) + (incomingScore * alpha);

                const effectiveTextScore = Math.max(0, Math.min(100, newTextScore));
                const activeFaceScore = isWebcam ? prev.faceScore : 0;

                // Peak-severity fusion
                const maxDetected = Math.max(effectiveTextScore, activeFaceScore);
                let fused = maxDetected;
                if (effectiveTextScore > 40 && activeFaceScore > 40) fused += 8;

                const score = Math.round(Math.max(0, Math.min(100, fused)));

                return {
                    ...prev,
                    score,
                    level: calculateLevel(score),
                    textScore: effectiveTextScore,
                    dominantEmotion,
                };
            });
        },
        []
    );

    const updateFaceScore = useCallback(
        (data: EmotionData) => {
            setRiskScore((prev) => {
                const faceScore = Math.min(100, data.distress_score);
                let fused: number;

                if (data.dominant_emotion === "no face detected" || data.dominant_emotion === "error") {
                    fused = prev.textScore;
                } else {
                    // EMA for face score specifically to prevent wild swings from momentary expressions
                    const faceAlpha = 0.4;
                    const smoothedFace = (prev.faceScore * (1 - faceAlpha)) + (faceScore * faceAlpha);

                    // Blend: text 60%, smoothedFace 40%
                    fused = (prev.textScore * 0.60) + (smoothedFace * 0.40);
                }

                const score = Math.round(Math.max(0, Math.min(100, fused)));

                return {
                    ...prev,
                    score,
                    level: calculateLevel(score),
                    faceScore: data.dominant_emotion === "no face detected" ? 0 : faceScore,
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
