import { serve } from "bun";
import index from "./index.html";
import { s3Routes } from "./server/routes/s3Routes";

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "127.0.0.1";

const server = serve({
  port,
  hostname,
  routes: {
    ...s3Routes,
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
