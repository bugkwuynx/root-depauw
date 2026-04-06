import { sendExpoNotifications } from "../services/notification.service.js";
import type { ExpoMessage, SaveTokenRequest, SendToDeviceRequest } from "../types/expo.type.js";
import type { Request, Response } from "express";
import { db } from "../database/configFirestore.js";

export const saveToken = async (req: SaveTokenRequest, res: Response) => {
    const { token, userId } = req.body;

    console.log("Received token: ", token);

    if (!token || typeof token !== "string") {
        return res.status(400).json({success: false, message: "Invalid token format"});
    }

    const findToken = await db.collection("tokens").where("token", "==", token).get();

    if (!findToken.empty) {
        // Update userId if it wasn't set before
        if (userId) {
            await db.collection("tokens").doc(token).update({ userId });
        }
        console.log("Token already exists. Skipping save.");
        return res.json({success: true, message: "Token already exists"});
    }

    await db.collection("tokens").doc(token).set({ token, ...(userId && { userId }) });

    res.json({success: true, message: "Token saved successfully"});
}

export const sendToDevice = async(req: SendToDeviceRequest, res: Response) => {
    const sendToDeviceData = req.body;

    if (!sendToDeviceData.token || !sendToDeviceData.title || !sendToDeviceData.body) {
        return res.status(400).json({success: false, message: "Token, title, and body are required"});
    }

    const mesages: ExpoMessage[] = [{
        to: sendToDeviceData.token,
        title: sendToDeviceData.title,
        body: sendToDeviceData.body,
        data: sendToDeviceData.data || undefined,
        sound: "default",
        priority: "high",
    }] as ExpoMessage[];

    try {
        const tickets = await sendExpoNotifications(mesages);
        console.log("Push tickets: ", tickets);
        res.json({success: true, message: "Notifications sent", tickets});
    } catch (error) {
        console.error("Error sending notifications: ", error);
        res.status(500).json({success: false, message: "Failed to send notifications"});
    }
}

export const sendToAll = async(req: Request, res: Response) => {
    const {title, body, data} = req.body as {
        title?: string;
        body?: string;
        data?: Record<string, unknown>;
    };

    if (!title || !body) {
        return res.status(400).json({success: false, message: "Title and body are required"});
    }

    const tokenStore = await db.collection("tokens").get().then(snap => new Set(snap.docs.map(doc => doc.data().token)));

    if (tokenStore.size === 0) {
        return res.status(200).json({success: true, message: "No tokens to send to"});
    }

    const messages: ExpoMessage[] = Array.from(tokenStore).map(token => ({
        to: token,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
    })) as ExpoMessage[];

    try {
        const tickets = await sendExpoNotifications(messages);
        console.log("Push tickets: ", tickets);
        res.json({success: true, message: "Notifications sent", tickets});
    } catch (error) {
        console.error("Error sending notifications: ", error);
        res.status(500).json({success: false, message: "Failed to send notifications"});
    }
}

export const getDevices = async (req: Request, res: Response) => {
    const tokenStore = await db.collection("tokens").get().then(snap => {
        return snap.docs.map(doc => doc.data());
    });
    res.json({success: true, devices: tokenStore});
};