// config.ts
import dotenv from "dotenv";
dotenv.config();
// Server
export const PORT = Number(process.env.PORT) || 5001;
export const MONGO_URI = process.env.MONGO_URI;
export const NODE_ENV = process.env.NODE_ENV || "development";
// JWT
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;
// SMTP / Email
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
export const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Your App";
// AWS
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET;
export const S3_OUTPUT_BUCKET = process.env.S3_OUTPUT_BUCKET;
export const S3_IMAGE_BUCKET = process.env.S3_IMAGE_BUCKET;
export const MC_ROLE_ARN = process.env.MC_ROLE_ARN;
export const MC_ENDPOINT = process.env.MC_ENDPOINT;
export const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL || "";
