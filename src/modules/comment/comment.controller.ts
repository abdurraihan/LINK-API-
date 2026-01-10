import { Request, Response } from "express";
import Comment from "../comment/comment.model.js";
import CommentReact from "../commentReact/commentReact.model.js";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";
import Post from "../post/post.model.js";
import mongoose from "mongoose";

// Create a comment or reply
export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, targetType, targetId, parentCommentId } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "User not authenticated",
      });
    }

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Comment content is required",
      });
    }

    if (!["Video", "Short", "Post"].includes(targetType)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid target type",
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

    const isReply = !!parentCommentId;

    // If it's a reply, validate parent comment
    if (isReply) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid parent comment ID",
        });
      }

      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          status: "fail",
          message: "Parent comment not found",
        });
      }

      // Ensure parent comment belongs to the same target
      if (
        parentComment.targetId.toString() !== targetId ||
        parentComment.targetType !== targetType
      ) {
        return res.status(400).json({
          status: "fail",
          message: "Parent comment does not belong to this target",
        });
      }
    }

    // Create comment
    const comment = await Comment.create({
      content: content.trim(),
      user: userId,
      channel: target.channel,
      targetType,
      targetId,
      parentComment: parentCommentId || null,
      isReply,
    });

    // Update target's comment count
    await TargetModel.findByIdAndUpdate(targetId, {
      $inc: { commentsCount: 1 },
    });

    // If it's a reply, update parent comment's reply count
    if (isReply) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { repliesCount: 1 },
      });
    }

    // Populate user data
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "username avatar")
      .populate("channel", "name avatar");

    res.status(201).json({
      status: "success",
      message: "Comment created successfully",
      data: { comment: populatedComment },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create comment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get comments for a target (with pagination)
export const getComments = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid target ID",
      });
    }

    // Get top-level comments (not replies)
    const comments = await Comment.find({
      targetType,
      targetId,
      isReply: false,
      isDeleted: false,
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username avatar")
      .populate("channel", "name avatar");

    const total = await Comment.countDocuments({
      targetType,
      targetId,
      isReply: false,
      isDeleted: false,
    });

    res.status(200).json({
      status: "success",
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get comments",
    });
  }
};

// Get replies for a comment
export const getReplies = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid comment ID",
      });
    }

    const replies = await Comment.find({
      parentComment: commentId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username avatar")
      .populate("channel", "name avatar");

    const total = await Comment.countDocuments({
      parentComment: commentId,
      isDeleted: false,
    });

    res.status(200).json({
      status: "success",
      data: {
        replies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get replies error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get replies",
    });
  }
};

// Update comment
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "User not authenticated",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Comment content is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You can only edit your own comments",
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
      .populate("user", "username avatar")
      .populate("channel", "name avatar");

    res.status(200).json({
      status: "success",
      message: "Comment updated successfully",
      data: { comment: updatedComment },
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update comment",
    });
  }
};

// Delete comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid comment ID",
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "fail",
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You can only delete your own comments",
      });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = "[deleted]";
    await comment.save();

    // Get the target model
    let TargetModel;
    switch (comment.targetType) {
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

    // Update target's comment count
    await TargetModel.findByIdAndUpdate(comment.targetId, {
      $inc: { commentsCount: -1 },
    });

    // If it's a reply, update parent comment's reply count
    if (comment.isReply && comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { repliesCount: -1 },
      });
    }

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete comment",
    });
  }
};