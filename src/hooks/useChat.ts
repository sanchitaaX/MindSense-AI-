"use client";

import { useState, useCallback, useRef } from "react";
import type { Message } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string, currentRiskScore?: number) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setIsLoading(true);
        setError(null);

        // Abort any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const apiMessages = [...messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMessages,
                    risk_score: currentRiskScore ?? 50.0
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                fullText += parsed.text;
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const lastIdx = updated.length - 1;
                                    updated[lastIdx] = { ...updated[lastIdx], content: fullText };
                                    return updated;
                                });
                            }
                            if (parsed.error) {
                                setError(parsed.error);
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
            const errorMessage = err instanceof Error ? err.message : "Failed to send message";
            setError(errorMessage);
            // Remove the empty assistant message on error
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return { messages, isLoading, error, sendMessage, clearMessages };
}
