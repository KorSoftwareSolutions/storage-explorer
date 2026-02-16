import { S3Client } from "@aws-sdk/client-s3";
import type { S3ProfileInput } from "./types";

export function createS3Client(profile: S3ProfileInput): S3Client {
  return new S3Client({
    region: profile.region,
    endpoint: profile.endpoint,
    forcePathStyle: profile.forcePathStyle,
    credentials: {
      accessKeyId: profile.accessKeyId,
      secretAccessKey: profile.secretAccessKey,
    },
  });
}
