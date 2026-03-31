import mongoose, { Document, Schema } from "mongoose";

export interface IAIConversation extends Document {
  userId: string;
  type: "chat" | "image";
  prompt: string;
  response: string;
  aiModel: string;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["chat", "image"], required: true },
    prompt: { type: String, required: true },
    response: { type: String, required: true },
    aiModel: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAIConversation>(
  "AIConversation",
  AIConversationSchema
);