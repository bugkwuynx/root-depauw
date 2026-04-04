import { getUserSetting, patchUserSetting, updateUserSetting } from "../controllers/setting.controller.js";
import { Router } from "express";

const settingRoutes = Router();

settingRoutes.get("/:userId", getUserSetting);
settingRoutes.patch("/:userId", patchUserSetting);
settingRoutes.put("/:userId", updateUserSetting);

export default settingRoutes;