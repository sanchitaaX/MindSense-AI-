import { useState, useRef, useCallback } from "react";

// Use the browser's built-in speechSynthesis API — zero backend dependency
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback((text: string, { speed = 1.0, onEnd }: { speed?: number; onEnd?: () => void } = {}) => {
        if (!text || !window.speechSynthesis) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        setIsLoading(true);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed;
        utterance.pitch = 1.0;

        // Try to pick a warm female voice (varies by browser/OS)
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("karen") ||
            v.name.toLowerCase().includes("moira") ||
            v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("google us english")
        );
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => {
            setIsLoading(false);
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            setIsLoading(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    return { speak, stop, isSpeaking, isLoading };
}
