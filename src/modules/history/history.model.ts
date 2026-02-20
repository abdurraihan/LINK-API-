import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHistory extends Document {
  user: Types.ObjectId;
  video: Types.ObjectId;
  short: Types.ObjectId;
  watchedAt: Date;
}

const historySchema = new Schema<IHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: false,  // Can be null for shorts
    },
    short: {
      type: Schema.Types.ObjectId,
      ref: "Short",
      required: false,  // Can be null for videos
    },
    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const History: mongoose.Model<IHistory> = mongoose.model<IHistory>("History", historySchema);

export default History;
