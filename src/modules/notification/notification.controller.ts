import { Request, Response } from "express";
import notificationService from "./notification.service.js";
import { sendNotification } from "../../utils/notification.utils.js"; // ✅ ADD THIS
import { updateUserToken, removeUserToken } from "../../utils/notification.utils.js";

class NotificationController {
  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filter = req.query.filter as "read" | "unread" | undefined;

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit,
        filter
      );

      res.status(200).json({
        status: "success",
        data: {
          notifications: result.notifications,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
          unreadCount: result.unreadCount,
        },
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get notifications",
      });
    }
  }

  /**
   * Get unread count
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const result = await notificationService.getUserNotifications(userId, 1, 1);

      res.status(200).json({
        status: "success",
        data: {
          unreadCount: result.unreadCount,
        },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get unread count",
      });
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await notificationService.markAsRead(id, userId);

      res.status(200).json({
        status: "success",
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to mark notification as read",
      });
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      await notificationService.markAllAsRead(userId);

      res.status(200).json({
        status: "success",
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to mark all notifications as read",
      });
    }
  }

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      res.status(200).json({
        status: "success",
        message: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to delete notification",
      });
    }
  }

  /**
   * Clear all notifications
   * DELETE /api/v1/notifications/clear-all
   */
  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      await notificationService.clearAllNotifications(userId);

      res.status(200).json({
        status: "success",
        message: "All notifications cleared",
      });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to clear notifications",
      });
    }
  }

  /**
   * Register FCM token
   * POST /api/v1/notifications/register-token
   */
  async registerToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { fcmToken, deviceType, deviceId } = req.body;

      if (!fcmToken || !deviceType || !deviceId) {
        res.status(400).json({
          status: "fail",
          message: "fcmToken, deviceType, and deviceId are required",
        });
        return;
      }

      if (!["ios", "android", "web"].includes(deviceType)) {
        res.status(400).json({
          status: "fail",
          message: "deviceType must be ios, android, or web",
        });
        return;
      }

      await updateUserToken(userId, fcmToken, deviceType, deviceId);

      res.status(200).json({
        status: "success",
        message: "FCM token registered successfully",
      });
    } catch (error) {
      console.error("Error registering token:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to register FCM token",
      });
    }
  }

  /**
   * Unregister FCM token
   * DELETE /api/v1/notifications/unregister-token
   */
  async unregisterToken(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { deviceId } = req.body;

      if (!deviceId) {
        res.status(400).json({
          status: "fail",
          message: "deviceId is required",
        });
        return;
      }

      await removeUserToken(userId, deviceId);

      res.status(200).json({
        status: "success",
        message: "FCM token unregistered successfully",
      });
    } catch (error) {
      console.error("Error unregistering token:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to unregister FCM token",
      });
    }
  }

  /**
   * Test notification (for development)
   * POST /api/v1/notifications/test
   */
  async testNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { title, message, type } = req.body;

      const notification = await sendNotification({
        recipient: userId,
        type: type || "system",
        title: title || "Test Notification",
        message: message || "This is a test notification",
        priority: "high",
      });

      res.status(200).json({
        status: "success",
        message: "Test notification sent",
        data: notification,
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to send test notification",
      });
    }
  }
}

export default new NotificationController();