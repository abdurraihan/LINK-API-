import { Request, Response } from "express";
import mongoose from "mongoose";
import Save from "./save.model.js";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";
import Post from "../post/post.model.js";

// Save content
export const saveContent = async (req: Request, res: Response) => {
  try {
    const { contentType, contentId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid contentId provided." });
    }

    const normalizedType =
      contentType.charAt(0).toUpperCase() + contentType.slice(1).toLowerCase();

    if (!["Video", "Short", "Post"].includes(normalizedType)) {
      return res.status(400).json({ message: "Invalid contentType provided." });
    }

    const parsedContentId = new mongoose.Types.ObjectId(contentId);

    let content;
    if (normalizedType === "Video") {
      content = await Video.findById(parsedContentId);
    } else if (normalizedType === "Short") {
      content = await Short.findById(parsedContentId);
    } else if (normalizedType === "Post") {
      content = await Post.findById(parsedContentId);
    }

    if (!content) {
      return res.status(404).json({ message: "Content not found." });
    }

    const existingSave = await Save.findOne({
      user: userId,
      "savedContent.contentId": parsedContentId,
    });

    if (existingSave) {
      return res.status(400).json({ message: "Content already saved." });
    }

    const save = await Save.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          savedContent: { type: normalizedType, contentId: parsedContentId },
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "Content saved successfully.", save });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Unsave content
export const unsaveContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.body;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid contentId provided." });
    }

    const parsedContentId = new mongoose.Types.ObjectId(contentId);

    // Check if the content is actually saved first
    const existingSave = await Save.findOne({
      user: userId,
      "savedContent.contentId": parsedContentId,
    });

    if (!existingSave) {
      return res.status(404).json({ message: "Content not saved." });
    }

    // Pull the content out of the savedContent array
    const save = await Save.findOneAndUpdate(
      { user: userId },
      { $pull: { savedContent: { contentId: parsedContentId } } },
      { new: true }
    );

    return res.status(200).json({ message: "Content unsaved successfully.", save });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Check if a specific content is saved by the user
export const checkSaved = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid contentId provided." });
    }

    const parsedContentId = new mongoose.Types.ObjectId(contentId);

    const existingSave = await Save.findOne({
      user: userId,
      "savedContent.contentId": parsedContentId,
    });

    return res.status(200).json({ 
      isSaved: !!existingSave  // true if saved, false if not
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
};

// Get saved content
export const getSavedContent = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const savedData = await Save.findOne({ user: userId }).exec();

    if (!savedData) {
      return res.status(404).json({ message: "No saved content found." });
    }

    const populatedContent = await Promise.all(
      savedData.savedContent.map(async (savedItem) => {
        const normalizedType =
          savedItem.type.charAt(0).toUpperCase() +
          savedItem.type.slice(1).toLowerCase();

        let content;
        switch (normalizedType) {
          case "Video":
            content = await Video.findById(savedItem.contentId).populate(
              "owner",
              "username avatar"
            );
            break;
          case "Short":
            content = await Short.findById(savedItem.contentId).populate(
              "owner",
              "username avatar"
            );
            break;
          case "Post":
            content = await Post.findById(savedItem.contentId).populate(
              "owner",
              "username avatar"
            );
            break;
          default:
            return null;
        }

        return { type: normalizedType, content };
      })
    );

    return res.status(200).json({
      savedContent: populatedContent.filter(Boolean),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
};