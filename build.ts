import { mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

const result = await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: "dist",
  sourcemap: "external",
  target: "browser",
  minify: true,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Built browser assets into dist/");
