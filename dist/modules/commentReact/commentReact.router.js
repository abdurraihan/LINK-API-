import { Router } from "express";
import { toggleCommentReaction, getUserCommentReaction, getCommentReactionStats, } from "./commentReact.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
const router = Router();
router.post("/toggle", verifyUser, toggleCommentReaction);
router.get("/user/:commentId", verifyUser, getUserCommentReaction);
router.get("/stats/:commentId", getCommentReactionStats);
export default router;
