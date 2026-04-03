import { useState, useRef, useCallback } from "react";

interface UseSpeechToTextProps {
    onTranscript?: (text: string) => void;
    onError?: (err: any) => void;
}

// Use the browser's built-in SpeechRecognition API — zero backend dependency
const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSpeechToText({ onTranscript, onError }: UseSpeechToTextProps = {}) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const startRecording = useCallback(() => {
        if (!SpeechRecognition) {
            if (onError) onError(new Error("SpeechRecognition API not supported in this browser."));
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.continuous = false;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript as string;
                setIsProcessing(false);
                setIsRecording(false);
                if (onTranscript) onTranscript(transcript.trim());
            };

            recognition.onerror = (event: any) => {
                setIsProcessing(false);
                setIsRecording(false);
                if (onError) onError(event.error);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognition.start();
            recognitionRef.current = recognition;
            setIsRecording(true);
        } catch (err) {
            if (onError) onError(err);
        }
    }, [onTranscript, onError]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setIsProcessing(true); // brief processing state while final result comes
        }
    }, []);

    const toggleRecording = useCallback(() => {
        isRecording ? stopRecording() : startRecording();
    }, [isRecording, startRecording, stopRecording]);

    return { isRecording, isProcessing, startRecording, stopRecording, toggleRecording };
}
