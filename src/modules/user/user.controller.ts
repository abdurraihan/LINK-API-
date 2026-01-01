
import express, { Request, Response, NextFunction } from "express";
import bcryptjs from "bcrypt";
import User from "./user.model.js";
import { sendOTPEmail } from "../../utils/sendEmail.js";
import { generateOTP } from "../../utils/otp.js";
import { deleteFromS3ByUrl} from "../../utils/deleteFromS3.js";
//import { getSignedAvatarUrl } from "../../utils/getSignedAvatarUrl.js";
import {
    generateTokens,
    generateAccessToken,
    verifyRefreshToken
} from "../../utils/jwt.utils.js";


// User Auth API's start 


// Signup API with Email Verification
export const signup = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);


        const otp = generateOTP();


        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            otp,
        });

        await newUser.save();

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
        const user = await User.findOne({ email }).select('username email ');

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

        const { access_token, refresh_token } = generateTokens(user._id.toString());



        res.status(200).json({
            status: "success",
            data: user,
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
        let user = await User.findOne({ email }).select('username email');

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
        }

        const { access_token, refresh_token } = generateTokens(user._id.toString());

        res.status(200).json({
            status: "success",
            data: user,
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

// Change Password API
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ status: "fail", message: "All fields are required." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ status: "fail", message: "New password and confirm password do not match." });
    }

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ status: "fail", message: "User not found." });
        }

        const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return res.status(400).json({ status: "fail", message: "Old password is incorrect." });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();

        res.status(200).json({ status: "success", message: "Password updated successfully." });
    } catch (error) {
        next(error);
    }
};


//delete user         
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {

    const userID = req.userId

    if (!userID) {
        return res.status(400).json({ status: "fail", message: "invelide user" });
    }

    try {
        const user = await User.findByIdAndDelete(userID);
        if (!user) {
            res.status(404).json({ status: "fail", message: "user already deleted" })
        }
        res.status(200).json({ status: "success", data: user, message: "user has been deleted" });
    } catch (error) {
        next(error);
    }
};



//Request OTP for password reset
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;


        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }


        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email",
            });
        }

        const otp = generateOTP();


        user.otp = otp;
        await user.save();

        await sendOTPEmail(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to your email",
            data: {
                email: user.email,
            },
        });
    } catch (error: any) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message,
        });
    }
};

//Verify OTP
export const verifyResetOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required",
            });
        }

        const user = await User.findOne({ email, otp });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or email",
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            data: {
                email: user.email,
                verified: true,
            },
        });
    } catch (error: any) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify OTP",
            error: error.message,
        });
    }
};

//Reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword, confirmPassword } = req.body;


        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
            otp: otp,
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP or email",
            });
        }

        const hashedPassword = await bcryptjs.hash(newPassword, 10);


        user.password = hashedPassword;
        user.otp = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully",
            data: {
                email: user.email,
            },
        });
    } catch (error: any) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

//Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Generate new OTP
        const otp = generateOTP();

        user.otp = otp;
        await user.save();

        await sendOTPEmail(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP resent successfully",
            data: {
                email: user.email,
            },
        });
    } catch (error: any) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to resend OTP",
            error: error.message,
        });
    }
};



// get user profile 
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid user",
      });
    }

    const user = await User.findById(userId).select(
      "username email avatar"
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      data: {
        username: user.username,
        email: user.email,
        avatar: user.avatar, 
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Can't find user profile",
    });
  }
};

// update user profile 
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { username } = req.body;
    const file = req.file as any;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // update username
    if (username) {
      user.username = username;
    }

    // update avatar
    if (file) {
      // delete old avatar if it's not default
      if (user.avatar && !user.avatar.includes("pixabay")) {
        await deleteFromS3ByUrl(user.avatar);
      }

      // save public S3 URL
      user.avatar = file.location;
    }

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Profile updated",
      data: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
