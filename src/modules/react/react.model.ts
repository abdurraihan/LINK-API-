import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReact extends Document {
  user: Types.ObjectId;
  targetType: "Video" | "Short" | "Post";
  targetId: Types.ObjectId;
  reactionType: "like" | "dislike";
  createdAt: Date;
  updatedAt: Date;
}

const reactSchema = new Schema<IReact>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Compound index to ensure one reaction per user per target
reactSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Index for querying reactions by target
reactSchema.index({ targetType: 1, targetId: 1, reactionType: 1 });

const React: Model<IReact> = mongoose.model<IReact>("React", reactSchema);

export default React;