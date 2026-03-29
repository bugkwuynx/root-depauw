export interface Recommendation {
    title: string;
    description: string;
    goals: string[];
    confidence: number;
}

export interface RecommendationsCollection {
    date: string;
    recommendations: Recommendation[];
    generatedAt: Date;
}