import { Router } from "express";
import { toggleCommentReaction, getUserCommentReaction, getCommentReactionStats, } from "./commentReact.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
const router = Router();
// Toggle reaction on a comment
// Body: { commentId: string, reactionType: "like" | "dislike" }
router.post("/toggle", verifyUser, toggleCommentReaction);
// Get user's reaction on a specific comment
// Params: commentId
router.get("/user/:commentId", verifyUser, getUserCommentReaction);
// Get reaction stats for a comment
// Params: commentId
router.get("/stats/:commentId", getCommentReactionStats);
export default router;
