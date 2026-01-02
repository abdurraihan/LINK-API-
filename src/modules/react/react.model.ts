import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ReactionType = "like" | "dislike";
export type TargetType = "Post" | "Short";

export interface IReaction extends Document {
  targetId: Types.ObjectId;
  targetType: TargetType;

  user: Types.ObjectId;
  type: ReactionType;

  createdAt: Date;
}

const reactionSchema = new Schema<IReaction>(
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

    type: {
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

// One reaction per user per target
reactionSchema.index(
  { targetId: 1, targetType: 1, user: 1 },
  { unique: true }
);

const Reaction: Model<IReaction> =
  mongoose.model<IReaction>("Reaction", reactionSchema);

export default Reaction;
