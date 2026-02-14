import mongoose, { Schema } from "mongoose";
const followSchema = new Schema({
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
}, {
    timestamps: true,
    versionKey: false,
});
// Compound index to ensure a user can only follow a channel once
// This prevents duplicate subscriptions
followSchema.index({ follower: 1, channel: 1 }, { unique: true });
// Index for efficiently querying all channels a user follows
followSchema.index({ follower: 1, createdAt: -1 });
// Index for efficiently querying all followers of a channel
followSchema.index({ channel: 1, createdAt: -1 });
const Follow = mongoose.model("Follow", followSchema);
export default Follow;
