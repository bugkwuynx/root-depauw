import { getUserSetting, updateUserSetting } from "../controllers/setting.controller.js";
import { Router } from "express";

const settingRoutes = Router();

settingRoutes.get("/:userId", getUserSetting);
settingRoutes.put("/:userId", updateUserSetting);

export default settingRoutes;