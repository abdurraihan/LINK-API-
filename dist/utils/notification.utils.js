import { getMessaging } from "../utils/firebase.config.js";
import { socketManager } from "./socket.manager.js";
import UserToken from "../modules/user/userToken.model.js";
import Notification from "../modules/notification/notification.model.js";
/**
 * Send push notification via Firebase FCM
 */
export const sendPushNotification = async (userId, payload) => {
    try {
        const userTokens = await UserToken.find({
            user: userId,
            isActive: true,
        });
        if (userTokens.length === 0) {
            console.log(`📴 No FCM tokens found for user ${userId}`);
            return false;
        }
        const messaging = getMessaging();
        const tokens = userTokens.map((t) => t.fcmToken);
        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            tokens: tokens,
        };
        if (payload.imageUrl) {
            message.notification.imageUrl = payload.imageUrl;
        }
        const response = await messaging.sendEachForMulticast(message);
        console.log(`📨 Push sent: ${response.successCount}/${tokens.length}`);
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            await UserToken.updateMany({ fcmToken: { $in: failedTokens } }, { $set: { isActive: false } });
            console.log(`❌ Deactivated ${failedTokens.length} invalid tokens`);
        }
        return response.successCount > 0;
    }
    catch (error) {
        console.error("❌ Error sending push:", error);
        return false;
    }
};
/**
 * Emit notification via Socket.IO
 */
export const emitSocketNotification = (userId, notification) => {
    try {
        const emitted = socketManager.emitToUser(userId, "notification", notification);
        return emitted;
    }
    catch (error) {
        console.error("❌ Error emitting socket notification:", error);
        return false;
    }
};
/**
 * Send notification (Socket.IO + FCM)
 */
export const sendNotification = async (payload) => {
    try {
        const notification = await Notification.create({
            recipient: payload.recipient,
            sender: payload.sender,
            channel: payload.channel,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            targetType: payload.targetType,
            targetId: payload.targetId,
            metadata: payload.metadata || {},
            priority: payload.priority || "medium",
            isRead: false,
            deliveryStatus: {
                socket: false,
                push: false,
            },
        });
        const recipientId = payload.recipient.toString();
        await notification.populate([
            { path: "sender", select: "username avatar" },
            { path: "channel", select: "channelName channelIcon" },
        ]);
        const isUserOnline = socketManager.isUserOnline(recipientId);
        if (isUserOnline) {
            const socketSent = emitSocketNotification(recipientId, notification);
            if (socketSent) {
                notification.deliveryStatus.socket = true;
                await notification.save();
                console.log(`✅ Sent via Socket.IO to ${recipientId}`);
            }
        }
        if (!isUserOnline || !notification.deliveryStatus.socket) {
            const pushSent = await sendPushNotification(recipientId, {
                title: payload.title,
                body: payload.message,
                data: {
                    notificationId: notification._id.toString(),
                    type: payload.type,
                    targetType: payload.targetType || "",
                    targetId: payload.targetId?.toString() || "",
                },
                imageUrl: payload.metadata?.thumbnailUrl,
            });
            if (pushSent) {
                notification.deliveryStatus.push = true;
                await notification.save();
                console.log(`✅ Sent via FCM to ${recipientId}`);
            }
        }
        return notification;
    }
    catch (error) {
        console.error("❌ Error sending notification:", error);
        throw error;
    }
};
/**
 * Send batch notifications
 */
export const sendBatchNotifications = async (recipients, payload) => {
    try {
        const notifications = recipients.map((recipientId) => ({
            recipient: recipientId,
            sender: payload.sender,
            channel: payload.channel,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            targetType: payload.targetType,
            targetId: payload.targetId,
            metadata: payload.metadata || {},
            priority: payload.priority || "medium",
            isRead: false,
            deliveryStatus: {
                socket: false,
                push: false,
            },
        }));
        const createdNotifications = await Notification.insertMany(notifications);
        for (let i = 0; i < recipients.length; i++) {
            const recipientId = recipients[i];
            const notification = createdNotifications[i];
            await notification.populate([
                { path: "sender", select: "username avatar" },
                { path: "channel", select: "channelName channelIcon" },
            ]);
            const isUserOnline = socketManager.isUserOnline(recipientId);
            if (isUserOnline) {
                const socketSent = emitSocketNotification(recipientId, notification);
                if (socketSent) {
                    notification.deliveryStatus.socket = true;
                }
            }
            if (!isUserOnline || !notification.deliveryStatus.socket) {
                const pushSent = await sendPushNotification(recipientId, {
                    title: payload.title,
                    body: payload.message,
                    data: {
                        notificationId: notification._id.toString(),
                        type: payload.type,
                        targetType: payload.targetType || "",
                        targetId: payload.targetId?.toString() || "",
                    },
                    imageUrl: payload.metadata?.thumbnailUrl,
                });
                if (pushSent) {
                    notification.deliveryStatus.push = true;
                }
            }
            await notification.save();
        }
        console.log(`✅ Batch notifications sent to ${recipients.length} users`);
    }
    catch (error) {
        console.error("❌ Error sending batch notifications:", error);
        throw error;
    }
};
/**
 * Update user's FCM token
 */
export const updateUserToken = async (userId, fcmToken, deviceType, deviceId) => {
    try {
        await UserToken.findOneAndUpdate({ user: userId, deviceId }, {
            fcmToken,
            deviceType,
            isActive: true,
            lastUsedAt: new Date(),
        }, { upsert: true, new: true });
        console.log(`✅ FCM token updated for user ${userId}`);
    }
    catch (error) {
        console.error("❌ Error updating token:", error);
        throw error;
    }
};
/**
 * Remove user's FCM token
 */
export const removeUserToken = async (userId, deviceId) => {
    try {
        await UserToken.deleteOne({ user: userId, deviceId });
        console.log(`✅ FCM token removed for user ${userId}`);
    }
    catch (error) {
        console.error("❌ Error removing token:", error);
        throw error;
    }
};
