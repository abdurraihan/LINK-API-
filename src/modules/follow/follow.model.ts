import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFollow extends Document {
  follower: Types.ObjectId; // User who is following
  channel: Types.ObjectId; // Channel being followed
  notificationsEnabled: boolean; // Bell icon functionality
  createdAt: Date;
  updatedAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: {
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
    notificationsEnabled: {
      type: Boolean,
      default: true, // By default, notify about new uploads
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to ensure a user can only follow a channel once
// This prevents duplicate subscriptions
followSchema.index({ follower: 1, channel: 1 }, { unique: true });

// Index for efficiently querying all channels a user follows
followSchema.index({ follower: 1, createdAt: -1 });

// Index for efficiently querying all followers of a channel
followSchema.index({ channel: 1, createdAt: -1 });

const Follow: Model<IFollow> = mongoose.model<IFollow>("Follow", followSchema);

export default Follow;