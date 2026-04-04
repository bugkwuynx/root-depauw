import { Timestamp } from 'firebase-admin/firestore';

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

export interface RecommendationsCollectionDocument extends Omit<RecommendationsCollection, 'generatedAt'> {
    generatedAt: Timestamp;
}

export function toFirestore(rec: RecommendationsCollection): RecommendationsCollectionDocument {
    return {
        ...rec,
        generatedAt: Timestamp.fromDate(rec.generatedAt),
    };
}

export function fromFirestore(doc: RecommendationsCollectionDocument): RecommendationsCollection {
    return {
        ...doc,
        generatedAt: doc.generatedAt.toDate(),
    };
}