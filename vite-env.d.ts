/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL prefixed onto relative API paths when running as a native Capacitor app.
   * Not `readonly`: lib/api.test.ts mutates it directly to exercise both branches.
   */
  VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
