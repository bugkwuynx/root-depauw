import type { GetRecommendationsCollectionServiceRequest, RecommendationsCollection } from "../types/recommendations.type.js";
import OpenAI from "openai";

export async function getRecommendations(
    getRecommendationsInput: GetRecommendationsCollectionServiceRequest
): Promise<RecommendationsCollection | null> {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const { campusEvents, calendarEventsTime, userGoals } = getRecommendationsInput;

    if (!campusEvents || !calendarEventsTime || !userGoals) {
        console.error("Missing required input fields");
        return null;
    }

    const prompt = `
        You are a student scheduling assistant at DePauw University.

        ## Input
        ${JSON.stringify(getRecommendationsInput, null, 2)}

        ## Task
        Given the input's campusEvents, calendarEventsTime, and userGoals:
        - Find free time gaps between calendarEventsTime blocks
        - Recommend at most 2 events that fit those gaps and match userGoals
        - Recommend at least 3 daily tasks that fit the user's goals
        - Prioritize campusEvents over tasks when schedule and goals align
        - Try supporting students' well-being

        ## Rules
        - Never overlap with calendarEventsTime blocks
        - goals[] must only contain values from input userGoals
        - Tasks must be specific and actionable
        - Sort by confidence descending

        ## Output
        Respond ONLY with this JSON. No markdown, no explanation.

        {
            "recommendations": [
                {
                    "title": "string",
                    "description": "string (short description what it is + why it fits)",
                    "goals": ["matched userGoal"],
                    "type": "event" | "task",
                    "eventId?": "string (only if type is event)",
                }
            ],
        }
    `;

    const response = await client.responses.create({
        model: "gpt-5.4-nano-2026-03-17",
        input: prompt,
    });

    const modelOutput = JSON.parse(response.output_text);

    // console.log(modelOutput);

    const recommendationsCollection: RecommendationsCollection = {
        date: new Date().toISOString().split("T")[0] as string,
        recommendations: modelOutput.recommendations,
        generatedAt: new Date(),
    };     

    return recommendationsCollection;
}

/**
 * Sample input:
 * 
{  
    "campusEvents": [
        {
        "id": "evt001",
        "organizationName": "DePauw Career Center",
        "eventTitle": "Resume Workshop",
        "eventDescription": "Learn how to craft a compelling resume for internship applications.",
        "location": [{ "name": "Hoover Hall 101" }],
        "startTime": "2026-04-04T14:00:00",
        "endTime": "2026-04-04T15:00:00",
        "tags": ["career", "professional development"]
        },
        {
        "id": "evt002",
        "organizationName": "DePauw Wellness",
        "eventTitle": "Mindfulness Meditation Session",
        "eventDescription": "A guided 30-minute meditation session to reduce stress.",
        "location": [{ "name": "Lilly Center Room 5" }],
        "startTime": "2026-04-04T17:00:00",
        "endTime": "2026-04-04T17:30:00",
        "tags": ["wellness", "mental health"]
        }
    ],
    "calendarEventsTime": [
        { "startTime": "2026-04-04T08:00:00", "endTime": "2026-04-04T09:15:00" },
        { "startTime": "2026-04-04T10:30:00", "endTime": "2026-04-04T11:45:00" },
        { "startTime": "2026-04-04T13:00:00", "endTime": "2026-04-04T13:50:00" }
    ],
    "userGoals": ["career growth", "mental wellness", "academic success"]
}
 */