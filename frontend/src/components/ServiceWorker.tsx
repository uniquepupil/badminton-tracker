"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    // Wake the Render API as soon as the frontend loads. This intentionally
    // runs in parallel and never delays the UI or authentication flow.
    void fetch("/api/health", {
      method: "GET",
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return null;
}
