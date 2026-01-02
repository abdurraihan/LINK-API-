import Post from "../post/post.model.js";
import mongoose from "mongoose";
export const createPost = async (req, res) => {
    try {
        const { description, hashtags, taggedPeople, links, channel } = req.body;
        console.log(description, hashtags, taggedPeople, links, channel);
        if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
            return res.status(400).json({
                status: "fail",
                message: "At least one media is required",
            });
        }
        const media = req.files.map((file) => ({
            url: file.location, // S3 public URL
        }));
        console.log(media);
        const post = await Post.create({
            description,
            media,
            hashtags: hashtags ? JSON.parse(hashtags) : [],
            taggedPeople: taggedPeople ? JSON.parse(taggedPeople) : [],
            links: links,
            owner: req.userId,
            channel,
        });
        return res.status(201).json({
            status: "success",
            data: post,
        });
    }
    catch (error) {
        console.error("Full error object:", error);
        console.error("Error name:", error instanceof Error ? error.name : 'unknown');
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        return res.status(500).json({
            status: "error",
            message: "Failed to create post",
        });
    }
};
export const getSinglePost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }
        const post = await Post.findById(postId)
            .populate("owner", "username avatar")
            .populate("channel", "channelName channelIcon");
        if (!post) {
            return res.status(404).json({
                status: "fail",
                message: "Post not found",
            });
        }
        return res.status(200).json({
            status: "success",
            data: post,
        });
    }
    catch {
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch post",
        });
    }
};
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate("owner", "username avatar")
            .populate("channel", "channelName channelIcon");
        return res.status(200).json({
            status: "success",
            count: posts.length,
            data: posts,
        });
    }
    catch {
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch posts",
        });
    }
};
export const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { description, hashtags, taggedPeople, links } = req.body;
        const post = await Post.findOne({
            _id: postId,
            owner: req.userId,
        });
        if (!post) {
            return res.status(404).json({
                status: "fail",
                message: "Post not found or unauthorized",
            });
        }
        if (description)
            post.description = description;
        if (hashtags)
            post.hashtags = JSON.parse(hashtags);
        if (taggedPeople)
            post.taggedPeople = JSON.parse(taggedPeople);
        if (links)
            post.links = links;
        if (req.files && req.files instanceof Array && req.files.length > 0) {
            post.media = req.files.map((file) => ({
                url: file.location,
            }));
        }
        await post.save();
        return res.status(200).json({
            status: "success",
            data: post,
        });
    }
    catch {
        return res.status(500).json({
            status: "error",
            message: "Failed to update post",
        });
    }
};
