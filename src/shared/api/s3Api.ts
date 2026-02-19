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

export async function downloadObject(input: {
  profile: S3ConnectionProfile;
  bucket: string;
  key: string;
}): Promise<void> {
  const response = await fetch("/api/s3/download-object", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorEnvelope | null;
    const message = payload?.error?.message || "Download failed.";
    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? input.key.split("/").filter(Boolean).pop() ?? "download";

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
