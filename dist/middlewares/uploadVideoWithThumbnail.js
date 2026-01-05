// src/middleware/uploadVideoWithThumbnail.ts
import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../utils/s3.js";
import { v4 as uuidv4 } from "uuid";
import { S3_UPLOAD_BUCKET, S3_IMAGE_BUCKET } from "../config/config.js";
export const uploadVideoWithThumbnail = multer({
    storage: multerS3({
        s3,
        bucket: (req, file, cb) => {
            // Choose bucket based on field name
            if (file.fieldname === "video") {
                cb(null, S3_UPLOAD_BUCKET);
            }
            else if (file.fieldname === "thumbnail") {
                cb(null, S3_IMAGE_BUCKET);
            }
            else {
                cb(new Error("Invalid field name"));
            }
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const ext = file.originalname.split(".").pop();
            if (file.fieldname === "video") {
                const key = `videos/${req.userId}/${uuidv4()}.${ext}`;
                cb(null, key);
            }
            else if (file.fieldname === "thumbnail") {
                const key = `image/${req.userId}/${uuidv4()}.${ext}`;
                cb(null, key);
            }
            else {
                cb(new Error("Invalid field name"));
            }
        },
    }),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max (applies to largest file)
        files: 2, // Maximum 2 files
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "video") {
            const allowedMimeTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/webm"];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return cb(new Error("Only video files (MP4, MOV, AVI, MPEG, WEBM) are allowed"));
            }
        }
        else if (file.fieldname === "thumbnail") {
            if (!file.mimetype.startsWith("image/")) {
                return cb(new Error("Only image files are allowed for thumbnail"));
            }
        }
        else {
            return cb(new Error("Invalid field name"));
        }
        cb(null, true);
    },
});
