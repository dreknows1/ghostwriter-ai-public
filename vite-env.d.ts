/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL prefixed onto relative API paths when running as a native Capacitor app.
   * Not `readonly`: lib/api.test.ts mutates it directly to exercise both branches.
   */
  VITE_API_BASE?: string;
  /**
   * RevenueCat public iOS (App Store) API key. Used only on native to
   * configure the RevenueCat SDK (services/entitlementService.ts). Absent on web.
   */
  readonly VITE_REVENUECAT_IOS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
