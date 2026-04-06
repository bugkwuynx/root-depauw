import { getRecommendationsController, getRecommendationsForUserController, generateRecommendationsForUserController } from "../controllers/recommendations.controller.js";
import { Router } from "express";

const recommendationsRouter = Router();

// Generate fresh recommendations (crawls events + reads user goals + calls AI + stores result)
recommendationsRouter.post("/:userId/generate", generateRecommendationsForUserController);
// Manually supply campus events / calendar / goals (used by finalizeJob.ts)
recommendationsRouter.post("/:userId", getRecommendationsController);
// Read stored recommendations for a date
recommendationsRouter.get("/:userId", getRecommendationsForUserController);

export default recommendationsRouter;