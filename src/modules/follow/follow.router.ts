import express from "express";
import {
  toggleFollow,
  followChannel,
  getMyFollowedChannels,
  checkFollowStatus,
  toggleNotifications,
  getChannelFollowers,
} from "./follow.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";

const router = express.Router();



/**
 * @route   POST /api/follows/toggle/:channelId
 * @desc    Toggle follow/unfollow a channel (YouTube-style subscribe button)
 * @access  Private
 */
router.post("/toggle/:channelId", verifyUser, toggleFollow);

/**
 * @route   POST /api/follows/:channelId
 * @desc    Follow a specific channel
 * @access  Private
 */
router.post("/:channelId", verifyUser, followChannel);

/**
 * @route   GET /api/follows/my-subscriptions
 * @desc    Get all channels the authenticated user follows
 * @access  Private
 */
router.get("/my-subscriptions", verifyUser, getMyFollowedChannels);

/**
 * @route   GET /api/follows/check/:channelId
 * @desc    Check if user is following a specific channel
 * @access  Private
 */
router.get("/check/:channelId", verifyUser, checkFollowStatus);

/**
 * @route   PATCH /api/follows/notifications/:channelId
 * @desc    Toggle notification bell for a followed channel
 * @access  Private
 */
router.patch("/notifications/:channelId", verifyUser, toggleNotifications);

// Public routes

/**
 * @route   GET /api/follows/channel/:channelId/followers
 * @desc    Get all followers of a specific channel
 * @access  Public
 */
router.get("/channel/:channelId/followers", getChannelFollowers);

export default router;