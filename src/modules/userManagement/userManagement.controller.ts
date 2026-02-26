import { Request, Response } from "express";
import User from "../../modules/user/user.model.js";
import Channel from "../../modules/channel/channel.model.js";
import mongoose from "mongoose";

// GET /admin/users?page=1&limit=10&type=all
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userType = req.query.type as string; // "creator" | "user" | "all"
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build match query
    const matchQuery: Record<string, any> = {};
    if (search) {
      matchQuery.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get all users with channel lookup (to determine if creator)
    const users = await User.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "channels",
          localField: "_id",
          foreignField: "owner",
          as: "channel",
        },
      },
      {
        $addFields: {
          userType: {
            $cond: {
              if: { $gt: [{ $size: "$channel" }, 0] },
              then: "Creator",
              else: "User",
            },
          },
          channel: { $arrayElemAt: ["$channel", 0] },
        },
      },
      // Filter by userType if provided
      ...(userType && userType !== "all"
        ? [{ $match: { userType: { $regex: userType, $options: "i" } } }]
        : []),
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          avatar: 1,
          isVerified: 1,
          isBanned: 1,
          userType: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await User.countDocuments(matchQuery);

    return res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// GET /admin/users/:userId
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-password -otp -refreshToken"
    );
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    // Check if user has a channel (is a creator)
    const channel = await Channel.findOne({ owner: userId });

    const userType = channel ? "Creator" : "User";

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          userId: `rpt_${String(user._id).slice(-3)}`, // display ID like in UI
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          isVerified: user.isVerified,
          isBanned: (user as any).isBanned || false,
          userType,
          joinedDate: user.createdAt,
        },
        channel: channel
          ? {
              channelName: channel.channelName,
              description: channel.description,
              channelIcon: channel.channelIcon,
              totalFollowers: channel.totalfollowers,
              totalViews: channel.totalViews,
              totalRevenue: channel.totalRevenue,
              totalWatchTime: channel.totalWatchTime,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// PATCH /admin/users/:userId/ban
export const banUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: "fail", message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("username isBanned");
    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const newBanState = !( user.isBanned === true);

    await User.findByIdAndUpdate(userId, {
      $set: { isBanned: newBanState },
    });

    const action = newBanState ? "banned" : "unbanned";

    return res.status(200).json({
      status: "success",
      message: `User has been ${action} successfully`,
      data: {
        userId,
        username: user.username,
        isBanned: newBanState,
      },
    });
  } catch (error) {
    console.error("banUser error:", error);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};