import { Request, Response } from "express";
import History from "./history.model.js";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";

export const createHistoryV1 = async (req: Request, res: Response) => {
  try {
    const { videoId, shortId } = req.body; // Either videoId or shortId should be provided

    if (!videoId && !shortId) {
      return res.status(400).json({
        status: "fail",
        message: "Either videoId or shortId is required.",
      });
    }

    const historyData = {
      user: req.userId,
      video: videoId ? videoId : undefined,
      short: shortId ? shortId : undefined,
    };

    const history = new History(historyData);
    await history.save();

    return res.status(201).json({
      status: "success",
      message: "History entry created successfully",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

export const createHistory = async (req: Request, res: Response) => {
  try {
    const { videoId, shortId } = req.body; // Either videoId or shortId should be provided

    if (!videoId && !shortId) {
      return res.status(400).json({
        status: "fail",
        message: "Either videoId or shortId is required.",
      });
    }

    let video = null;
    let short = null;

    // Check if the videoId exists in the Video collection
    if (videoId) {
      video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({
          status: "fail",
          message: `Video with id ${videoId} not found.`,
        });
      }
    }

    // Check if the shortId exists in the Short collection
    if (shortId) {
      short = await Short.findById(shortId);
      if (!short) {
        return res.status(404).json({
          status: "fail",
          message: `Short with id ${shortId} not found.`,
        });
      }
    }

    const historyData = {
      user: req.userId,
      video: video ? video._id : undefined,
      short: short ? short._id : undefined,
    };

    const history = new History(historyData);
    await history.save();

    return res.status(201).json({
      status: "success",
      message: "History entry created successfully",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};


export const getUserHistoryv1 = async (req: Request, res: Response) => {
  try {
    const history = await History.find({ user: req.userId }).sort({ watchedAt: -1 });

    if (!history.length) {
      return res.status(404).json({
        status: "fail",
        message: "No history found for this user.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

export const getUserHistory = async (req: Request, res: Response) => {
  try {
    // Populate video and short details in the history entry
    const history = await History.find({ user: req.userId })
      .sort({ watchedAt: -1 })
      .populate("video")  // Populate video field with the full video details
      .populate("short"); // Populate short field with the full short details

    // If no history found, return a 404 error
    if (!history.length) {
      return res.status(404).json({
        status: "fail",
        message: "No history found for this user.",
      });
    }

    // Return the full history with populated video and short details
    return res.status(200).json({
      status: "success",
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

export const clearHistory = async (req: Request, res: Response) => {
  try {
    await History.deleteMany({ user: req.userId });

    return res.status(200).json({
      status: "success",
      message: "History cleared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
