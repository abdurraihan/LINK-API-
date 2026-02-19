import mongoose, { Schema, Document, Types, Model } from "mongoose";

interface ISave extends Document {
  user: Types.ObjectId;
  savedContent: {
    type: "Video" | "Short" | "Post";
    contentId: Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const saveSchema = new Schema<ISave>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one save document per user
      index: true,
    },
    savedContent: [
      {
        type: {
          type: String,
          enum: ["Video", "Short", "Post"],
          required: true,
        },
        contentId: {
          type: Schema.Types.ObjectId,
          required: true,
          // refPath removed — we handle population manually in the controller
        },
      },
    ],
  },
  { timestamps: true }
);

const Save: Model<ISave> = mongoose.model<ISave>("Save", saveSchema);
export default Save;