import { S3ServiceException } from "@aws-sdk/client-s3";
import type { ApiErrorPayload } from "../http/response";

export function mapS3Error(err: unknown): ApiErrorPayload {
  if (err instanceof S3ServiceException) {
    return {
      message: err.message || "S3 request failed.",
      code: err.name,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      code: "UnknownError",
    };
  }

  return {
    message: "Unexpected error while talking to S3.",
    code: "UnknownError",
  };
}

export function mapListBucketsResult(result: {
  Buckets?: Array<{ Name?: string; CreationDate?: Date }>;
}) {
  return {
    buckets: (result.Buckets ?? []).map(bucket => ({
      name: bucket.Name ?? "",
      creationDate: bucket.CreationDate?.toISOString() ?? null,
    })),
  };
}

export function mapListObjectsResult(
  result: {
    CommonPrefixes?: Array<{ Prefix?: string }>;
    Contents?: Array<{
      Key?: string;
      Size?: number;
      LastModified?: Date;
      ETag?: string;
      StorageClass?: string;
    }>;
    IsTruncated?: boolean;
    NextContinuationToken?: string;
  },
  bucket: string,
  prefix?: string,
) {
  const folders = (result.CommonPrefixes ?? [])
    .map(entry => entry.Prefix)
    .filter((value): value is string => Boolean(value));
  const files = (result.Contents ?? [])
    .filter(item => item.Key && item.Key !== prefix)
    .map(item => ({
      key: item.Key ?? "",
      size: item.Size ?? 0,
      lastModified: item.LastModified?.toISOString() ?? null,
      eTag: item.ETag ?? null,
      storageClass: item.StorageClass ?? null,
    }));

  return {
    bucket,
    prefix: prefix ?? "",
    folders,
    files,
    isTruncated: Boolean(result.IsTruncated),
    nextContinuationToken: result.NextContinuationToken ?? null,
  };
}
