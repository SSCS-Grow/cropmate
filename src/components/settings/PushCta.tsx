"use client";
import Link from "next/link";
import { BellRing, CheckCircle } from "lucide-react";
import { usePushSubscribe } from "@/hooks/usePushSubscribe";

export default function PushCta() {
  const { status, subscribe, error } = usePushSubscribe();
  const isReady = status === "ready" || status === "checking";
  const isPrompting = status === "prompting";
  const isSubscribed = status === "subscribed";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-emerald-600" />
        <div>
          <div className="font-semibold">Notifikationer</div>
          <p className="text-sm text-slate-600">
            Få frost- og vandingsvarsler direkte på din enhed.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={subscribe}
          disabled={!isReady || isPrompting || isSubscribed}
          className={
            isSubscribed
              ? "inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800"
              : "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500"
          }
        >
          {isSubscribed ? (
            <>
              <CheckCircle className="h-4 w-4" /> Aktiveret
            </>
          ) : isPrompting ? (
            "Aktiverer…"
          ) : (
            "Aktiver push"
          )}
        </button>
        <Link href="/settings/alerts" className="text-xs text-slate-500 underline">
          Juster alert-præferencer
        </Link>
      </div>

      <div className="text-xs text-slate-500">
        Status: {status === "unsupported"
          ? "Ikke understøttet i denne browser"
          : status === "blocked"
          ? "Blokeret – tjek browserens rettigheder"
          : status === "error"
          ? error || "Ukendt fejl"
          : isSubscribed
          ? "Aktiveret"
          : "Ikke aktiveret endnu"}
      </div>
    </div>
  );
}
