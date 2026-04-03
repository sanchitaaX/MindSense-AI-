import React, { useState, useEffect, useRef } from "react";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

interface VoiceInputProps {
    onMessage?: (text: string) => void;
    botReply?: string | null;
    autoSpeak?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onMessage, botReply }) => {
    const [transcript, setTranscript] = useState("");
    const { speak, stop, isSpeaking, isLoading: ttsLoading } = useTextToSpeech();
    const lastSpokenRef = useRef<string | null>(null);
    const voiceUsedRef = useRef(false);

    const { isRecording, isProcessing, toggleRecording } = useSpeechToText({
        onTranscript: (text: string) => {
            setTranscript(text);
            voiceUsedRef.current = true; // user is using voice mode
            if (onMessage) onMessage(text);
        },
        onError: (e: any) => console.error("STT error:", e),
    });

    // Auto-speak the new bot reply when user is in voice mode
    useEffect(() => {
        if (
            botReply &&
            voiceUsedRef.current &&
            botReply !== lastSpokenRef.current
        ) {
            lastSpokenRef.current = botReply;
            // Small delay for natural feel
            const timer = setTimeout(() => speak(botReply, { speed: 0.95 }), 400);
            return () => clearTimeout(timer);
        }
    }, [botReply, speak]);

    const btnColor = isRecording ? "#e07b6a" : "#2d7a6b";

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: btnColor,
                        border: "none",
                        cursor: "pointer",
                        color: "white",
                        fontSize: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isRecording ? "0 0 0 8px rgba(224,123,106,0.25)" : "0 4px 16px rgba(45,122,107,0.25)",
                        transition: "all 0.2s",
                    }}
                >
                    {isRecording ? "⏹" : isProcessing ? "⏳" : "🎤"}
                </button>

                {botReply && (
                    <button
                        onClick={() => isSpeaking ? stop() : speak(botReply)}
                        disabled={ttsLoading && !isSpeaking}
                        style={{
                            background: isSpeaking ? "#f0f7f4" : "white",
                            border: "1.5px solid #b8e4d8",
                            borderRadius: 100,
                            padding: "8px 16px",
                            fontSize: "0.85rem",
                            color: "#2d7a6b",
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        {isSpeaking ? "⏹ Stop Speaking" : ttsLoading ? "⏳ Loading Voice..." : "🔈 Read Aloud"}
                    </button>
                )}
            </div>

            {isRecording && (
                <div style={{ fontSize: "0.75rem", color: "#e07b6a", fontWeight: 600, animation: "pulse 1.5s infinite" }}>
                    🔴 Listening...
                </div>
            )}

            {transcript && !isRecording && (
                <div style={{
                    background: "#f0f7f4",
                    border: "1.5px solid #b8e4d8",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontSize: "0.82rem",
                    color: "#2d7a6b",
                    maxWidth: "100%",
                    textAlign: "center",
                }}>
                    "{transcript}"
                </div>
            )}
        </div>
    );
};
