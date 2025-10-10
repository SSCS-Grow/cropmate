"use client";
import { useEffect } from "react";

export default function ServiceWorkerReady() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registrér SW hvis den ikke allerede er registreret
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((err) => console.error("SW register error:", err));
      }
    });
  }, []);
  return null;
}
