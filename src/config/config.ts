// config.ts
import dotenv from "dotenv";
dotenv.config();

// Server
export const PORT: number = Number(process.env.PORT) || 5001;
export const MONGO_URI: string = process.env.MONGO_URI!;
export const NODE_ENV: string = process.env.NODE_ENV || "development";

// JWT
export const JWT_SECRET: string = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN!;
export const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET!;
export const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN!;

// SMTP / Email
export const SENDGRID_API_KEY: string = process.env.SENDGRID_API_KEY!;
export const SENDGRID_FROM_EMAIL: string = process.env.SENDGRID_FROM_EMAIL!;
export const SENDGRID_FROM_NAME: string = process.env.SENDGRID_FROM_NAME || "Your App";

// AWS
export const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID!;
export const AWS_SECRET_ACCESS_KEY: string = process.env.AWS_SECRET_ACCESS_KEY!;
export const AWS_REGION: string = process.env.AWS_REGION!;
export const S3_UPLOAD_BUCKET: string = process.env.S3_UPLOAD_BUCKET!;
export const S3_OUTPUT_BUCKET: string = process.env.S3_OUTPUT_BUCKET!;
export const S3_IMAGE_BUCKET: string = process.env.S3_IMAGE_BUCKET!;
export const MC_ROLE_ARN: string = process.env.MC_ROLE_ARN!;
export const MC_ENDPOINT: string = process.env.MC_ENDPOINT!;
export const CLOUDFRONT_URL: string = process.env.CLOUDFRONT_URL || "";
