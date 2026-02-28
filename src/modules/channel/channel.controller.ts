import { Request, Response } from "express";
import User from "../user/user.model.js";
import Channel from "../channel/channel.model.js";
import { deleteFromS3ByUrl } from "../../utils/deleteFromS3.js";
import { notifyAdminNewChannel } from "../../utils/adminNotification.utils.js";

// CREATE CHANNEL
export const createChannel = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .select("username")
      .lean();

    if (!user) {
      return res.status(404).json({ status: "fail", message: "User not found" });
    }

    const currentUserName = user.username;

    const { channelName, description, links } = req.body;
    const file = req.file as any;

   

    if (!file) {
      return res.status(400).json({ status: "fail", message: "Channel icon is required" });
    }


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

    // sending notification to admin A new channel has been created 
    notifyAdminNewChannel({
      id: channel._id.toString(),
      channelName: channel.channelName,
      channelIcon: channel.channelIcon,
      ownerId: req.userId!,
      ownerUsername: currentUserName,
    });

    res.status(201).json({ status: "success", data: channel });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// UPDATE CHANNEL
export const updateMyChannel = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { channelName, description, links } = req.body;


    const file = req.file as Express.MulterS3.File | undefined;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const channel = await Channel.findOne({ owner: userId });
    if (!channel) {
      return res.status(404).json({ status: "fail", message: "Channel not found" });
    }

    if (file && channel.channelIcon) {
      await deleteFromS3ByUrl(channel.channelIcon);
      channel.channelIcon = file.location;
    }

    if (channelName) channel.channelName = channelName;
    if (description) channel.description = description;
    if (links) channel.links = links;

    await channel.save();

    res.status(200).json({ status: "success", data: channel });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// GET CHANNEL
export const getMyChannel = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }


    const channel = await Channel.findOne({ owner: userId }).populate("owner", "username email");

    if (!channel) {
      return res.status(404).json({ status: "fail", message: "You don't have a channel yet" });
    }

    res.status(200).json({ status: "success", data: channel });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// get all channel 
export const getAllChannels = async (req: Request, res: Response) => {
  try {
    // Fetch all channels, only select _id, channelName, channelIcon
    const channels = await Channel.find({}, "_id channelName channelIcon").lean();

    res.status(200).json({ status: "success", data: channels });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};