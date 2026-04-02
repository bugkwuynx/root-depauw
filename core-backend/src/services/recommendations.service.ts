import type { GetRecommendationsCollectionServiceRequest, RecommendationsCollection } from "../types/recommendations.type.js";
import OpenAI from "openai";

export async function getRecommendations(
    getRecommendationsInput: GetRecommendationsCollectionServiceRequest
): Promise<RecommendationsCollection | null> {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const { campusEvents, calendarEventsTime, userGoals } = getRecommendationsInput;

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

//getRecommendations(exampleInput);