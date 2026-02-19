import type { ApiErrorPayload } from "../http/response";
import type { ParsedDownloadInput, ParsedListObjectsInput, S3ProfileInput } from "./types";

function parseProfile(value: unknown): S3ProfileInput | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const endpoint = typeof record.endpoint === "string" ? record.endpoint.trim() : "";
  const accessKeyId =
    typeof record.accessKeyId === "string" ? record.accessKeyId.trim() : "";
  const secretAccessKey =
    typeof record.secretAccessKey === "string" ? record.secretAccessKey.trim() : "";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const region =
    typeof record.region === "string" && record.region.trim()
      ? record.region.trim()
      : "us-east-1";

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: record.forcePathStyle !== false,
  };
}

export function parseProfileFromBody(body: unknown): S3ProfileInput | null {
  const profile = (body as { profile?: unknown } | null)?.profile;
  return parseProfile(profile);
}

export function parseListObjectsInput(body: unknown):
  | { ok: true; data: ParsedListObjectsInput }
  | { ok: false; error: ApiErrorPayload } {
  const record = body as
    | {
        profile?: unknown;
        bucket?: unknown;
        prefix?: unknown;
        continuationToken?: unknown;
        maxKeys?: unknown;
      }
    | null;

  const profile = parseProfile(record?.profile);
  if (!profile) {
    return {
      ok: false,
      error: {
        message: "Invalid profile. endpoint, accessKeyId, and secretAccessKey are required.",
        code: "InvalidProfile",
      },
    };
  }

  const bucket = typeof record?.bucket === "string" ? record.bucket.trim() : "";
  if (!bucket) {
    return {
      ok: false,
      error: {
        message: "Bucket is required.",
        code: "MissingBucket",
      },
    };
  }

  const prefix =
    typeof record?.prefix === "string" && record.prefix.length > 0 ? record.prefix : undefined;
  const continuationToken =
    typeof record?.continuationToken === "string" && record.continuationToken.length > 0
      ? record.continuationToken
      : undefined;
  const maxKeysRaw = typeof record?.maxKeys === "number" ? record.maxKeys : Number.NaN;
  const maxKeys =
    Number.isFinite(maxKeysRaw) && maxKeysRaw >= 1
      ? Math.min(Math.floor(maxKeysRaw), 1000)
      : 200;

  return {
    ok: true,
    data: {
      profile,
      bucket,
      prefix,
      continuationToken,
      maxKeys,
    },
  };
}

export function parseDownloadInput(body: unknown):
  | { ok: true; data: ParsedDownloadInput }
  | { ok: false; error: ApiErrorPayload } {
  const record = body as
    | { profile?: unknown; bucket?: unknown; key?: unknown }
    | null;

  const profile = parseProfile(record?.profile);
  if (!profile) {
    return {
      ok: false,
      error: {
        message: "Invalid profile. endpoint, accessKeyId, and secretAccessKey are required.",
        code: "InvalidProfile",
      },
    };
  }

  const bucket = typeof record?.bucket === "string" ? record.bucket.trim() : "";
  if (!bucket) {
    return {
      ok: false,
      error: { message: "Bucket is required.", code: "MissingBucket" },
    };
  }

  const key = typeof record?.key === "string" ? record.key.trim() : "";
  if (!key) {
    return {
      ok: false,
      error: { message: "Object key is required.", code: "MissingKey" },
    };
  }

  return { ok: true, data: { profile, bucket, key } };
}

export function invalidProfileError(): ApiErrorPayload {
  return {
    message: "Invalid profile. endpoint, accessKeyId, and secretAccessKey are required.",
    code: "InvalidProfile",
  };
}
