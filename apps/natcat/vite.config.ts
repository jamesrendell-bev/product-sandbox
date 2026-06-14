import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BEV_API_KEY / VITE_BEV_API_BASE_URL are exposed to the client natively by
// Vite (only VITE_-prefixed vars are). Set them in .env.local (gitignored) for
// local live mode, or in the Netlify build env. No custom `define` needed.
//
// PRODUCTION: route via a thin server proxy that holds the key — a build-time
// env var is baked into the public bundle and would be readable. Stub mode (no
// key) is the safe default for a public demo.
// Base path: '/' locally; '/product-sandbox/natcat/' on GitLab Pages (APP_BASE set in CI).
export default defineConfig({
  plugins: [react()],
  base: process.env.APP_BASE ?? "/",
  server: { port: 5173 },
});
