import type { Request, Response } from "express";

import { Timestamp } from 'firebase-admin/firestore';

export interface Recommendation {
    title: string;
    description: string;
    goals: string[];
    type: "event" | "task";
    eventId?: string;
    startTime?: string;
    endTime?: string;
}

export interface RecommendationsCollection {
    date: string;
    recommendations: Recommendation[];
    generatedAt: Date;
}

export interface DePauwEvent {
    id: string;
    organizationName: string;
    eventTitle: string;
    eventDescription: string;
    location: [{
        name: string;
    }];
    startTime: string;
    endTime: string;
    tags: string[];
}

interface CalendarEventTime {
    startTime: string;
    endTime: string;
}

export interface GetRecommendationsCollectionServiceRequest {
    campusEvents: DePauwEvent[];
    calendarEventsTime: CalendarEventTime[];
    userGoals: string[];
}

export interface GetRecommendationsControllerRequest extends Request {
    params: {
        userId: string;
    }
    body: GetRecommendationsCollectionServiceRequest;
}

export interface GetRecommendationsForUserControllerRequest extends Request {
    params: {
        userId: string;
    },
    query: {
        currentDate: string;
    }
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