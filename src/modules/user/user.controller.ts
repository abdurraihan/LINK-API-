
import express, { Request, Response, NextFunction } from "express";
import bcryptjs from "bcrypt";
import User from "./user.model.js";
import { sendOTPEmail } from "../../utils/sendEmail.js";
import { generateOTP } from "../../utils/otp.js";
import { 
  generateTokens, 
  generateAccessToken, 
  verifyRefreshToken 
} from "../../utils/jwt.utils.js";

// Signup API with Email Verification
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();   

    // Save user with OTP
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      otp,
    });

    await newUser.save();

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(201).json({ 
      message: "User created. Please verify your email with the OTP." 
    });
  } catch (error) {
    next(error);
  }
};

// Verify Email API with OTP
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined; 
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// Login API with Email
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({ 
        status: "error", 
        message: "User not found" 
      });
    }
    
    if (!user.isVerified) {
      return res.status(400).json({ 
        status: "error", 
        message: "Email not verified" 
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid password" 
      });
    }

    // Generate tokens using utility function
    const { access_token, refresh_token } = generateTokens(user._id.toString());

    // Pick only necessary fields
    const { username, email: userEmail, avatar } = user;

    res.status(200).json({
      status: "success",
      data: { username, email: userEmail, avatar },
      access_token,
      refresh_token,
    });
  } catch (error) {
    next(error);
  }
};

//Social Login API
export const SocialLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, photo } = req.body;

  try {
    let user = await User.findOne({ email }).lean();

    if (!user) {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcryptjs.hash(generatedPassword, 10);

      const newUser = new User({
        username: name.split(" ").join("").toLowerCase() + Math.random().toString(36).slice(-2),
        email,
        password: hashedPassword,
        avatar: photo,
        isVerified: true,
      });

      await newUser.save();
      user = newUser.toObject();
    }

    // Generate tokens using utility function
    const { access_token, refresh_token } = generateTokens(user._id.toString());

    // Pick only necessary fields
    const { username, email: userEmail, avatar } = user;

    res.status(200).json({
      status: "success",
      data: { username, email: userEmail, avatar },
      access_token,
      refresh_token,
    });
  } catch (error) {
    next(error);
  }
};


// Refresh Access Token API
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(401).json({
      status: "fail",
      message: "Refresh token required",
    });
  }

  try {
    const decoded = verifyRefreshToken(refresh_token);

    const newAccessToken = generateAccessToken(decoded.id);

    res.status(200).json({
      status: "success",
      access_token: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Invalid or expired refresh token",
    });
  }
};