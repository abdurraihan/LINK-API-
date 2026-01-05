import { Request, Response } from "express";
import Video from "../../modules/video/video.model.js";
import Channel from "../../modules/channel/channel.model.js";
import { createTranscodeJob, getJobStatus } from "../../services/mediaConvert.service.js";

import { S3_OUTPUT_BUCKET } from "../../config/config.js";
import mongoose from "mongoose";


export const createVideo = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      hashtags,
      links,
      channelId,
      category,
      language,
      visibility,
    } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "User not authenticated",
      });
    }

    const channel = await Channel.findOne({ _id: channelId, owner: userId });
    if (!channel) {
      return res.status(403).json({
        status: "fail",
        message: "Channel not found or you don't own this channel",
      });
    }

    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

    if (!files || !files.video || !files.thumbnail) {
      return res.status(400).json({
        status: "fail",
        message: "Both video and thumbnail are required",
      });
    }

    const videoFile = files.video[0] as Express.MulterS3.File;
    const thumbnailFile = files.thumbnail[0] as Express.MulterS3.File;

    let hashtagArray: string[] = [];
    if (hashtags) {
      try {
        hashtagArray = JSON.parse(hashtags);
        hashtagArray = hashtagArray.map((tag) =>
          tag.startsWith("#") ? tag : `#${tag}`
        );
      } catch (error) {
        hashtagArray = [];
      }
    }

    let linksArray: string[] = [];
    if (links) {
      try {
        linksArray = JSON.parse(links);
      } catch (error) {
        linksArray = [];
      }
    }

    const outputKeyPrefix = `videos/${userId}/${Date.now()}`;
    const transcodeJob = await createTranscodeJob({
      inputKey: videoFile.key,
      outputKeyPrefix,
    });

    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      thumbnail: thumbnailFile.location,
     videoUrl: `https://${S3_OUTPUT_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${outputKeyPrefix}/index.m3u8`,
      hashtags: hashtagArray,
      links: linksArray,
      owner: userId,
      channel: channelId,
      duration: 0,
      category: category ? category.trim() : "",
      language: language ? language.trim() : "en",
      visibility: visibility ? visibility.trim().toLowerCase() : "public",
      isPublished: false,
      transcodeJobId: transcodeJob.jobId,
      transcodeStatus: "PROGRESSING",
    });

    return res.status(201).json({
      status: "success",
      message: "Video upload initiated. Transcoding in progress...",
      data: {
        videoId: video._id,
        transcodeJobId: transcodeJob.jobId,
        video,
      },
    });
  } catch (error) {
    console.error("Create video error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create video",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};



export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(videoId)
      .populate("channel", "channelName channelIcon totalfollowers description")
      .populate("owner", "username avatar");

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    if (video.visibility === "private" && video.owner._id.toString() !== req.userId) {
      return res.status(403).json({
        status: "fail",
        message: "This video is private",
      });
    }

    const isOwner = video.owner._id.toString() === req.userId;

    // let streamingUrls = null;
    // if ( video.transcodeStatus === "COMPLETE") {     //if ((video.isPublished || isOwner) && video.transcodeStatus === "COMPLETE")
    //   try {
    //     streamingUrls = await generateVideoStreamingUrls(video.videoUrl);
    //   } catch (error) {
    //     console.error("Error generating streaming URLs:", error);
    //     streamingUrls = {
    //       error: "Video is still processing or files not yet available",
    //       message: "Please try again in a few minutes",
    //     };
    //   }
    // }

    const videoData = video.toObject();

return res.status(200).json({
  status: "success",
  data: {
    video: {
      ...videoData,
      streamingUrl:
        video.transcodeStatus === "COMPLETE"
          ? video.videoUrl
          : null,
    },
  },
});

  } catch (error) {
    console.error("Get video by ID error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch video",
    });
  }
};

export const checkTranscodingStatus = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    if (video.owner.toString() !== req.userId) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to view this",
      });
    }

    if (!video.transcodeJobId) {
      return res.status(400).json({
        status: "fail",
        message: "No transcoding job found for this video",
      });
    }

    const jobStatus = await getJobStatus(video.transcodeJobId);
    console.log(jobStatus)

    video.transcodeStatus = jobStatus.status as any;
    await video.save();

    return res.status(200).json({
      status: "success",
      data: {
        videoId: video._id,
        transcodeStatus: jobStatus.status,
        progress: jobStatus.progress,
        isComplete: jobStatus.status === "COMPLETE",
        message:
          jobStatus.status === "COMPLETE"
            ? "Video is ready to stream"
            : `Transcoding in progress: ${jobStatus.progress}%`,
      },
    });
  } catch (error) {
    console.error("Check transcoding status error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to check transcoding status",
    });
  }
};



export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { category, search, sortBy = "createdAt" } = req.query;

    const query: any = { visibility: "public" }; //isPublished: true,

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { hashtags: { $regex: search, $options: "i" } },
      ];
    }

    let sort: any = {};
    switch (sortBy) {
      case "views":
        sort = { totalViews: -1 };
        break;
      case "likes":
        sort = { likesCount: -1 };
        break;
      case "recent":
        sort = { publishedAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const videos = await Video.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("channel", "channelName channelIcon totalfollowers")
      .populate("owner", "username avatar")
      .select("-__v");

    const total = await Video.countDocuments(query);

    return res.status(200).json({
      status: "success",
      data: {
        videos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalVideos: total,
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error("Get all videos error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch videos",
    });
  }
};



export const incrementViewCount = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      { $inc: { totalViews: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    await Channel.findByIdAndUpdate(video.channel, {
      $inc: { totalViews: 1 },
    });

    return res.status(200).json({
      status: "success",
      message: "View count incremented",
      data: { totalViews: video.totalViews },
    });
  } catch (error) {
    console.error("Increment view count error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to increment view count",
    });
  }
};


export const getVideosByChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid channel ID",
      });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        status: "fail",
        message: "Channel not found",
      });
    }

    const query: any = { channel: channelId };

    if (channel.owner.toString() !== req.userId) {
     // query.isPublished = true;
      query.visibility = "public";
    }

    const videos = await Video.find(query) 
    .sort({ publishedAt: -1 })  
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const total = await Video.countDocuments(query);

    return res.status(200).json({
      status: "success",
      data: {
        videos,
        channel: {
          channelName: channel.channelName,
          channelIcon: channel.channelIcon,
          totalfollowers: channel.totalfollowers,
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalVideos: total,
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error("Get videos by channel error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch channel videos",
    });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { title, description, hashtags, links, category, visibility } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    if (video.owner.toString() !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to update this video",
      });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (visibility) video.visibility = visibility;

    if (hashtags) {
      try {
        let hashtagArray = JSON.parse(hashtags);
        hashtagArray = hashtagArray.map((tag: string) =>
          tag.startsWith("#") ? tag : `#${tag}`
        );
        video.hashtags = hashtagArray;
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    if (links) {
      try {
        video.links = JSON.parse(links);
      } catch (error) {
        // Invalid JSON, skip
      }
    }

    const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };
    if (files && files.thumbnail) {
      const thumbnailFile = files.thumbnail[0] as Express.MulterS3.File;
      video.thumbnail = thumbnailFile.location;
    }

    await video.save();

    return res.status(200).json({
      status: "success",
      message: "Video updated successfully",
      data: { video },
    });
  } catch (error) {
    console.error("Update video error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update video",
    });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    if (video.owner.toString() !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to delete this video",
      });
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      status: "success",
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete video",
    });
  }
};

export const publishVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { duration } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({
        status: "fail",
        message: "Video not found",
      });
    }

    if (video.owner.toString() !== userId) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to publish this video",
      });
    }

    if (video.transcodeStatus !== "COMPLETE") {
      return res.status(400).json({
        status: "fail",
        message: "Video transcoding is not complete yet",
      });
    }

    video.isPublished = true;
    video.publishedAt = new Date();
    if (duration) video.duration = duration;

    await video.save();

    return res.status(200).json({
      status: "success",
      message: "Video published successfully",
      data: { video },
    });
  } catch (error) {
    console.error("Publish video error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to publish video",
    });
  }
};

export const getTrendingVideos = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const videos = await Video.aggregate([
      {
        $match: {
          isPublished: true,
          visibility: "public",
          publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ["$totalViews", 1] },
              { $multiply: ["$likesCount", 10] },
              { $multiply: ["$commentsCount", 5] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "channels",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
        },
      },
      { $unwind: "$channel" },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          "owner.password": 0,
          "owner.otp": 0,
          __v: 0,
        },
      },
    ]);

    const total = await Video.countDocuments({
      isPublished: true,
      visibility: "public",
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      status: "success",
      data: {
        videos,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalVideos: total,
          hasMore: page * limit < total,
        },
      },
    });
  } catch (error) {
    console.error("Get trending videos error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch trending videos",
    });
  }
};                 
 