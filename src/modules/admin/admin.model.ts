import mongoose, { Schema, Document, Model } from "mongoose";

// Admin interface
export interface IAdmin extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  contactNumber: number;
  otp?: string;
  otpVerified?: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Admin Schema
const adminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },

    contactNumber: {
      type: Number,
      //required: true,
    },

    otp: {
      type: String,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Admin model
const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
