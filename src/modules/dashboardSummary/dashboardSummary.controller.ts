import { Request, Response } from "express";
import User from "../user/user.model.js";
import Channel from "../channel/channel.model.js";
import Video from "../video/video.model.js";

/**
 * Dashboard Summary
 * total users + total channels
 */
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalChannels = await Channel.countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalChannels,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
    });
  }
};

/**
 * Top Trending Videos this is just for this mvp verson next we need to change and filter this api 
 */
export const getTopTrendingVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find({
      //isPublished: true,
      visibility: "public",
    })
      .sort({ totalViews: -1 })
      .limit(10)
      .populate("owner", "username avatar")
      .populate("channel", "channelName");

    return res.status(200).json({
      success: true,
      total: videos.length,
      data: videos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending videos",
    });
  }
};

/**
 * Admin View Video Details
 */
export const getVideoDetailsAdmin = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId)
      .populate("owner", "username email avatar")
      .populate("channel", "channelName channelIcon");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch video details",
    });
  }
};

/**
 * Admin Delete Video
 */
export const deleteVideoAdmin = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete video",
    });
  }
};