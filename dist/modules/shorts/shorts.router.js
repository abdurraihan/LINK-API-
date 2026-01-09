import express from "express";
import { createShort, getAllShorts, getShortById, incrementShortViewCount, getShortsByChannel, updateShort, deleteShort, publishShort, getTrendingShorts, checkShortTranscodingStatus, } from "./shorts.controller.js";
import { verifyUser, verifyUserOptional } from "../../middlewares/auth.middleware.js";
import { uploadShortVideo } from "../../middlewares/uploadShortsVideo.js";
const router = express.Router();
// Create short (upload video only, no thumbnail)
router.post("/create", verifyUser, (req, res, next) => {
    const upload = uploadShortVideo.single("video");
    upload(req, res, (err) => {
        if (err) {
            console.error("Upload error:", err);
            return res.status(400).json({
                status: "fail",
                message: err.message || "File upload failed",
                error: err.toString(),
            });
        }
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "Video file is required",
            });
        }
        console.log("Video uploaded successfully:", {
            video: req.file.key,
        });
        next();
    });
}, createShort);
// Get all shorts with pagination and filters
router.get("/all", verifyUserOptional, getAllShorts);
// Get trending shorts
router.get("/trending", verifyUserOptional, getTrendingShorts);
// Check transcoding status
router.get("/:shortId/status", verifyUser, checkShortTranscodingStatus);
// Increment view count
router.post("/:shortId/view", incrementShortViewCount);
// Publish short
router.post("/:shortId/publish", verifyUser, publishShort);
// Get short by ID
router.get("/:shortId", verifyUserOptional, getShortById);
// Get shorts by channel
router.get("/channel/:channelId", verifyUserOptional, getShortsByChannel);
// Update short
router.patch("/:shortId", verifyUser, updateShort);
// Delete short
router.delete("/:shortId", verifyUser, deleteShort);
export default router;
