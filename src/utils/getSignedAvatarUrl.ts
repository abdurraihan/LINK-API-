import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3.js";
import { S3_IMAGE_BUCKET } from "../config/config.js";

export const getSignedAvatarUrl = async (key: string) => {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: S3_IMAGE_BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 } // 1 hour
  );
};
