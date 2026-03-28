export interface Recommendation {
    title: string;
    description: string;
    types: string[];
    confidence: number;
}

export interface RecommendationsCollection {
    date: string;
    recommendations: Recommendation[];
    generatedAt: Date;
}