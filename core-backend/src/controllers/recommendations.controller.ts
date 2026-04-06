import { getRecommendations, getRecommendationsForUser, generateRecommendationsForUser } from "../services/recommendations.service.js";
import type {
    GetRecommendationsCollectionServiceRequest,
    GetRecommendationsControllerRequest,
    GetRecommendationsForUserControllerRequest,
    RecommendationsCollection
} from "../types/recommendations.type.js";
import type { Response } from "express";
import { db } from "../database/configFirestore.js";

export const getRecommendationsController = async (
    req: GetRecommendationsControllerRequest,
    res: Response<RecommendationsCollection | { error: string }>
) => {
    try {
        const userId = req.params.userId;
        const getRecommendationsInput = req.body;

        const getRecommendationsResult = await getRecommendations(getRecommendationsInput);

        if (!getRecommendationsResult) {
            res.status(404).json({ error: "No recommendations found" });
            return;
        }

        const storeRecommendationResult = await db.collection(`users/${userId}/recommendations`)
            .doc(getRecommendationsResult.date).set({...getRecommendationsResult,});

        if (!storeRecommendationResult) {
            res.status(500).json({ error: "Failed to store recommendations" });
            return;
        }

        res.json(getRecommendationsResult);
    } catch (error) {
        console.error("Error in getRecommendationsController:", error);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
}

export const generateRecommendationsForUserController = async (
    req: GetRecommendationsForUserControllerRequest,
    res: Response<RecommendationsCollection | { error: string; detail?: string }>
) => {
    try {
        const userId = req.params.userId;
        const result = await generateRecommendationsForUser(userId);
        if (!result) {
            res.status(500).json({ error: "Failed to generate recommendations", detail: "Service returned null — check OPENAI_API_KEY and user goals" });
            return;
        }
        res.json(result);
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error("Error in generateRecommendationsForUserController:", detail);
        res.status(500).json({ error: "Failed to generate recommendations", detail });
    }
}

export const getRecommendationsForUserController = async (
    req: GetRecommendationsForUserControllerRequest,
    res: Response<RecommendationsCollection | { error: string }>
) => {
    try {
        const userId = req.params.userId;
        const currentDate = req.query.currentDate;

        console.log(userId, currentDate);
        
        const recommendations = await getRecommendationsForUser(userId, currentDate);

        if (!recommendations) {
            res.status(404).json({ error: "No recommendations found for user" });
            return;
        }
        res.json(recommendations);
    } catch (error) {
        console.error("Error in getRecommendationsForUserController:", error);
        res.status(500).json({ error: "Failed to get recommendations for user" });
    }
}