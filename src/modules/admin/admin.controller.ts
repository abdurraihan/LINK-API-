import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Admin from "./admin.model.js"; // Admin model
import { generateTokens } from "../../utils/jwt.utils.js"; // Token generation utility
import { deleteFromS3ByUrl } from "../../utils/deleteFromS3.js"; // Utility to delete files from S3
import { sendOTPEmail } from "../../utils/sendEmail.js"; // Email OTP utility
import { generateOTP } from "../../utils/otp.js"; // OTP generator utility

// Admin Registration
export const createAdmin = async (req: Request, res: Response) => {
  const { username, email, password, contactNumber } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
      contactNumber,
    });

    await newAdmin.save();

    res.status(201).json({
      status: "success",
      message: "Admin created successfully",
      data: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email,
        avatar: newAdmin.avatar,
        contactNumber: newAdmin.contactNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Login
export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const { access_token, refresh_token } = generateTokens(admin._id.toString());

    res.status(200).json({
      status: "success",
      message: "Admin login successful",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        avatar: admin.avatar,
        contactNumber: admin.contactNumber,
      },
      access_token,
      refresh_token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Logout
export const adminLogout = async (req: Request, res: Response) => {
  try {
    const adminId = req.adminId;
    await Admin.findByIdAndUpdate(adminId, { refreshToken: "" });

    res.status(200).json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ADMIN PROFILE
export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized",
      });
    }

    const admin = await Admin.findById(adminId).select("-password -otp");

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin profile",
    });
  }
};


// Admin Profile Update
export const updateAdminProfile = async (req: Request, res: Response) => {
  const adminId = req.adminId;
  const { username, email, contactNumber } = req.body;
  const file = req.file as any; // Avatar image file

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (contactNumber) admin.contactNumber = contactNumber;

    // Avatar image update
    if (file) {
      if (admin.avatar && !admin.avatar.includes("pixabay")) {
        await deleteFromS3ByUrl(admin.avatar);
      }
      admin.avatar = file.location;
    }

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Admin profile updated successfully",
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        contactNumber: admin.contactNumber,
        avatar: admin.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Forgot Password
export const adminForgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const otp = generateOTP();
    admin.otp = otp;
    await admin.save();

   try {
     await sendOTPEmail(email, otp);
   } catch (error) {
    res.status(400).json({message:"otp is not sent somting went wrong "})
   }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Verify OTP for Reset Password
export const adminVerifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Reset Password
export const adminResetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.otp = undefined;
    await admin.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
