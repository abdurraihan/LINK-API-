import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3.js";
import { S3_IMAGE_BUCKET } from "../config/config.js";

export const deleteFromS3ByUrl = async (url: string) => {
  if (!url) return;

  // extract key from public S3 URL
  const key = url.split(".amazonaws.com/")[1];

  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: S3_IMAGE_BUCKET,
      Key: key,
    })
  );
};
