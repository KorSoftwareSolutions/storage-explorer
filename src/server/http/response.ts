export type ApiErrorPayload = {
  message: string;
  code?: string;
};

export function ok<T>(data: T): Response {
  return Response.json({ ok: true, data });
}

export function fail(status: number, error: ApiErrorPayload): Response {
  return Response.json({ ok: false, error }, { status });
}
