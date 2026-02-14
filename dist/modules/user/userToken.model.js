import mongoose, { Schema } from "mongoose";
const userTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    fcmToken: {
        type: String,
        required: true,
        unique: true,
    },
    deviceType: {
        type: String,
        enum: ["ios", "android", "web"],
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    versionKey: false,
});
userTokenSchema.index({ user: 1, deviceId: 1 }, { unique: true });
userTokenSchema.index({ user: 1, isActive: 1 });
const UserToken = mongoose.model("UserToken", userTokenSchema);
export default UserToken;
