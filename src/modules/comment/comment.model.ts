import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IComment extends Document {
  content: string;
  user: Types.ObjectId;
  channel: Types.ObjectId;
  targetType: "Video" | "Short" | "Post";
  targetId: Types.ObjectId;
  
  // For reply functionality
  parentComment?: Types.ObjectId;
  isReply: boolean;
  
  // Engagement metrics
  likesCount: number;
  dislikesCount: number;
  repliesCount: number;
  
  // Moderation
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [10000, "Comment cannot exceed 10000 characters"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Video", "Short", "Post"],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
      index: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    isReply: {
      type: Boolean,
      default: false,
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislikesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound indexes for efficient queries
commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ targetType: 1, targetId: 1, isPinned: -1, createdAt: -1 });

const Comment: Model<IComment> = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;