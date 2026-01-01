import mongoose, { Schema, Document, Model, Types } from "mongoose";


export interface IChannel extends Document {
  channelName: string;
  description?: string;
  channelIcon: string;
  owner: Types.ObjectId; 
  links?:string;

 // channel stastesitc 
  totalSubscribers: number;
  totalViews: number;
  totalRevenue: number;
  totalWatchTime: number; 
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    channelName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      required:true, 
      default:"channel discriptin "
    },

    channelIcon: {
      type: String,
      required: true,
      
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
      index: true,
    },

    links:{
        type:String
    },

    totalSubscribers: {
      type: Number,
      default: 0,
    },

    totalViews: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    totalWatchTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Channel: Model<IChannel> = mongoose.model<IChannel>(
  "Channel",
  channelSchema
);

export default Channel;
