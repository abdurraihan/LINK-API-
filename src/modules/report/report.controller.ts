import { Request, Response } from "express";
import Report from "./report.model.js";
import Video from "../video/video.model.js";
import Short from "../shorts/shorts.model.js";
import Post from "../post/post.model.js";
import User from "../user/user.model.js";
import { notifyAdminNewReport } from "../../utils/adminNotification.utils.js";

// USER CREATE REPORT
export const createReport = async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, reason, description } = req.body;
    const userID = req.userId!

    if (!userID) {
      return res.status(404).json({ status: "fail", message: "User not found" });

    }
    const currentUser = await User.findById(userID).select("username").lean();

    const report = await Report.create({
      reporter: req.userId,
      contentId,
      contentType,
      reason,
      description,
    });

    notifyAdminNewReport({
      reporterId: userID!,
      reporterUsername: currentUser.username,
      reason: req.body.reason,
      targetType: req.body.targetType,  // "Video" | "Short" | "Post" | "Channel" | "User"
      targetId: req.body.targetId,
    });

    res.status(201).json({
      status: "success",
      message: "Report submitted successfully",
      report,
    });


  } catch (error) {
    res.status(500).json({ message: "Failed to create report" });
  }
};


// USER GET MY REPORTS
export const getMyReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ reporter: req.userId });

    res.json({
      status: "success",
      reports,
    });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};


// DELETE REPORT
export const deleteMyReport = async (req: Request, res: Response) => {
  try {
    await Report.findOneAndDelete({
      _id: req.params.reportId,
      reporter: req.userId,
    });

    res.json({
      status: "success",
      message: "Report deleted",
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
};


// ADMIN GET ALL REPORTS
export const getAllReportsAdmin = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      reports,
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
};


// ADMIN GET SINGLE REPORT
export const getSingleReportAdmin = async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate("reporter", "name email")
      .populate("reviewedBy", "name");

    res.json({
      status: "success",
      report,
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
};


// ADMIN VIEW CONTENT
export const viewReportedContent = async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.reportId);

    let content;

    if (report?.contentType === "video")
      content = await Video.findById(report.contentId);

    if (report?.contentType === "short")
      content = await Short.findById(report.contentId);

    if (report?.contentType === "post")
      content = await Post.findById(report.contentId);

    res.json({
      report,
      content,
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
};


// ADMIN UPDATE STATUS
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.reportId,
      {
        status,
        reviewedBy: req.adminId,
      },
      { new: true }
    );

    res.json({
      status: "success",
      report,
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
};


// ADMIN DELETE CONTENT
export const deleteContentByAdmin = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params;

    let deletedContent = null;

    if (type === "video") {
      deletedContent = await Video.findByIdAndDelete(id);
    }

    if (type === "short") {
      deletedContent = await Short.findByIdAndDelete(id);
    }

    if (type === "post") {
      deletedContent = await Post.findByIdAndDelete(id);
    }

    if (!deletedContent) {
      return res.status(404).json({
        status: "fail",
        message: "Content not found or already deleted",
      });
    }

    res.json({
      status: "success",
      message: "Content deleted successfully",
      deletedContentId: id,
      type,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};
