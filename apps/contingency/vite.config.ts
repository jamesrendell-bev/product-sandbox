import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./server/index";

// Single local dev server: Vite serves the React app AND mounts the /api/*
// routes in-process (see server/index.ts). No Netlify CLI needed.
export default defineConfig(({ mode }) => {
  // Load .env (incl. non-VITE_ vars like ANTHROPIC_API_KEY / BEV_API_KEY) and
  // hand them to the server plugin, which runs in Node.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), apiPlugin(env)],
    // Base path: '/' locally; '/product-sandbox/contingency/' on GitLab Pages (APP_BASE set in CI).
    base: process.env.APP_BASE ?? "/",
    server: { port: 5180, strictPort: true },
  };
});
