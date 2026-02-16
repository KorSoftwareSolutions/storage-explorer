import type {
  BucketItem,
  ObjectsPayload,
  S3ConnectionProfile,
  TestConnectionPayload,
} from "../types/s3";

type ApiEnvelope<T> = {
  ok: true;
  data: T;
};

type ApiErrorEnvelope = {
  ok: false;
  error?: {
    message?: string;
    code?: string;
  };
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope;

  if (!response.ok || payload.ok === false) {
    const message = payload.ok === false ? payload.error?.message : "Request failed.";
    throw new Error(message || "Request failed.");
  }

  return payload.data;
}

export function testConnection(profile: S3ConnectionProfile): Promise<TestConnectionPayload> {
  return postJson<TestConnectionPayload>("/api/s3/test-connection", { profile });
}

export function listBuckets(profile: S3ConnectionProfile): Promise<{ buckets: BucketItem[] }> {
  return postJson<{ buckets: BucketItem[] }>("/api/s3/list-buckets", { profile });
}

export function listObjects(input: {
  profile: S3ConnectionProfile;
  bucket: string;
  prefix?: string;
  continuationToken?: string | null;
  maxKeys?: number;
}): Promise<ObjectsPayload> {
  return postJson<ObjectsPayload>("/api/s3/list-objects", input);
}
