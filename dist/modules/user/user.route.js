// user.router.ts
import express from "express";
import { signup, verifyEmail, login, SocialLogin, refreshAccessToken } from "./user.controller.js"; // Update path as per your structure
const router = express.Router();
// User Routes
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/social_login", SocialLogin);
router.post("/refresh_access_token", refreshAccessToken);
export default router;
