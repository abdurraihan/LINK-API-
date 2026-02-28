import AdminNotification, { IAdminNotification } from "./adminNotification.model.js";

class AdminNotificationService {

  /**
   * Get admin notifications with pagination + filter
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    filter?: "read" | "unread",
    type?: IAdminNotification["type"]
  ): Promise<{
    notifications: IAdminNotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const query: any = { isDeleted: false };

      if (filter === "read")   query.isRead = true;
      if (filter === "unread") query.isRead = false;
      if (type)                query.type = type;

      const [notifications, total, unreadCount] = await Promise.all([
        AdminNotification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AdminNotification.countDocuments(query),
        AdminNotification.countDocuments({ isRead: false, isDeleted: false }),
      ]);

      return {
        notifications: notifications as IAdminNotification[],
        total,
        unreadCount,
      };
    } catch (error) {
      console.error("❌ Error getting admin notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread count only (for badge in admin dashboard)
   */
  async getUnreadCount(): Promise<number> {
    return AdminNotification.countDocuments({ isRead: false, isDeleted: false });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await AdminNotification.findByIdAndUpdate(notificationId, {
        isRead: true,
        readAt: new Date(),
      });
      console.log(`✅ Admin notification ${notificationId} marked as read`);
    } catch (error) {
      console.error("❌ Error marking admin notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await AdminNotification.updateMany(
        { isRead: false, isDeleted: false },
        { isRead: true, readAt: new Date() }
      );
      console.log("✅ All admin notifications marked as read");
    } catch (error) {
      console.error("❌ Error marking all admin notifications as read:", error);
      throw error;
    }
  }

  /**
   * Soft delete single notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await AdminNotification.findByIdAndUpdate(notificationId, { isDeleted: true });
      console.log(`✅ Admin notification ${notificationId} deleted`);
    } catch (error) {
      console.error("❌ Error deleting admin notification:", error);
      throw error;
    }
  }

  /**
   * Soft delete all notifications
   */
  async clearAll(): Promise<void> {
    try {
      await AdminNotification.updateMany(
        { isDeleted: false },
        { isDeleted: true }
      );
      console.log("✅ All admin notifications cleared");
    } catch (error) {
      console.error("❌ Error clearing admin notifications:", error);
      throw error;
    }
  }
}

export default new AdminNotificationService();