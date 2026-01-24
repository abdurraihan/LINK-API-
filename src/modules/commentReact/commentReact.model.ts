import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICommentReact extends Document {
  user: Types.ObjectId;
  comment: Types.ObjectId;
  reactionType: "like" | "dislike";
  createdAt: Date;
  updatedAt: Date;
}

const commentReactSchema = new Schema<ICommentReact>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
      index: true,
    },
    reactionType: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

commentReactSchema.index({ user: 1, comment: 1 }, { unique: true });


commentReactSchema.index({ comment: 1, reactionType: 1 });

const CommentReact: Model<ICommentReact> = mongoose.model<ICommentReact>(
  "CommentReact",
  commentReactSchema
);

export default CommentReact;