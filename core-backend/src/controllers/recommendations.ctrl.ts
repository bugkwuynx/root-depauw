import { getRecommendations } from "../services/recommendations.service.js";
import type {
    GetRecommendationsControllerRequest,
    RecommendationsCollection
} from "../types/recommendations.type.js";
import type { Response } from "express";

export const getRecommendationsController = async (
    req: GetRecommendationsControllerRequest,
    res: Response<RecommendationsCollection | { error: string }>
) => {
    try {
        const getRecommendationsInput = req.body;

        const getRecommendationsResult = await getRecommendations(getRecommendationsInput);

        if (!getRecommendationsResult) {
            res.status(404).json({ error: "No recommendations found" });
            return;
        }

        res.json(getRecommendationsResult);
    } catch (error) {
        console.error("Error in getRecommendationsController:", error);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
}