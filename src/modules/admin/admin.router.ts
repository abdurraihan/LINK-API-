import express from "express";
import { createAdmin, adminLogin, updateAdminProfile, adminForgotPassword, adminVerifyOTP, adminResetPassword, adminLogout , getAdminProfile } from "./admin.controller.js";
import { verifyAdmin } from "../../middlewares/auth.middleware.js"
import { uploadPublic } from "../../middlewares/uploadPublic.js"

const router = express.Router();

// Admin Registration Route
router.post("/register", createAdmin);

// Admin Login Route
router.post("/login", adminLogin);

// Admin Logout Route
router.post("/logout", verifyAdmin, adminLogout);

// GET PROFILE
router.get("/profile", verifyAdmin, getAdminProfile);
// Admin Profile Update Route (protected with verifyAdmin)
router.put(
  "/update-profile",
  verifyAdmin,
  uploadPublic.single("avatar"),  
  updateAdminProfile
);

// Admin Forgot Password Route
router.post("/forgot-password", adminForgotPassword);

// Admin Verify OTP Route
router.post("/verify-otp", adminVerifyOTP);

// Admin Reset Password Route
router.post("/reset-password", adminResetPassword);

export default router;
