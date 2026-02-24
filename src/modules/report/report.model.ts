import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReport extends Document {
  reporter: Types.ObjectId;
  contentId: Types.ObjectId;
  contentType: "video" | "short" | "post";
  reason: string;
  description?: string;
  status: "pending" | "resolved" | "rejected";
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ["video", "short", "post"],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

reportSchema.index({ contentId: 1, contentType: 1 });

const Report = mongoose.model<IReport>("Report", reportSchema);
export default Report;
