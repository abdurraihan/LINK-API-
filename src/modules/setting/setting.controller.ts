import { Request, Response } from "express";
import Settings from "./setting.model.js";


// CREATE or UPDATE SETTINGS
export const upsertSettings = async (req: Request, res: Response) => {
  try {
    const { aboutUs, termsAndConditions, privacyPolicy } = req.body;

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        aboutUs,
        termsAndConditions,
        privacyPolicy,
        updatedBy: req.adminId,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: "success",
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update settings",
    });
  }
};



// GET SETTINGS (PUBLIC)
export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();

    res.status(200).json({
      status: "success",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch settings",
    });
  }
};