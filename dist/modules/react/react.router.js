import { Router } from "express";
import { toggleReaction, getUserReaction, getReactionStats, } from "../react/react.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
const router = Router();
router.post("/toggle", verifyUser, toggleReaction);
router.get("/user/:targetType/:targetId", verifyUser, getUserReaction);
router.get("/stats/:targetType/:targetId", getReactionStats);
export default router;
