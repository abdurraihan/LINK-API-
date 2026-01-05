// src/middleware/uploadVideo.ts
import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../utils/s3.js";
import { v4 as uuidv4 } from "uuid";
import { S3_UPLOAD_BUCKET } from "../config/config.js";

export const uploadVideo = multer({
  storage: multerS3({
    s3,
    bucket: S3_UPLOAD_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      const key = `videos/${req.userId}/${uuidv4()}.${ext}`;
      cb(null, key);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only video files (MP4, MOV, AVI, MPEG) are allowed"));
    }
    cb(null, true);
  },
});