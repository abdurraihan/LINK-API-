import { Request, Response } from "express";
import adminNotificationService from "./adminNotification.service.js";
import { IAdminNotification } from "./adminNotification.model.js";
import { sendAdminNotification } from "../../utils/adminNotification.utils.js";

class AdminNotificationController {
  /**
   * GET /api/v1/admin/notifications
   * Query params: page, limit, filter (read|unread), type (new_user|new_channel|new_report)
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const page   = parseInt(req.query.page  as string) || 1;
      const limit  = parseInt(req.query.limit as string) || 20;
      const filter = req.query.filter as "read" | "unread" | undefined;
      const type   = req.query.type   as IAdminNotification["type"] | undefined;

      const result = await adminNotificationService.getNotifications(page, limit, filter, type);

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
      console.error("Error getting admin notifications:", error);
      res.status(500).json({ status: "error", message: "Failed to get notifications" });
    }
  }

  /**
   * GET /api/v1/admin/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await adminNotificationService.getUnreadCount();
      res.status(200).json({
        status: "success",
        data: { unreadCount: count },
      });
    } catch (error) {
      console.error("Error getting admin unread count:", error);
      res.status(500).json({ status: "error", message: "Failed to get unread count" });
    }
  }

  /**
   * PATCH /api/v1/admin/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminNotificationService.markAsRead(id);
      res.status(200).json({ status: "success", message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking admin notification as read:", error);
      res.status(500).json({ status: "error", message: "Failed to mark as read" });
    }
  }

  /**
   * PATCH /api/v1/admin/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      await adminNotificationService.markAllAsRead();
      res.status(200).json({ status: "success", message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all admin notifications as read:", error);
      res.status(500).json({ status: "error", message: "Failed to mark all as read" });
    }
  }

  /**
   * DELETE /api/v1/admin/notifications/:id
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await adminNotificationService.deleteNotification(id);
      res.status(200).json({ status: "success", message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting admin notification:", error);
      res.status(500).json({ status: "error", message: "Failed to delete notification" });
    }
  }

  /**
   * DELETE /api/v1/admin/notifications/clear-all
   */
  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      await adminNotificationService.clearAll();
      res.status(200).json({ status: "success", message: "All notifications cleared" });
    } catch (error) {
      console.error("Error clearing admin notifications:", error);
      res.status(500).json({ status: "error", message: "Failed to clear notifications" });
    }
  }


  /**
 * POST /api/v1/admin/notifications/test
 * For development/testing only
 */
async testNotification(req: Request, res: Response): Promise<void> {
  try {
    const { type, title, message } = req.body;

    // Validate type
    const allowedTypes = ["new_user", "new_channel", "new_report"];
    if (type && !allowedTypes.includes(type)) {
      res.status(400).json({
        status: "fail",
        message: `type must be one of: ${allowedTypes.join(", ")}`,
      });
      return;
    }

    const selectedType = type || "new_user";

    // Default metadata per type for realistic test data
    const defaultMetadata: Record<string, object> = {
      new_user: {
        userId: "test_user_123",
        username: "test_user",
        email: "testuser@example.com",
        avatar: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
      },
      new_channel: {
        channelId: "test_channel_456",
        channelName: "Test Channel",
        channelIcon: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        ownerId: "test_user_123",
        ownerUsername: "test_user",
      },
      new_report: {
        reporterId: "test_user_123",
        reporterUsername: "test_user",
        reason: "Inappropriate content",
        targetType: "Video",
        targetId: "test_video_789",
      },
    };

    const notification = await sendAdminNotification({
      type: selectedType as IAdminNotification["type"],
      title: title || `Test ${selectedType.replace("_", " ")} notification`,
      message: message || `This is a test notification for type: ${selectedType}`,
      metadata: defaultMetadata[selectedType],
      priority: selectedType === "new_report" ? "high" : "low",
    });

    res.status(200).json({
      status: "success",
      message: "Test admin notification sent",
      data: notification,
    });
  } catch (error) {
    console.error("Error sending test admin notification:", error);
    res.status(500).json({ status: "error", message: "Failed to send test notification" });
  }
}
}

export default new AdminNotificationController();