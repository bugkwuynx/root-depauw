import { getRecommendationsController } from "../controllers/recommendations.controller.js";
import { Router } from "express";

const recommendationsRouter = Router();

recommendationsRouter.post("/:userId", getRecommendationsController);

export default recommendationsRouter;