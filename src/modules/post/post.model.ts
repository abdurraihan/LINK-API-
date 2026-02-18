import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPost extends Document {
  description?: string;

  media: {
    url: string;
    
  }[];

  hashtags?: string[];
  taggedPeople?: Types.ObjectId[];
  links?: string;

  owner: Types.ObjectId;
  channel?: Types.ObjectId;

  likesCount: number;
  dislikesCount: number;
  commentsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    media: {
      type: [
        {
          url: { type: String, required: true },
          
        },
      ],
      required: true,
      validate: [
        (val: any[]) => val.length > 0,
        "At least one media is required",
      ],
    },

    hashtags: {
      type: [String],
      default: [],
      index: true,
    },

    taggedPeople: [
      {
        type: Schema.Types.ObjectId,
        ref: "Channel",
      },
    ],

    links: {
      type:String
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
      required:true,
      index: true,
    },

    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

postSchema.index({ description: 'text', hashtags: 'text' });

const Post: Model<IPost> = mongoose.model<IPost>("Post", postSchema);
export default Post;
