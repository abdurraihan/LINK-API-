import { Request, Response } from "express";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";
import Post from "../post/post.model.js";

/**
 * GET ALL CONTENT (VIDEO + SHORTS + POSTS)
 */
// export const getAllContent = async (req: Request, res: Response) => {
//   try {
//     const { page = 1, limit = 10, type } = req.query;

//     const skip = (Number(page) - 1) * Number(limit);

//     let data: any[] = [];

//     // Filter by type if needed
//     if (type === "video") {
//       data = await Video.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit));
//     } else if (type === "short") {
//       data = await Short.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit));
//     } else if (type === "post") {
//       data = await Post.find()
//         .populate("channel", "name")
//         .select("_id description createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit));
//     } else {
//       const videos = await Video.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel");

//       const shorts = await Short.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel");

//       const posts = await Post.find()
//         .populate("channel", "name")
//         .select("_id description createdAt channel");

//       data = [
//         ...videos.map((v) => ({ ...v.toObject(), type: "video" })),
//         ...shorts.map((s) => ({ ...s.toObject(), type: "short" })),
//         ...posts.map((p) => ({ ...p.toObject(), type: "post" })),
//       ];

//       data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
//     }

//     res.status(200).json({
//       status: "success",
//       total: data.length,
//       data,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: "Failed to fetch content",
//     });
//   }
// };


// export const getAllContent = async (req: Request, res: Response) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const type = req.query.type;

//     const skip = (page - 1) * limit;

//     let content: any[] = [];

//     // Filter by content type
//     if (type === "video") {
//       const total = await Video.countDocuments();

//       const videos = await Video.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit);

//       return res.status(200).json({
//         status: "success",
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         data: videos,
//       });
//     }

//     if (type === "short") {
//       const total = await Short.countDocuments();

//       const shorts = await Short.find()
//         .populate("channel", "name")
//         .select("_id title createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit);

//       return res.status(200).json({
//         status: "success",
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         data: shorts,
//       });
//     }

//     if (type === "post") {
//       const total = await Post.countDocuments();

//       const posts = await Post.find()
//         .populate("channel", "name")
//         .select("_id description createdAt channel")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit);

//       return res.status(200).json({
//         status: "success",
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         data: posts,
//       });
//     }

//     /**
//      * All content (Video + Shorts + Posts)
//      */
//     const [videos, shorts, posts] = await Promise.all([
//       Video.find().populate("channel", "name"),
//       Short.find().populate("channel", "name"),
//       Post.find().populate("channel", "name"),
//     ]);

//     const merged = [
//       ...videos.map((v) => ({
//         type: "video",
//         _id: v._id,
//         title: v.title,
//         channel: v.channel,
//         createdAt: v.createdAt,
//       })),
//       ...shorts.map((s) => ({
//         type: "short",
//         _id: s._id,
//         title: s.title,
//         channel: s.channel,
//         createdAt: s.createdAt,
//       })),
//       ...posts.map((p) => ({
//         type: "post",
//         _id: p._id,
//         title: p.description || "Post",
//         channel: p.channel,
//         createdAt: p.createdAt,
//       })),
//     ];

//     // Sort newest first
//     merged.sort(
//       (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//     );

//     const paginated = merged.slice(skip, skip + limit);

//     res.status(200).json({
//       status: "success",
//       page,
//       limit,
//       total: merged.length,
//       totalPages: Math.ceil(merged.length / limit),
//       data: paginated,
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: "Failed to fetch contents",
//     });
//   }
// };


export const getAllContent = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const type = req.query.type; // video | short | post | all

    const skip = (page - 1) * limit;

    /**
     * If admin filters by type
     */
    if (type === "video") {
      const total = await Video.countDocuments();

      const videos = await Video.find()
        .populate({
          path: "channel",
          select: "channelName name title", // covers different schema possibilities
        })
        .select("_id title createdAt channel")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formatted = videos.map((v: any) => ({
        _id: v._id,
        type: "video",
        title: v.title,
        creatorName:
          v.channel?.channelName ||
          v.channel?.name ||
          v.channel?.title ||
          "Unknown",
        uploadedDate: v.createdAt,
      }));

      return res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: formatted,
      });
    }

    if (type === "short") {
      const total = await Short.countDocuments();

      const shorts = await Short.find()
        .populate({
          path: "channel",
          select: "channelName name title",
        })
        .select("_id title createdAt channel")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formatted = shorts.map((s: any) => ({
        _id: s._id,
        type: "short",
        title: s.title,
        creatorName:
          s.channel?.channelName ||
          s.channel?.name ||
          s.channel?.title ||
          "Unknown",
        uploadedDate: s.createdAt,
      }));

      return res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: formatted,
      });
    }

    if (type === "post") {
      const total = await Post.countDocuments();

      const posts = await Post.find()
        .populate({
          path: "channel",
          select: "channelName name title",
        })
        .select("_id description createdAt channel")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formatted = posts.map((p: any) => ({
        _id: p._id,
        type: "post",
        title: p.description || "Post",
        creatorName:
          p.channel?.channelName ||
          p.channel?.name ||
          p.channel?.title ||
          "Unknown",
        uploadedDate: p.createdAt,
      }));

      return res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: formatted,
      });
    }

    /**
     * ALL CONTENT (Video + Short + Post)
     */

    const [videos, shorts, posts] = await Promise.all([
      Video.find()
        .populate({
          path: "channel",
          select: "channelName name title",
        })
        .select("_id title createdAt channel"),

      Short.find()
        .populate({
          path: "channel",
          select: "channelName name title",
        })
        .select("_id title createdAt channel"),

      Post.find()
        .populate({
          path: "channel",
          select: "channelName name title",
        })
        .select("_id description createdAt channel"),
    ]);

    const merged = [
      ...videos.map((v: any) => ({
        _id: v._id,
        type: "video",
        title: v.title,
        creatorName:
          v.channel?.channelName ||
          v.channel?.name ||
          v.channel?.title ||
          "Unknown",
        uploadedDate: v.createdAt,
      })),

      ...shorts.map((s: any) => ({
        _id: s._id,
        type: "short",
        title: s.title,
        creatorName:
          s.channel?.channelName ||
          s.channel?.name ||
          s.channel?.title ||
          "Unknown",
        uploadedDate: s.createdAt,
      })),

      ...posts.map((p: any) => ({
        _id: p._id,
        type: "post",
        title: p.description || "Post",
        creatorName:
          p.channel?.channelName ||
          p.channel?.name ||
          p.channel?.title ||
          "Unknown",
        uploadedDate: p.createdAt,
      })),
    ];

    // Sort newest first
    merged.sort(
      (a, b) =>
        new Date(b.uploadedDate).getTime() -
        new Date(a.uploadedDate).getTime()
    );

    const total = merged.length;
    const paginatedData = merged.slice(skip, skip + limit);

    res.status(200).json({
      status: "success",
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: paginatedData,
    });
  } catch (error) {
    console.error("Admin Get Contents Error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to fetch contents",
    });
  }
};
/**
 * GET CONTENT DETAILS
 */
export const getContentDetails = async (req: Request, res: Response) => {
  try {
    const { contentId, type } = req.params;

    let content: any = null;

    if (type === "video") {
      content = await Video.findById(contentId)
        .populate("owner", "username email")
        .populate("channel", "name");
    }

    if (type === "short") {
      content = await Short.findById(contentId)
        .populate("owner", "username email")
        .populate("channel", "name");
    }

    if (type === "post") {
      content = await Post.findById(contentId)
        .populate("owner", "username email")
        .populate("channel", "name");
    }

    if (!content) {
      return res.status(404).json({
        status: "fail",
        message: "Content not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: content,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch content details",
    });
  }
};

/**
 * DELETE CONTENT
 */
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { contentId, type } = req.params;

    let deleted;

    if (type === "video") {
      deleted = await Video.findByIdAndDelete(contentId);
    }

    if (type === "short") {
      deleted = await Short.findByIdAndDelete(contentId);
    }

    if (type === "post") {
      deleted = await Post.findByIdAndDelete(contentId);
    }

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Content not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Content deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete content",
    });
  }
};