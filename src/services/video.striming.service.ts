import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../utils/s3.js";
import { S3_OUTPUT_BUCKET } from "../config/config.js";


export const generateSignedUrl = async (
  s3Key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_OUTPUT_BUCKET,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL for key:", s3Key, error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};


export const generateVideoStreamingUrls = async (videoUrlPath: string) => {
  try {
    console.log("Generating streaming URLs for:", videoUrlPath);


    const s3Key = videoUrlPath.replace(`s3://${S3_OUTPUT_BUCKET}/`, "");
    console.log("Extracted S3 key:", s3Key);

    const baseKey = s3Key.replace("master.m3u8", "");
    console.log("Base key:", baseKey);

    const urlPromises = {
      master: generateSignedUrl(s3Key, 3600).catch(() => null),
      "1080p": generateSignedUrl(`${baseKey}_1080p.m3u8`, 3600).catch(() => null),
      "720p": generateSignedUrl(`${baseKey}_720p.m3u8`, 3600).catch(() => null),
      "480p": generateSignedUrl(`${baseKey}_480p.m3u8`, 3600).catch(() => null),
      "360p": generateSignedUrl(`${baseKey}_360p.m3u8`, 3600).catch(() => null),
    };

    const urls = await Promise.all([
      urlPromises.master,
      urlPromises["1080p"],
      urlPromises["720p"],
      urlPromises["480p"],
      urlPromises["360p"],
    ]);

    const result = {
      master: urls[0],
      "1080p": urls[1],
      "720p": urls[2],
      "480p": urls[3],
      "360p": urls[4],
    };

    console.log("Generated URLs:", result);
    return result;
  } catch (error) {
    console.error("Error generating video streaming URLs:", error);
    throw new Error("Failed to generate streaming URLs");
  }
};