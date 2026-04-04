import { Router } from "express";
import { getDevices, saveToken, sendToAll, sendToDevice } from "../controllers/notifications.controller.js";

const notificationsRouter = Router();

notificationsRouter.post("/save-token", saveToken);
notificationsRouter.get("/devices", getDevices);
notificationsRouter.post("/send-to-one", sendToDevice);
notificationsRouter.post("/send-to-all", sendToAll);

export default notificationsRouter;