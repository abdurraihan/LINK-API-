import CommentReact from "./commentReact.model.js";
import Comment from "../comment/comment.model.js";
import mongoose from "mongoose";
// Toggle reaction on a comment
export const toggleCommentReaction = async (req, res) => {
    try {
        const { commentId, reactionType } = req.body;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        if (!["like", "dislike"].includes(reactionType)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid reaction type. Must be like or dislike",
            });
        }
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid comment ID",
            });
        }
        // Check if comment exists
        const comment = await Comment.findById(commentId);
        if (!comment || comment.isDeleted) {
            return res.status(404).json({
                status: "fail",
                message: "Comment not found",
            });
        }
        // Check if user already reacted
        const existingReaction = await CommentReact.findOne({
            user: userId,
            comment: commentId,
        });
        if (existingReaction) {
            // If same reaction, remove it (toggle off)
            if (existingReaction.reactionType === reactionType) {
                await CommentReact.deleteOne({ _id: existingReaction._id });
                // Update counts
                if (reactionType === "like") {
                    await Comment.findByIdAndUpdate(commentId, {
                        $inc: { likesCount: -1 },
                    });
                }
                else {
                    await Comment.findByIdAndUpdate(commentId, {
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
                existingReaction.reactionType = reactionType;
                await existingReaction.save();
                // Update counts (decrement old, increment new)
                if (reactionType === "like") {
                    await Comment.findByIdAndUpdate(commentId, {
                        $inc: { likesCount: 1, dislikesCount: -1 },
                    });
                }
                else {
                    await Comment.findByIdAndUpdate(commentId, {
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
        const newReaction = await CommentReact.create({
            user: userId,
            comment: commentId,
            reactionType,
        });
        // Update counts
        if (reactionType === "like") {
            await Comment.findByIdAndUpdate(commentId, {
                $inc: { likesCount: 1 },
            });
        }
        else {
            await Comment.findByIdAndUpdate(commentId, {
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
        console.error("Toggle comment reaction error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to toggle comment reaction",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
// Get user's reaction on a specific comment
export const getUserCommentReaction = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }
        const reaction = await CommentReact.findOne({
            user: userId,
            comment: commentId,
        });
        res.status(200).json({
            status: "success",
            data: { reaction },
        });
    }
    catch (error) {
        console.error("Get user comment reaction error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to get user comment reaction",
        });
    }
};
// Get reaction stats for a comment
export const getCommentReactionStats = async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid comment ID",
            });
        }
        const [likes, dislikes] = await Promise.all([
            CommentReact.countDocuments({ comment: commentId, reactionType: "like" }),
            CommentReact.countDocuments({
                comment: commentId,
                reactionType: "dislike",
            }),
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
        console.error("Get comment reaction stats error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to get comment reaction stats",
        });
    }
};
