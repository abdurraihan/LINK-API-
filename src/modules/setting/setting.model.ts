import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  aboutUs: string;
  termsAndConditions: string;
  privacyPolicy: string;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    aboutUs: {
      type: String,
      default: "This is about us",
    },
    termsAndConditions: {
      type: String,
      default: "This is Terms and Condition",
    },
    privacyPolicy: {
      type: String,
      default: "This is privicy and Policy",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISettings>("Settings", settingsSchema);