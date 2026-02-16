# s3-explorer

Read-only AWS S3 / S3-compatible explorer built with Bun + React.

## Run with npm / npx

```bash
npx storage-explorer
```

Requires Bun on your machine because the runtime server uses Bun.

Optional flags:

```bash
npx storage-explorer --port 3000 --host 127.0.0.1
```

## Install

```bash
bun install
```

## Run in development

```bash
bun dev
```

## Build

```bash
bun run build
```

## What it does

- Save multiple S3 connection profiles in browser `localStorage`
- Test a profile connection
- List buckets
- Open a known bucket manually (for keys without ListBuckets permission)
- Browse folders and files inside a bucket using prefix navigation
- Load next pages of objects (default page size: `200`)

## Profile fields

- Endpoint URL (required)
- Access Key ID (required)
- Secret Access Key (required)
- Region (optional, defaults to `us-east-1`)
- Force path style (enabled by default for better S3-compatible support)

## Security note

Credentials are stored in browser `localStorage` on your machine.
This is convenient, but less secure than a dedicated secrets manager.
Treat this app as a local/internal tool and avoid using it on untrusted shared browsers.

## API routes

The frontend calls Bun server endpoints, and the server talks to S3:

- `POST /api/s3/test-connection`
- `POST /api/s3/list-buckets`
- `POST /api/s3/list-objects`

All routes are read-only.
