import {
  ListBucketsCommand,
  ListObjectsV2Command,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { fail, ok } from "../http/response";
import { createS3Client } from "./client";
import { mapListBucketsResult, mapListObjectsResult, mapS3Error } from "./mappers";
import { invalidProfileError, parseListObjectsInput, parseProfileFromBody } from "./validate";

async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function testConnectionHandler(req: Request): Promise<Response> {
  const body = await parseJsonBody(req);
  const profile = parseProfileFromBody(body);

  if (!profile) {
    return fail(400, invalidProfileError());
  }

  const client = createS3Client(profile);

  try {
    await client.send(new ListBucketsCommand({}));
    return ok({
      connected: true,
      message: "Connection successful.",
    });
  } catch (err) {
    if (
      err instanceof S3ServiceException &&
      (err.name === "AccessDenied" || err.name === "AccessDeniedException")
    ) {
      return ok({
        connected: true,
        limitedPermissions: true,
        message:
          "Connected, but this key cannot list buckets. You can still browse known buckets.",
      });
    }

    return fail(400, mapS3Error(err));
  }
}

export async function listBucketsHandler(req: Request): Promise<Response> {
  const body = await parseJsonBody(req);
  const profile = parseProfileFromBody(body);

  if (!profile) {
    return fail(400, invalidProfileError());
  }

  const client = createS3Client(profile);

  try {
    const result = await client.send(new ListBucketsCommand({}));
    return ok(mapListBucketsResult(result));
  } catch (err) {
    return fail(400, mapS3Error(err));
  }
}

export async function listObjectsHandler(req: Request): Promise<Response> {
  const body = await parseJsonBody(req);
  const parsed = parseListObjectsInput(body);

  if (!parsed.ok) {
    return fail(400, parsed.error);
  }

  const { profile, bucket, prefix, continuationToken, maxKeys } = parsed.data;
  const client = createS3Client(profile);

  try {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        Delimiter: "/",
        MaxKeys: maxKeys,
      }),
    );

    return ok(mapListObjectsResult(result, bucket, prefix));
  } catch (err) {
    return fail(400, mapS3Error(err));
  }
}
