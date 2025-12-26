import express from "express";
import {
    signup,
    verifyEmail,
    login,
    SocialLogin,
    refreshAccessToken,
    changePassword,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    resendOTP,
    deleteUser,
    getUserProfile,
      updateProfile
} from "./user.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
import { uploadAvatar } from "../../middlewares/uploadAvater.js";

const router = express.Router();


router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/social_login", SocialLogin);
router.post("/refresh_access_token", refreshAccessToken)
router.post("/change-password", verifyUser, changePassword);
router.delete("/delete-user",verifyUser,deleteUser)
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);

// user profile routs
router.get("/get-user-profile",verifyUser,getUserProfile);
router.patch(
  "/profile",
  verifyUser,
  uploadAvatar.single("avatar"),
  updateProfile
);

export default router;
