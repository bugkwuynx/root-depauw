import { db } from "../database/configFirestore.js";
import { fromFirestore, type GetRecommendationsCollectionServiceRequest, type RecommendationsCollection, type RecommendationsCollectionDocument, type DePauwEvent } from "../types/recommendations.type.js";
import { crawlEvents } from "../crawler/eventCrawler.js";
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
                    "startTime?": "string (only if type is event, ISO format)",
                    "endTime?": "string (only if type is event, ISO format)"
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
 * Full self-contained generation: crawl events + fetch user goals + call AI + store.
 * Called by the /generate endpoint so the frontend never needs to supply raw data.
 */
export async function generateRecommendationsForUser(userId: string): Promise<RecommendationsCollection | null> {
    // 1. Fetch user goals from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        console.error(`User ${userId} not found`);
        return null;
    }
    const userData = userDoc.data();
    const userGoals: string[] = userData?.goals ?? [];

    // 2. Crawl today's campus events
    let campusEvents: DePauwEvent[] = [];
    try {
        const crawledEvents = await crawlEvents();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        campusEvents = crawledEvents
            .filter((e) => {
                const s = new Date(e.startTime);
                return s >= todayStart && s <= todayEnd;
            })
            .map((e) => ({
                id: e.id,
                organizationName: e.organization,
                eventTitle: e.title,
                eventDescription: e.description,
                location: [{ name: e.location.name }],
                startTime: e.startTime.toISOString(),
                endTime: e.endTime.toISOString(),
                tags: e.tags,
            }));
    } catch (err) {
        console.error('Event crawl failed, continuing with empty events:', err);
    }

    // 3. Generate via AI
    const result = await getRecommendations({
        campusEvents,
        calendarEventsTime: [], // TODO: wire Google Calendar
        userGoals,
    });

    if (!result) return null;

    // 4. Store in Firestore
    await db.collection(`users/${userId}/recommendations`).doc(result.date).set({ ...result });

    return result;
}

export async function getRecommendationsForUser(userId: string, currentDate: string): Promise<RecommendationsCollection | null> {
    console.log("Fetching recommendations for user:", userId, "on date:", currentDate);
    
    const getRecommendations = await db.collection(`users/${userId}/recommendations`).doc(currentDate).get();

    if (!getRecommendations.exists) {
        console.error("No recommendations found for date:", currentDate);
        return null;
    }

    const data = fromFirestore(getRecommendations.data() as RecommendationsCollectionDocument);

    return data;
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