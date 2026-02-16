#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const entrypoint = path.resolve(packageRoot, "src", "index.ts");

const args = process.argv.slice(2);

let hostArg;
let portArg;

if (args.includes("-h") || args.includes("--help")) {
  console.log("storage-explorer\n");
  console.log("Runs the Storage Explorer server using Bun.");
  console.log("\nUsage:");
  console.log("  npx storage-explorer [--port 3000] [--host 127.0.0.1]");
  console.log("\nOptions:");
  console.log("  -h, --help       Show help");
  console.log("  -v, --version    Show package version");
  console.log("  --port <number>  Port to listen on (default: 3000)");
  console.log("  --host <addr>    Host to bind (default: 127.0.0.1)");
  process.exit(0);
}

if (args.includes("-v") || args.includes("--version")) {
  const packageJsonPath = path.resolve(packageRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  console.log(packageJson.version ?? "unknown");
  process.exit(0);
}

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === "--port") {
    const value = Number(args[i + 1]);
    if (!Number.isFinite(value) || value <= 0 || value > 65535) {
      console.error("Invalid --port value.");
      process.exit(1);
    }
    portArg = String(value);
    i += 1;
    continue;
  }

  if (arg === "--host") {
    const value = args[i + 1];
    if (!value) {
      console.error("Missing --host value.");
      process.exit(1);
    }
    hostArg = value;
    i += 1;
  }
}

try {
  await access(entrypoint);
} catch {
  console.error("Missing src/index.ts in package.");
  process.exit(1);
}

const child = spawn("bun", [entrypoint], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "production",
    ...(portArg ? { PORT: portArg } : {}),
    ...(hostArg ? { HOST: hostArg } : {}),
  },
});

child.on("error", error => {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    console.error("Bun is required to run storage-explorer.");
    console.error("Install Bun: https://bun.sh/docs/installation");
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
