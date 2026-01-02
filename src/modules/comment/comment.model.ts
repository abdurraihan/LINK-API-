import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CommentTargetType = "Post" | "Short";

export interface IComment extends Document {
  targetId: Types.ObjectId;
  targetType: CommentTargetType;

  user: Types.ObjectId;
  content: string;

  parentComment?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ["Post", "Short"],
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Comment: Model<IComment> =
  mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
