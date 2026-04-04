import type { Request, Response } from "express";

export interface Recommendation {
    title: string;
    description: string;
    goals: string[];
    type: "event" | "task";
    eventId?: string;
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