import express from "express";
import { createHistory, getUserHistory, clearHistory } from "./history.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Create history entry for a watched video or short
router.post("/history", verifyUser, createHistory);

// Get a user’s history of watched videos/shorts
router.get("/history", verifyUser, getUserHistory);

// Clear user’s entire watch history
router.delete("/history", verifyUser, clearHistory);

export default router;
