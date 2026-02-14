import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserToken extends Document {
  user: Types.ObjectId;
  fcmToken: string;
  deviceType: "ios" | "android" | "web";
  deviceId: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userTokenSchema = new Schema<IUserToken>(
  {
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userTokenSchema.index({ user: 1, deviceId: 1 }, { unique: true });
userTokenSchema.index({ user: 1, isActive: 1 });

const UserToken: Model<IUserToken> = mongoose.model<IUserToken>(
  "UserToken",
  userTokenSchema
);

export default UserToken;