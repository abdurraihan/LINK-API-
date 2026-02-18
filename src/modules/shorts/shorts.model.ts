import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IShort extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  hashtags?: string[];
  owner: Types.ObjectId;
  channel: Types.ObjectId;
  totalViews: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  totalRevenue: number;
  watchTime: number;
  publishedAt?: Date;
  isPublished: boolean;
  visibility: "public" | "private" | "unlisted";
  duration: number;
  category?: string;
  language?: string;
  
  transcodeJobId?: string;
  transcodeStatus?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const shortSchema = new Schema<IShort>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    videoUrl: {
      type: String,
      required: true,
    },
    hashtags: {
      type: [String],
      default: [],
      index: true,
    },
    owner: {
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
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dislikesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    watchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
      max: [60, "Short duration cannot exceed 60 seconds"],
    },
    category: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
      default: "en",
    },
    transcodeJobId: {
      type: String,
    },
    transcodeStatus: {
      type: String,
      enum: ["SUBMITTED", "PROGRESSING", "COMPLETE", "ERROR"],
      default: "SUBMITTED",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

shortSchema.index({ channel: 1, publishedAt: -1 });
shortSchema.index({ owner: 1, createdAt: -1 });
shortSchema.index({ totalViews: -1 });
shortSchema.index({ isPublished: 1, visibility: 1 });
shortSchema.index({ hashtags: 1 });
shortSchema.index({ title: 'text', description: 'text', hashtags: 'text' });
const Short: Model<IShort> = mongoose.model<IShort>("Short", shortSchema);

export default Short;