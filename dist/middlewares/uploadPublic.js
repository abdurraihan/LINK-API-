import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../utils/s3.js";
import { v4 as uuidv4 } from "uuid";
import { S3_IMAGE_BUCKET } from "../config/config.js";
export const uploadPublic = multer({
    storage: multerS3({
        s3,
        bucket: S3_IMAGE_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const ext = file.originalname.split(".").pop();
            const key = `image/${req.userId}/${uuidv4()}.${ext}`;
            cb(null, key);
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});
