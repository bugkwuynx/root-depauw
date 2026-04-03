import { getRecommendationsController } from "../controllers/recommendations.ctrl.js";
import { Router } from "express";

const recommendationsRouter = Router();

recommendationsRouter.post("/:userId", getRecommendationsController);

export default recommendationsRouter;