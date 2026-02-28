import AdminNotification, { IAdminNotification } from "../modules/adminNotification/adminNotification.model.js";
import { socketManager } from "./socket.manager.js";
import { getMessaging } from "./firebase.config.js";
import UserToken from "../modules/user/userToken.model.js";

interface AdminNotificationPayload {
  type: IAdminNotification["type"];
  title: string;
  message: string;
  metadata?: object;
  priority?: "low" | "medium" | "high";
}

/**
 * Send push notification to admin device via FCM
 * Uses ADMIN_USER_ID from .env to find admin's FCM tokens
 */
const sendAdminPushNotification = async (
  title: string,
  body: string,
  data?: { [key: string]: string }
): Promise<boolean> => {
  try {
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) return false;

    const userTokens = await UserToken.find({
      user: adminUserId,
      isActive: true,
    });

    if (userTokens.length === 0) {
      console.log("📴 No FCM tokens found for admin");
      return false;
    }

    const messaging = getMessaging();
    const tokens = userTokens.map((t) => t.fcmToken);

    const message: any = {
      notification: { title, body },
      data: data || {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`📨 Admin push sent: ${response.successCount}/${tokens.length}`);

    // Deactivate failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) failedTokens.push(tokens[idx]);
      });
      await UserToken.updateMany(
        { fcmToken: { $in: failedTokens } },
        { $set: { isActive: false } }
      );
      console.log(`❌ Deactivated ${failedTokens.length} invalid admin tokens`);
    }

    return response.successCount > 0;
  } catch (error) {
    console.error("❌ Error sending admin push:", error);
    return false;
  }
};

/**
 * Core function — creates notification in DB then delivers via Socket or FCM
 * Same pattern as your sendNotification() util
 */
export const sendAdminNotification = async (
  payload: AdminNotificationPayload
): Promise<IAdminNotification> => {
  try {
    // 1. Save to DB
    const notification = await AdminNotification.create({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
      priority: payload.priority || "medium",
      isRead: false,
      deliveryStatus: { socket: false, push: false },
    });

    const adminUserId = process.env.ADMIN_USER_ID;

    if (adminUserId) {
      const isAdminOnline = socketManager.isUserOnline(adminUserId);

      // 2. Try Socket first (real-time for admin dashboard)
      if (isAdminOnline) {
        const socketSent = socketManager.emitToUser(
          adminUserId,
          "admin_notification",
          notification
        );
        if (socketSent) {
          notification.deliveryStatus.socket = true;
          await notification.save();
          console.log(`✅ Admin notified via Socket.IO`);
        }
      }

      // 3. Fall back to FCM push if admin is offline or socket failed
      if (!isAdminOnline || !notification.deliveryStatus.socket) {
        const pushSent = await sendAdminPushNotification(
          payload.title,
          payload.message,
          {
            notificationId: notification._id.toString(),
            type: payload.type,
          }
        );
        if (pushSent) {
          notification.deliveryStatus.push = true;
          await notification.save();
          console.log(`✅ Admin notified via FCM push`);
        }
      }
    }

    return notification;
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    throw error;
  }
};

/**
 * Notify admin: new user signed up
 */
export const notifyAdminNewUser = async (user: {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}): Promise<void> => {
  try {
    await sendAdminNotification({
      type: "new_user",
      title: "New User Registered",
      message: `${user.username} just signed up with ${user.email}`,
      metadata: {
        userId: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      priority: "low",
    });
  } catch (error) {
    // Never throw — must not break signup flow
    console.error("❌ Failed to notify admin: new user:", error);
  }
};

/**
 * Notify admin: new channel created
 */
export const notifyAdminNewChannel = async (channel: {
  id: string;
  channelName: string;
  channelIcon?: string;
  ownerId: string;
 ownerUsername: string;
}): Promise<void> => {
  try {
    await sendAdminNotification({
      type: "new_channel",
      title: "New Channel Created",
      message: `${channel.ownerUsername} created a new channel: "${channel.channelName}"`,
      metadata: {
        channelId: channel.id,
        channelName: channel.channelName,
        channelIcon: channel.channelIcon,
        ownerId: channel.ownerId,
        ownerUsername: channel.ownerUsername,
      },
      priority: "low",
    });
  } catch (error) {
    console.error("❌ Failed to notify admin: new channel:", error);
  }
};

/**
 * Notify admin: new report submitted
 */
export const notifyAdminNewReport = async (report: {
  reporterId: string;
  reporterUsername: string;
  reason: string;
  targetType: "Video" | "Short" | "Post" | "Comment" | "Channel" | "User";
  targetId: string;
}): Promise<void> => {
  try {
    await sendAdminNotification({
      type: "new_report",
      title: "New Report Submitted",
      message: `${report.reporterUsername} reported a ${report.targetType}: "${report.reason}"`,
      metadata: {
        reporterId: report.reporterId,
        reporterUsername: report.reporterUsername,
        reason: report.reason,
        targetType: report.targetType,
        targetId: report.targetId,
      },
      priority: "high",
    });
  } catch (error) {
    console.error("❌ Failed to notify admin: new report:", error);
  }
};