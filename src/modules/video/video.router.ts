
import express from "express";
import {
  createVideo,
  getAllVideos,
  getVideoById,
  incrementViewCount,
  getVideosByChannel,
  updateVideo,
  deleteVideo,
  publishVideo,
  getTrendingVideos,
  checkTranscodingStatus,
} from "../video/video.controller.js";
import { verifyUser, verifyUserOptional } from "../../middlewares/auth.middleware.js";
import { uploadVideoWithThumbnail } from "../../middlewares/uploadVideoWithThumbnail.js";
import { uploadPublic } from "../../middlewares/uploadPublic.js";

const router = express.Router();

router.post(
  "/create",
  verifyUser,
  (req, res, next) => {
    const upload = uploadVideoWithThumbnail.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]);

    upload(req, res, (err: any) => {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({
          status: "fail",
          message: err.message || "File upload failed",
          error: err.toString(),
        });
      }

      // Check if files were uploaded
      if (!req.files || typeof req.files !== 'object') {
        return res.status(400).json({
          status: "fail",
          message: "No files uploaded",
        });
      }

      const files = req.files as { [fieldname: string]: Express.MulterS3.File[] };

      if (!files.video || files.video.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Video file is required",
        });
      }

      if (!files.thumbnail || files.thumbnail.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Thumbnail file is required",
        });
      }

      console.log("Files uploaded successfully:", {
        video: files.video[0].key,
        thumbnail: files.thumbnail[0].key,
      });

      next();
    });
  },
  createVideo
);


router.get("/all", verifyUserOptional, getAllVideos);

router.get("/trending", verifyUserOptional, getTrendingVideos);


router.get("/:videoId/status", verifyUser, checkTranscodingStatus);


router.post("/:videoId/view", incrementViewCount);


router.post("/:videoId/publish", verifyUser, publishVideo);

router.get("/:videoId", verifyUserOptional, getVideoById);

router.get("/channel/:channelId", verifyUserOptional, getVideosByChannel);


router.patch(
  "/:videoId",
  verifyUser,
  uploadPublic.single("thumbnail"),
  updateVideo
);


router.delete("/:videoId", verifyUser, deleteVideo);

export default router;