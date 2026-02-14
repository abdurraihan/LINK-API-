import React from "../react/react.model.js";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";
import Post from "../post/post.model.js";
import mongoose from "mongoose";
// Toggle reaction (like/dislike) on video, short, or post
export const toggleReaction = async (req, res) => {
    try {
        const { targetType, targetId, reactionType } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        // Validate input
        if (!["Video", "Short", "Post"].includes(targetType)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid target type. Must be Video, Short, or Post",
            });
        }
        if (!["like", "dislike"].includes(reactionType)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid reaction type. Must be like or dislike",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid target ID",
            });
        }
        // Get the target model
        let TargetModel;
        switch (targetType) {
            case "Video":
                TargetModel = Video;
                break;
            case "Short":
                TargetModel = Short;
                break;
            case "Post":
                TargetModel = Post;
                break;
        }
        // Check if target exists
        const target = await TargetModel.findById(targetId);
        if (!target) {
            return res.status(404).json({
                status: "fail",
                message: `${targetType} not found`,
            });
        }
        // Check if user already reacted
        const existingReaction = await React.findOne({
            user: userId,
            targetType,
            targetId,
        });
        if (existingReaction) {
            // If same reaction, remove it (toggle off)
            if (existingReaction.reactionType === reactionType) {
                await React.deleteOne({ _id: existingReaction._id });
                // Update counts
                if (reactionType === "like") {
                    await TargetModel.findByIdAndUpdate(targetId, {
                        $inc: { likesCount: -1 },
                    });
                }
                else {
                    await TargetModel.findByIdAndUpdate(targetId, {
                        $inc: { dislikesCount: -1 },
                    });
                }
                return res.status(200).json({
                    status: "success",
                    message: "Reaction removed",
                    data: { reaction: null },
                });
            }
            else {
                // Change reaction type
                const oldReactionType = existingReaction.reactionType;
                existingReaction.reactionType = reactionType;
                await existingReaction.save();
                // Update counts (decrement old, increment new)
                if (reactionType === "like") {
                    await TargetModel.findByIdAndUpdate(targetId, {
                        $inc: { likesCount: 1, dislikesCount: -1 },
                    });
                }
                else {
                    await TargetModel.findByIdAndUpdate(targetId, {
                        $inc: { likesCount: -1, dislikesCount: 1 },
                    });
                }
                return res.status(200).json({
                    status: "success",
                    message: "Reaction updated",
                    data: { reaction: existingReaction },
                });
            }
        }
        // Create new reaction
        const newReaction = await React.create({
            user: userId,
            targetType,
            targetId,
            reactionType,
        });
        // Update counts
        if (reactionType === "like") {
            await TargetModel.findByIdAndUpdate(targetId, {
                $inc: { likesCount: 1 },
            });
        }
        else {
            await TargetModel.findByIdAndUpdate(targetId, {
                $inc: { dislikesCount: 1 },
            });
        }
        res.status(201).json({
            status: "success",
            message: "Reaction added",
            data: { reaction: newReaction },
        });
    }
    catch (error) {
        console.error("Toggle reaction error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to toggle reaction",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
// Get user's reaction on a specific target
export const getUserReaction = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        const reaction = await React.findOne({
            user: userId,
            targetType,
            targetId,
        });
        res.status(200).json({
            status: "success",
            data: { reaction },
        });
    }
    catch (error) {
        console.error("Get user reaction error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to get user reaction",
        });
    }
};
// Get reaction stats for a target
export const getReactionStats = async (req, res) => {
    try {
        const { targetType, targetId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid target ID",
            });
        }
        const [likes, dislikes] = await Promise.all([
            React.countDocuments({ targetType, targetId, reactionType: "like" }),
            React.countDocuments({ targetType, targetId, reactionType: "dislike" }),
        ]);
        res.status(200).json({
            status: "success",
            data: {
                likesCount: likes,
                dislikesCount: dislikes,
            },
        });
    }
    catch (error) {
        console.error("Get reaction stats error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to get reaction stats",
        });
    }
};
