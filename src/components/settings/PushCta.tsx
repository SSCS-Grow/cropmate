"use client";
import { usePushSubscribe } from "@/hooks/usePushSubscribe";

export default function PushCta() {
  const status = usePushSubscribe();

  return (
    <div className="p-4 rounded-2xl border border-gray-200 shadow-sm">
      <div className="font-semibold mb-1">Notifikationer</div>
      <div className="text-sm opacity-70">
        {status === "subscribed"
          ? "Push-notifikationer er aktiveret ✅"
          : status === "blocked"
          ? "Blokeret i browseren – tjek notifikations-indstillinger"
          : status === "unsupported"
          ? "Ikke understøttet i denne browser"
          : "Tilmelding pågår…"}
      </div>
    </div>
  );
}
