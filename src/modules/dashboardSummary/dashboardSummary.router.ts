import express from "express";
import {
  getDashboardSummary,
  getTopTrendingVideos,
  getVideoDetailsAdmin,
  deleteVideoAdmin,
} from "../dashboardSummary/dashboardSummary.controller.js";

const router = express.Router();

/**
 * Dashboard
 */
router.get("/", getDashboardSummary);

/**
 * Top Trending Videos
 */
router.get("/top-trending-videos", getTopTrendingVideos);

/**
 * View Video Details
 */
router.get("/video/:videoId", getVideoDetailsAdmin);

/**
 * Delete Video
 */
router.delete("/video/:videoId", deleteVideoAdmin);

export default router;