import { Request, Response } from "express";
import OpenAI from "openai";
import AIConversation from "./ai.model.js";
import {OPENAI_API_KEY} from "../../config/config.js";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// ─── CHAT ────────────────────────────────────────────────────────────────────
export const chat = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId!;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ status: "fail", message: "prompt is required." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt.trim() }],
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

   await AIConversation.create({
  userId,
  type: "chat",
  prompt: prompt.trim(),
  response: reply,
  aiModel: "gpt-4o-mini",
});
    return res.status(200).json({
      status: "success",
      data: { reply },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error?.message ?? "Something went wrong.",
    });
  }
};

// ─── IMAGE GENERATION ─────────────────────────────────────────────────────────
export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt, size = "1024x1024" } = req.body;
    const userId = req.userId!;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ status: "fail", message: "prompt is required." });
    }

    const allowedSizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"];
    if (!allowedSizes.includes(size)) {
      return res.status(400).json({
        status: "fail",
        message: `size must be one of: ${allowedSizes.join(", ")}`,
      });
    }

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.trim(),
      n: 1,
      size: size as any,
    });

    const imageUrl = imageResponse.data[0]?.url ?? "";

   await AIConversation.create({
  userId,
  type: "image",
  prompt: prompt.trim(),
  response: imageUrl,
  aiModel: "dall-e-3",
});

    return res.status(200).json({
      status: "success",
      data: { imageUrl },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error?.message ?? "Something went wrong.",
    });
  }
};

// ─── GET HISTORY ──────────────────────────────────────────────────────────────
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, page = "1", limit = "10" } = req.query;

    const filter: any = { userId };
    if (type === "chat" || type === "image") filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      AIConversation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AIConversation.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: "success",
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error?.message ?? "Something went wrong.",
    });
  }
};