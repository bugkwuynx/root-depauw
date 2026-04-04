import type User from "./user.type.js";
import type { Request, Response } from "express";

export interface Setting {
    goals: User["goals"];
    displayName: User["name"];
    remindersEnabled: User["preferences"]["notificationsEnabled"];
    preferEmptyGoalsList: boolean;
};

export interface GetUserSettingRequest extends Request {
    params: {
        userId: string;
    };
};

export interface UpdateUserSettingRequest extends Request {
    params: {
        userId: string;
    };
    body: {
        newSetting: Setting;
    };
}

export interface PatchUserSettingRequest extends Request {
    params: {
        userId: string;
    };
    body: {
        newSetting: Partial<Setting>;
    };
}