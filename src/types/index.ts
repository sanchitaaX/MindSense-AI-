export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    riskScore?: number;
}

export interface RiskScore {
    score: number;
    level: "low" | "moderate" | "high";
    textScore: number;
    faceScore: number;
    voiceScore: number;
    dominantEmotion: string;
}

export interface EmotionData {
    emotions: Record<string, number>;
    dominant_emotion: string;
    distress_score: number;
}

export interface Session {
    id: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    messageCount: number;
    finalRiskScore?: number;
    messages: Message[];
}

export interface EmotionTimelineEntry {
    time: string;
    score: number;
    emotion: string;
}

export interface CopingResource {
    title: string;
    description: string;
    type: "breathing" | "meditation" | "cbt" | "crisis";
    link?: string;
}

export type ChatMode = "empathy" | "cbt" | "mindfulness";
