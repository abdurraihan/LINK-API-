import Short from "../../modules/shorts/shorts.model.js";
import Channel from "../../modules/channel/channel.model.js";
import { createTranscodeJob, getJobStatus } from "../../services/mediaConvert.service.js";
import { S3_OUTPUT_BUCKET } from "../../config/config.js";
import mongoose from "mongoose";
export const createShort = async (req, res) => {
    try {
        const { title, description, hashtags, channelId, category, language, visibility, } = req.body;
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
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "Video file is required",
            });
        }
        const videoFile = req.file;
        let hashtagArray = [];
        if (hashtags) {
            try {
                hashtagArray = JSON.parse(hashtags);
                hashtagArray = hashtagArray.map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
            }
            catch (error) {
                hashtagArray = [];
            }
        }
        const outputKeyPrefix = `shorts/${userId}/${Date.now()}`;
        const transcodeJob = await createTranscodeJob({
            inputKey: videoFile.key,
            outputKeyPrefix,
        });
        const short = await Short.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            videoUrl: `https://${S3_OUTPUT_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${outputKeyPrefix}/index.m3u8`,
            hashtags: hashtagArray,
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
        const shortData = short.toObject();
        return res.status(201).json({
            status: "success",
            message: "Short upload initiated. Transcoding in progress...",
            data: {
                shortId: short._id,
                transcodeJobId: transcodeJob.jobId,
                short: {
                    ...shortData,
                    streamingUrl: null, // Not ready until transcoding completes
                },
            },
        });
    }
    catch (error) {
        console.error("Create short error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to create short",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
export const getShortById = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(shortId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid short ID",
            });
        }
        const short = await Short.findById(shortId)
            .populate("channel", "channelName channelIcon totalfollowers description")
            .populate("owner", "username avatar");
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        if (short.visibility === "private" && short.owner._id.toString() !== req.userId) {
            return res.status(403).json({
                status: "fail",
                message: "This short is private",
            });
        }
        const shortData = short.toObject();
        return res.status(200).json({
            status: "success",
            data: {
                short: {
                    ...shortData,
                    streamingUrl: short.transcodeStatus === "COMPLETE"
                        ? short.videoUrl
                        : null,
                },
            },
        });
    }
    catch (error) {
        console.error("Get short by ID error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch short",
        });
    }
};
export const checkShortTranscodingStatus = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(shortId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid short ID",
            });
        }
        const short = await Short.findById(shortId);
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        if (short.owner.toString() !== req.userId) {
            return res.status(403).json({
                status: "fail",
                message: "You don't have permission to view this",
            });
        }
        if (!short.transcodeJobId) {
            return res.status(400).json({
                status: "fail",
                message: "No transcoding job found for this short",
            });
        }
        const jobStatus = await getJobStatus(short.transcodeJobId);
        short.transcodeStatus = jobStatus.status;
        await short.save();
        return res.status(200).json({
            status: "success",
            data: {
                shortId: short._id,
                transcodeStatus: jobStatus.status,
                progress: jobStatus.progress,
                isComplete: jobStatus.status === "COMPLETE",
                message: jobStatus.status === "COMPLETE"
                    ? "Short is ready to stream"
                    : `Transcoding in progress: ${jobStatus.progress}%`,
            },
        });
    }
    catch (error) {
        console.error("Check transcoding status error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to check transcoding status",
        });
    }
};
export const getAllShorts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { category, search, sortBy = "createdAt" } = req.query;
        const query = { visibility: "public" }; // isPublished: true
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
        let sort = {};
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
        const shorts = await Short.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("channel", "channelName channelIcon totalfollowers")
            .populate("owner", "username avatar")
            .select("-__v");
        const total = await Short.countDocuments(query);
        // Add streamingUrl to each short
        const shortsWithStreamingUrl = shorts.map(short => {
            const shortObj = short.toObject();
            return {
                ...shortObj,
                streamingUrl: short.transcodeStatus === "COMPLETE" ? short.videoUrl : null,
            };
        });
        return res.status(200).json({
            status: "success",
            data: {
                shorts: shortsWithStreamingUrl,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalShorts: total,
                    hasMore: page * limit < total,
                },
            },
        });
    }
    catch (error) {
        console.error("Get all shorts error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch shorts",
        });
    }
};
export const incrementShortViewCount = async (req, res) => {
    try {
        const { shortId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(shortId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid short ID",
            });
        }
        const short = await Short.findByIdAndUpdate(shortId, { $inc: { totalViews: 1 } }, { new: true });
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        await Channel.findByIdAndUpdate(short.channel, {
            $inc: { totalViews: 1 },
        });
        return res.status(200).json({
            status: "success",
            message: "View count incremented",
            data: { totalViews: short.totalViews },
        });
    }
    catch (error) {
        console.error("Increment view count error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to increment view count",
        });
    }
};
export const getShortsByChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
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
        const query = { channel: channelId };
        if (channel.owner.toString() !== req.userId) {
            //query.isPublished = true;
            query.visibility = "public";
        }
        const shorts = await Short.find(query)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-__v");
        const total = await Short.countDocuments(query);
        // Add streamingUrl to each short
        const shortsWithStreamingUrl = shorts.map(short => ({
            ...short.toObject(),
            streamingUrl: short.transcodeStatus === "COMPLETE" ? short.videoUrl : null,
        }));
        return res.status(200).json({
            status: "success",
            data: {
                shorts: shortsWithStreamingUrl,
                channel: {
                    channelName: channel.channelName,
                    channelIcon: channel.channelIcon,
                    totalfollowers: channel.totalfollowers,
                },
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalShorts: total,
                    hasMore: page * limit < total,
                },
            },
        });
    }
    catch (error) {
        console.error("Get shorts by channel error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch channel shorts",
        });
    }
};
export const updateShort = async (req, res) => {
    try {
        const { shortId } = req.params;
        const { title, description, hashtags, category, visibility } = req.body;
        const userId = req.userId;
        if (!mongoose.Types.ObjectId.isValid(shortId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid short ID",
            });
        }
        const short = await Short.findById(shortId);
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        if (short.owner.toString() !== userId) {
            return res.status(403).json({
                status: "fail",
                message: "You don't have permission to update this short",
            });
        }
        if (title)
            short.title = title;
        if (description)
            short.description = description;
        if (category)
            short.category = category;
        if (visibility)
            short.visibility = visibility;
        if (hashtags) {
            try {
                let hashtagArray = JSON.parse(hashtags);
                hashtagArray = hashtagArray.map((tag) => tag.startsWith("#") ? tag : `#${tag}`);
                short.hashtags = hashtagArray;
            }
            catch (error) {
                // Invalid JSON, skip
            }
        }
        await short.save();
        const shortData = short.toObject();
        return res.status(200).json({
            status: "success",
            message: "Short updated successfully",
            data: {
                short: {
                    ...shortData,
                    streamingUrl: short.transcodeStatus === "COMPLETE" ? short.videoUrl : null,
                },
            },
        });
    }
    catch (error) {
        console.error("Update short error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to update short",
        });
    }
};
export const deleteShort = async (req, res) => {
    try {
        const { shortId } = req.params;
        const userId = req.userId;
        // if (!mongoose.Types.ObjectId.isValid(shortId)) {
        //   return res.status(400).json({
        //     status: "fail",
        //     message: "Invalid short ID",
        //   });
        // }
        const short = await Short.findById(shortId);
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        if (short.owner.toString() !== userId) {
            return res.status(403).json({
                status: "fail",
                message: "You don't have permission to delete this short",
            });
        }
        await Short.findByIdAndDelete(shortId);
        return res.status(200).json({
            status: "success",
            message: "Short deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete short error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to delete short",
        });
    }
};
export const publishShort = async (req, res) => {
    try {
        const { shortId } = req.params;
        const { duration } = req.body;
        const userId = req.userId;
        if (!mongoose.Types.ObjectId.isValid(shortId)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid short ID",
            });
        }
        const short = await Short.findById(shortId);
        if (!short) {
            return res.status(404).json({
                status: "fail",
                message: "Short not found",
            });
        }
        if (short.owner.toString() !== userId) {
            return res.status(403).json({
                status: "fail",
                message: "You don't have permission to publish this short",
            });
        }
        if (short.transcodeStatus !== "COMPLETE") {
            return res.status(400).json({
                status: "fail",
                message: "Short transcoding is not complete yet",
            });
        }
        if (duration && duration > 60) {
            return res.status(400).json({
                status: "fail",
                message: "Short duration cannot exceed 60 seconds",
            });
        }
        short.isPublished = true;
        short.publishedAt = new Date();
        if (duration)
            short.duration = duration;
        await short.save();
        const shortData = short.toObject();
        return res.status(200).json({
            status: "success",
            message: "Short published successfully",
            data: {
                short: {
                    ...shortData,
                    streamingUrl: short.videoUrl,
                },
            },
        });
    }
    catch (error) {
        console.error("Publish short error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to publish short",
        });
    }
};
export const getTrendingShorts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const shorts = await Short.aggregate([
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
        const total = await Short.countDocuments({
            isPublished: true,
            visibility: "public",
            publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        });
        // Add streamingUrl to each short
        const shortsWithStreamingUrl = shorts.map(short => ({
            ...short,
            streamingUrl: short.transcodeStatus === "COMPLETE" ? short.videoUrl : null,
        }));
        return res.status(200).json({
            status: "success",
            data: {
                shorts: shortsWithStreamingUrl,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalShorts: total,
                    hasMore: page * limit < total,
                },
            },
        });
    }
    catch (error) {
        console.error("Get trending shorts error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch trending shorts",
        });
    }
};
