import Notification, { INotification } from "./notification.model.js";
import { sendNotification, sendBatchNotifications } from "../../utils/notification.utils.js";
import Follow from "../follow/follow.model.js";
import User from "../user/user.model.js";
import Channel from "../channel/channel.model.js";
import { Types } from "mongoose";

class NotificationService {
  /**
   * Notify followers about new video upload
   */
  async notifyNewVideo(
    videoId: string | Types.ObjectId,
    channelId: string | Types.ObjectId,
    videoTitle: string,
    thumbnailUrl: string
  ): Promise<void> {
    try {
      // Get channel info
      const channel = await Channel.findById(channelId).populate("owner");
      if (!channel) return;

      // Get all followers with notifications enabled
      const followers = await Follow.find({
        channel: channelId,
        notificationsEnabled: true,
      }).select("follower");

      if (followers.length === 0) return;

      const followerIds = followers.map((f) => f.follower.toString());

      // Send batch notifications
      await sendBatchNotifications(followerIds, {
        sender: channel.owner,
        channel: channelId,
        type: "new_video",
        title: `New video from ${channel.channelName}`,
        message: videoTitle,
        targetType: "Video",
        targetId: videoId,
        metadata: {
          videoTitle,
          thumbnailUrl,
          channelName: channel.channelName,
        },
        priority: "high",
      });

      console.log(`✅ Notified ${followerIds.length} followers about new video`);
    } catch (error) {
      console.error("❌ Error notifying new video:", error);
      throw error;
    }
  }

  /**
   * Notify followers about new short upload
   */
  async notifyNewShort(
    shortId: string | Types.ObjectId,
    channelId: string | Types.ObjectId,
    shortTitle: string,
    thumbnailUrl: string
  ): Promise<void> {
    try {
      const channel = await Channel.findById(channelId).populate("owner");
      if (!channel) return;

      const followers = await Follow.find({
        channel: channelId,
        notificationsEnabled: true,
      }).select("follower");

      if (followers.length === 0) return;

      const followerIds = followers.map((f) => f.follower.toString());

      await sendBatchNotifications(followerIds, {
        sender: channel.owner,
        channel: channelId,
        type: "new_short",
        title: `New short from ${channel.channelName}`,
        message: shortTitle,
        targetType: "Short",
        targetId: shortId,
        metadata: {
          shortTitle,
          thumbnailUrl,
          channelName: channel.channelName,
        },
        priority: "high",
      });

      console.log(`✅ Notified ${followerIds.length} followers about new short`);
    } catch (error) {
      console.error("❌ Error notifying new short:", error);
      throw error;
    }
  }

  /**
   * Notify user about new comment on their content
   */
  async notifyNewComment(
    commentId: string | Types.ObjectId,
    contentOwnerId: string | Types.ObjectId,
    commenterId: string | Types.ObjectId,
    commenterUsername: string,
    commentText: string,
    targetType: "Video" | "Short" | "Post",
    targetId: string | Types.ObjectId
  ): Promise<void> {
    try {
      // Don't notify if user commented on their own content
      if (contentOwnerId.toString() === commenterId.toString()) return;

      await sendNotification({
        recipient: contentOwnerId,
        sender: commenterId,
        type: "comment",
        title: `${commenterUsername} commented on your ${targetType.toLowerCase()}`,
        message: commentText.substring(0, 100),
        targetType: "Comment",
        targetId: commentId,
        metadata: {
          commentText,
          commenterUsername,
          targetType,
          targetId: targetId.toString(),
        },
        priority: "medium",
      });

      console.log(`✅ Notified user ${contentOwnerId} about new comment`);
    } catch (error) {
      console.error("❌ Error notifying new comment:", error);
      throw error;
    }
  }

  /**
   * Notify user about reply to their comment
   */
  async notifyCommentReply(
    replyId: string | Types.ObjectId,
    originalCommentOwnerId: string | Types.ObjectId,
    replierId: string | Types.ObjectId,
    replierUsername: string,
    replyText: string,
    targetType: "Video" | "Short" | "Post",
    targetId: string | Types.ObjectId
  ): Promise<void> {
    try {
      // Don't notify if user replied to their own comment
      if (originalCommentOwnerId.toString() === replierId.toString()) return;

      await sendNotification({
        recipient: originalCommentOwnerId,
        sender: replierId,
        type: "comment_reply",
        title: `${replierUsername} replied to your comment`,
        message: replyText.substring(0, 100),
        targetType: "Comment",
        targetId: replyId,
        metadata: {
          replyText,
          replierUsername,
          targetType,
          targetId: targetId.toString(),
        },
        priority: "medium",
      });

      console.log(`✅ Notified user ${originalCommentOwnerId} about comment reply`);
    } catch (error) {
      console.error("❌ Error notifying comment reply:", error);
      throw error;
    }
  }

  /**
   * Notify user about new follower
   */
  async notifyNewFollower(
    channelOwnerId: string | Types.ObjectId,
    followerId: string | Types.ObjectId,
    followerUsername: string,
    channelId: string | Types.ObjectId,
    channelName: string
  ): Promise<void> {
    try {
      await sendNotification({
        recipient: channelOwnerId,
        sender: followerId,
        channel: channelId,
        type: "new_follower",
        title: `${followerUsername} subscribed to your channel`,
        message: `You have a new subscriber on ${channelName}`,
        metadata: {
          followerUsername,
          channelName,
        },
        priority: "low",
      });

      console.log(`✅ Notified user ${channelOwnerId} about new follower`);
    } catch (error) {
      console.error("❌ Error notifying new follower:", error);
      throw error;
    }
  }

  /**
   * Notify user about like on their content
   */
  async notifyLike(
    contentOwnerId: string | Types.ObjectId,
    likerId: string | Types.ObjectId,
    likerUsername: string,
    targetType: "Video" | "Short" | "Post",
    targetId: string | Types.ObjectId
  ): Promise<void> {
    try {
      // Don't notify if user liked their own content
      if (contentOwnerId.toString() === likerId.toString()) return;

      await sendNotification({
        recipient: contentOwnerId,
        sender: likerId,
        type: "like",
        title: `${likerUsername} liked your ${targetType.toLowerCase()}`,
        message: `Your ${targetType.toLowerCase()} received a like`,
        targetType,
        targetId,
        metadata: {
          likerUsername,
          targetType,
        },
        priority: "low",
      });

      console.log(`✅ Notified user ${contentOwnerId} about like`);
    } catch (error) {
      console.error("❌ Error notifying like:", error);
      throw error;
    }
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filter?: "read" | "unread"
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const query: any = {
        recipient: userId,
        isDeleted: false,
      };

      if (filter === "read") {
        query.isRead = true;
      } else if (filter === "unread") {
        query.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .populate("sender", "username avatar")
          .populate("channel", "channelName channelIcon")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({
          recipient: userId,
          isRead: false,
          isDeleted: false,
        }),
      ]);

      return {
        notifications: notifications as INotification[],
        total,
        unreadCount,
      };
    } catch (error) {
      console.error("❌ Error getting user notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
      console.log(`✅ Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      console.log(`✅ Marked all notifications as read for user ${userId}`);
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isDeleted: true }
      );
      console.log(`✅ Deleted notification ${notificationId}`);
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { recipient: userId },
        { isDeleted: true }
      );
      console.log(`✅ Cleared all notifications for user ${userId}`);
    } catch (error) {
      console.error("❌ Error clearing all notifications:", error);
      throw error;
    }
  }
}

export default new NotificationService();