"use client";

import { useEffect } from "react";
import { storage } from "@/lib/storage";

/**
 * One-time startup housekeeping for the local data store. All of it has to run
 * client-side (static export pre-renders with no localStorage), and none of it
 * renders anything.
 */
export function StorageBootstrap() {
  useEffect(() => {
    // Records which schema wrote this device's data. Nothing migrates today,
    // but a future version can only branch on it if it was stamped all along.
    storage.ensureSchemaVersion();

    // Safari evicts localStorage for sites left unused for ~7 days. Asking for
    // persistence is the one lever a backend-less app has against losing a
    // member's whole year of records; a refusal is a normal outcome, not an error.
    void navigator.storage?.persist?.().catch(() => {});
  }, []);

  return null;
}
