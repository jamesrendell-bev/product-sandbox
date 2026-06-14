/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BEV_API_KEY: string;
  readonly VITE_BEV_API_BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
