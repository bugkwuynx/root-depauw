import { getRecommendationsController, getRecommendationsForUserController } from "../controllers/recommendations.controller.js";
import { Router } from "express";

const recommendationsRouter = Router();

recommendationsRouter.post("/:userId", getRecommendationsController);
recommendationsRouter.get("/:userId", getRecommendationsForUserController);

export default recommendationsRouter;