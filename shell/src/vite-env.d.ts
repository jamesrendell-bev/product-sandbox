/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANDBOX_PASSCODE?: string
  readonly VITE_URL_NATCAT?: string
  readonly VITE_URL_CONTINGENCY?: string
  readonly VITE_URL_EDMCEDE?: string
  readonly VITE_URL_EXPOSURE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
