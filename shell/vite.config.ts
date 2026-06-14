import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path is set at build time for GitLab Pages (served under /<project>/).
// Locally and on a root domain it stays '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.SANDBOX_BASE ?? '/',
  server: { port: 5190, strictPort: true },
})
