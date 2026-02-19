import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVideo extends Document {
  title: string;
  description?: string;
  thumbnail: string;
  videoUrl: string;
  hashtags?: string[];
  links?: string[];
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

const videoSchema = new Schema<IVideo>(
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
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    thumbnail: {
      type: String,
      required: true,
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
    links: {
      type: [String],
      default: [],
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
      //default: false,
      default:true,
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

videoSchema.index({ channel: 1, publishedAt: -1 });
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ totalViews: -1 });
videoSchema.index({ isPublished: 1, visibility: 1 });
videoSchema.index({ hashtags: 1 });

videoSchema.index({ title: 'text', description: 'text', hashtags: 'text' });                      
const Video: Model<IVideo> = mongoose.model<IVideo>("Video", videoSchema);

export default Video;