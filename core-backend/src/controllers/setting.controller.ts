import { getSetting, patchSetting, updateSetting } from "../services/setting.service.js";
import type { GetUserSettingRequest, PatchUserSettingRequest, Setting, UpdateUserSettingRequest } from "../types/setting.type.js";
import type { Request, Response } from "express";

export const getUserSetting = async (
    req: GetUserSettingRequest,
    res: Response<Setting | { error: string }>,
) => {
    try {
        const { userId } = req.params;
        const setting = await getSetting(userId);
        return res.status(200).json(setting);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};

export const patchUserSetting = async (
    req: PatchUserSettingRequest,
    res: Response<{ message: string } | { error: string }>,
) => {
    try {
        const { userId } = req.params;
        const { newSetting } = req.body;
        await patchSetting(userId, newSetting);
        return res.status(200).json({ message: "Setting updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};

export const updateUserSetting = async (
    req: UpdateUserSettingRequest,
    res: Response<{ message: string } | { error: string }>,
) => {
    try {
        const { userId } = req.params;
        const { newSetting } = req.body;
        await updateSetting(userId, newSetting);
        return res.status(200).json({ message: "Setting updated successfully" });
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
};