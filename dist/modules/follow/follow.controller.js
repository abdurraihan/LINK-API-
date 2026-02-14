import Follow from "./follow.model.js";
import Channel from "../channel/channel.model.js";
import mongoose from "mongoose";
export const toggleFollow = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        // Validate channelId format
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid channel ID format",
            });
        }
        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                status: "fail",
                message: "Channel not found",
            });
        }
        // Prevent users from following their own channel
        if (channel.owner.toString() === userId.toString()) {
            return res.status(400).json({
                status: "fail",
                message: "You cannot follow your own channel",
            });
        }
        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: userId,
            channel: channelId,
        });
        if (existingFollow) {
            // Unfollow: Remove the follow record
            await Follow.findByIdAndDelete(existingFollow._id);
            // Decrement channel's total followers
            await Channel.findByIdAndUpdate(channelId, {
                $inc: { totalfollowers: -1 },
            });
            return res.status(200).json({
                status: "success",
                message: "Successfully unfollowed the channel",
                data: {
                    action: "unfollowed",
                    isFollowing: false,
                },
            });
        }
        else {
            // Follow: Create new follow record
            await Follow.create({
                follower: userId,
                channel: channelId,
                notificationsEnabled: true,
            });
            // Increment channel's total followers
            await Channel.findByIdAndUpdate(channelId, {
                $inc: { totalfollowers: 1 },
            });
            return res.status(201).json({
                status: "success",
                message: "Successfully followed the channel",
                data: {
                    action: "followed",
                    isFollowing: true,
                },
            });
        }
    }
    catch (error) {
        console.error("Toggle follow error:", error);
        // Handle duplicate key error (in case of race condition)
        if (error.code === 11000) {
            return res.status(400).json({
                status: "fail",
                message: "Already following this channel",
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Server error while processing follow action",
            error: error.message,
        });
    }
};
export const followChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        // Validate channelId format
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid channel ID format",
            });
        }
        // Check if channel exists
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                status: "fail",
                message: "Channel not found",
            });
        }
        // Prevent users from following their own channel
        if (channel.owner.toString() === userId.toString()) {
            return res.status(400).json({
                status: "fail",
                message: "You cannot follow your own channel",
            });
        }
        // Check if already following
        const existingFollow = await Follow.findOne({
            follower: userId,
            channel: channelId,
        });
        if (existingFollow) {
            return res.status(400).json({
                status: "fail",
                message: "You are already following this channel",
            });
        }
        // Create follow record
        const follow = await Follow.create({
            follower: userId,
            channel: channelId,
            notificationsEnabled: true,
        });
        // Increment channel's total followers
        await Channel.findByIdAndUpdate(channelId, {
            $inc: { totalfollowers: 1 },
        });
        return res.status(201).json({
            status: "success",
            message: "Successfully followed the channel",
            data: {
                followId: follow._id,
                channelId: channel._id,
                channelName: channel.channelName,
                notificationsEnabled: follow.notificationsEnabled,
            },
        });
    }
    catch (error) {
        console.error("Follow channel error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                status: "fail",
                message: "Already following this channel",
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Server error while following channel",
            error: error.message,
        });
    }
};
// for user 
export const getMyFollowedChannels = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, sortBy = "createdAt" } = req.query;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get followed channels with pagination
        const follows = await Follow.find({ follower: userId })
            .sort({ [sortBy]: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
            path: "channel",
            select: "channelName channelIcon description totalfollowers totalViews owner",
            populate: {
                path: "owner",
                select: "username email",
            },
        })
            .lean();
        // Get total count for pagination
        const totalFollows = await Follow.countDocuments({ follower: userId });
        // Format the response
        const followedChannels = follows.map((follow) => ({
            followId: follow._id,
            followedAt: follow.createdAt,
            notificationsEnabled: follow.notificationsEnabled,
            channel: {
                _id: follow.channel._id,
                channelName: follow.channel.channelName,
                channelIcon: follow.channel.channelIcon,
                description: follow.channel.description,
                totalfollowers: follow.channel.totalfollowers,
                totalViews: follow.channel.totalViews,
                owner: {
                    _id: follow.channel.owner._id,
                    username: follow.channel.owner.username,
                },
            },
        }));
        return res.status(200).json({
            status: "success",
            message: "Successfully retrieved followed channels",
            data: {
                subscriptions: followedChannels,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalFollows / limitNum),
                    totalSubscriptions: totalFollows,
                    hasNextPage: pageNum * limitNum < totalFollows,
                    hasPrevPage: pageNum > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get followed channels error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error while fetching followed channels",
            error: error.message,
        });
    }
};
// Get channels the user is NOT following (for discovery/recommendations)
export const getUnfollowedChannels = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, sortBy = "totalfollowers" } = req.query;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Get all channel IDs that the user is already following
        const followedChannelIds = await Follow.find({ follower: userId })
            .distinct("channel");
        // Get all channels owned by the user
        const userOwnedChannels = await Channel.find({ owner: userId })
            .distinct("_id");
        // Combine followed channels and user's own channels to exclude
        const excludedChannelIds = [
            ...followedChannelIds,
            ...userOwnedChannels,
        ];
        // Build sort object
        let sortObject = {};
        if (sortBy === "totalfollowers") {
            sortObject = { totalfollowers: -1 };
        }
        else if (sortBy === "totalViews") {
            sortObject = { totalViews: -1 };
        }
        else if (sortBy === "createdAt") {
            sortObject = { createdAt: -1 };
        }
        else {
            sortObject = { totalfollowers: -1 }; // default
        }
        // Find channels that user is NOT following and doesn't own
        const unfollowedChannels = await Channel.find({
            _id: { $nin: excludedChannelIds },
            owner: { $ne: null }, // Ensure owner exists
        })
            .sort(sortObject)
            .skip(skip)
            .limit(limitNum)
            .populate({
            path: "owner",
            select: "username avatar email",
        })
            .select("channelName channelIcon description totalfollowers totalViews createdAt owner")
            .lean();
        // Get total count for pagination
        const totalUnfollowedChannels = await Channel.countDocuments({
            _id: { $nin: excludedChannelIds },
            owner: { $ne: null },
        });
        // Format the response with null safety
        const formattedChannels = unfollowedChannels
            .filter((channel) => channel.owner) // Filter out channels with null owners
            .map((channel) => ({
            _id: channel._id,
            channelName: channel.channelName || "Unknown Channel",
            channelIcon: channel.channelIcon || null,
            description: channel.description || "",
            totalfollowers: channel.totalfollowers || 0,
            totalViews: channel.totalViews || 0,
            createdAt: channel.createdAt,
            owner: {
                _id: channel.owner._id,
                username: channel.owner.username || "Unknown User",
                avatar: channel.owner.avatar || null,
            },
        }));
        return res.status(200).json({
            status: "success",
            message: "Successfully retrieved unfollowed channels",
            data: {
                channels: formattedChannels,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalUnfollowedChannels / limitNum),
                    totalChannels: totalUnfollowedChannels,
                    hasNextPage: pageNum * limitNum < totalUnfollowedChannels,
                    hasPrevPage: pageNum > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get unfollowed channels error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error while fetching unfollowed channels",
            error: error.message,
        });
    }
};
export const checkFollowStatus = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid channel ID format",
            });
        }
        const follow = await Follow.findOne({
            follower: userId,
            channel: channelId,
        });
        return res.status(200).json({
            status: "success",
            data: {
                isFollowing: !!follow,
                notificationsEnabled: follow?.notificationsEnabled || false,
                followedAt: follow?.createdAt || null,
            },
        });
    }
    catch (error) {
        console.error("Check follow status error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error while checking follow status",
            error: error.message,
        });
    }
};
export const toggleNotifications = async (req, res) => {
    try {
        const { channelId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid channel ID format",
            });
        }
        const follow = await Follow.findOne({
            follower: userId,
            channel: channelId,
        });
        if (!follow) {
            return res.status(404).json({
                status: "fail",
                message: "You are not following this channel",
            });
        }
        // Toggle notifications
        follow.notificationsEnabled = !follow.notificationsEnabled;
        await follow.save();
        return res.status(200).json({
            status: "success",
            message: `Notifications ${follow.notificationsEnabled ? "enabled" : "disabled"}`,
            data: {
                notificationsEnabled: follow.notificationsEnabled,
            },
        });
    }
    catch (error) {
        console.error("Toggle notifications error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error while toggling notifications",
            error: error.message,
        });
    }
};
// for channel 
export const getChannelFollowers = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid channel ID format",
            });
        }
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({
                status: "fail",
                message: "Channel not found",
            });
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const followers = await Follow.find({ channel: channelId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate({
            path: "follower",
            select: "username avatar email",
        })
            .lean();
        const totalFollowers = await Follow.countDocuments({ channel: channelId });
        return res.status(200).json({
            status: "success",
            message: "Successfully retrieved channel followers",
            data: {
                followers: followers.map((f) => ({
                    _id: f.follower._id,
                    username: f.follower.username,
                    avatar: f.follower.avatar,
                    followedAt: f.createdAt,
                })),
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalFollowers / limitNum),
                    totalFollowers: totalFollowers,
                    hasNextPage: pageNum * limitNum < totalFollowers,
                    hasPrevPage: pageNum > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get channel followers error:", error);
        return res.status(500).json({
            status: "error",
            message: "Server error while fetching channel followers",
            error: error.message,
        });
    }
};
