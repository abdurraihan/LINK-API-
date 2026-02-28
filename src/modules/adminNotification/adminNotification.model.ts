import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAdminNotification extends Document {
  type: "new_user" | "new_channel" | "new_report";
  title: string;
  message: string;
  metadata?: {
    // new_user fields
    userId?: string;
    username?: string;
    email?: string;
    avatar?: string;
    // new_channel fields
    channelId?: string;
    channelName?: string;
    channelIcon?: string;
    ownerUsername?: string;
    ownerId?: string;
    // new_report fields
    reporterId?: string;
    reporterUsername?: string;
    reason?: string;
    targetType?: string;
    targetId?: string;
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

const adminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: {
      type: String,
      enum: ["new_user", "new_channel", "new_report"],
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
      socket: { type: Boolean, default: false },
      push:   { type: Boolean, default: false },
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

// Indexes for fast admin queries
adminNotificationSchema.index({ isRead: 1, createdAt: -1 });
adminNotificationSchema.index({ isDeleted: 1, createdAt: -1 });
adminNotificationSchema.index({ type: 1, createdAt: -1 });
// Auto-delete after 90 days
adminNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const AdminNotification: Model<IAdminNotification> = mongoose.model<IAdminNotification>(
  "AdminNotification",
  adminNotificationSchema
);

export default AdminNotification;