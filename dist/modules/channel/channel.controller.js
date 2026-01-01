import Channel from "../channel/channel.model.js";
import { deleteFromS3ByUrl } from "../../utils/deleteFromS3.js";
// CREATE CHANNEL
export const createChannel = async (req, res) => {
    try {
        const userId = req.userId;
        const { channelName, description, links } = req.body;
        const file = req.file;
        if (!userId) {
            return res.status(401).json({ status: "fail", message: "Unauthorized" });
        }
        if (!file) {
            return res.status(400).json({ status: "fail", message: "Channel icon is required" });
        }
        // Check if user already has a channel
        const existingChannel = await Channel.findOne({ owner: userId });
        if (existingChannel) {
            return res.status(400).json({ status: "fail", message: "User already has a channel" });
        }
        const channel = await Channel.create({
            channelName,
            description,
            links,
            channelIcon: file.location,
            owner: userId,
        });
        res.status(201).json({ status: "success", data: channel });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
// UPDATE CHANNEL
export const updateMyChannel = async (req, res) => {
    try {
        const userId = req.userId;
        const { channelName, description, links } = req.body;
        // Cast file to MulterS3.File so TypeScript knows about `location`
        const file = req.file;
        if (!userId) {
            return res.status(401).json({ status: "fail", message: "Unauthorized" });
        }
        const channel = await Channel.findOne({ owner: userId });
        if (!channel) {
            return res.status(404).json({ status: "fail", message: "Channel not found" });
        }
        // If updating icon, delete old one from S3
        if (file && channel.channelIcon) {
            await deleteFromS3ByUrl(channel.channelIcon);
            channel.channelIcon = file.location; // ✅ Now TypeScript is happy
        }
        if (channelName)
            channel.channelName = channelName;
        if (description)
            channel.description = description;
        if (links)
            channel.links = links;
        await channel.save();
        res.status(200).json({ status: "success", data: channel });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
// GET CHANNEL
export const getMyChannel = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ status: "fail", message: "Unauthorized" });
        }
        // Find the channel owned by this user
        const channel = await Channel.findOne({ owner: userId }).populate("owner", "username email");
        if (!channel) {
            return res.status(404).json({ status: "fail", message: "You don't have a channel yet" });
        }
        res.status(200).json({ status: "success", data: channel });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};
