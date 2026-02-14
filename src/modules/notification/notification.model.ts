import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  channel?: Types.ObjectId;
  type: 
    | "new_video" 
    | "new_short" 
    | "new_post"
    | "comment" 
    | "comment_reply" 
    | "like" 
    | "dislike"
    | "new_follower"
    | "mention"
    | "system";
  title: string;
  message: string;
  targetType?: "Video" | "Short" | "Post" | "Comment";
  targetId?: Types.ObjectId;
  metadata?: {
    videoTitle?: string;
    shortTitle?: string;
    postContent?: string;
    commentText?: string;
    thumbnailUrl?: string;
    channelName?: string;
    [key: string]: any;
  };
  isRead: boolean;
  readAt?: Date;
  deliveryStatus: {
    socket: boolean;
    push: boolean;
  };
  priority: "low" | "medium" | "high";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      index: true,
    },
    type: {
      type: String,
      enum: [
        "new_video",
        "new_short",
        "new_post",
        "comment",
        "comment_reply",
        "like",
        "dislike",
        "new_follower",
        "mention",
        "system",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    targetType: {
      type: String,
      enum: ["Video", "Short", "Post", "Comment"],
      refPath: "targetType",
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    deliveryStatus: {
      socket: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;