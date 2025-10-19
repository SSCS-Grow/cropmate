"use client";

import { useState } from "react";

export default function ObservationActions({
  id,
  canEdit,
  isAdmin,
  currentStatus,
}: { id: string; canEdit: boolean; isAdmin: boolean; currentStatus: string }) {
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    if (!confirm("Slet observation?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/observations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fejl");
      location.href = "/observations";
    } catch (e: any) {
      alert(e.message ?? e);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "active" | "hidden" | "flagged") {
    setBusy(true);
    try {
      const res = await fetch(`/api/observations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fejl");
      location.reload();
    } catch (e: any) {
      alert(e.message ?? e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canEdit && (
        <>
          <button
            onClick={doDelete}
            disabled={busy}
            className="rounded-xl px-4 py-2 bg-red-600 text-white disabled:opacity-50"
          >
            Slet
          </button>
        </>
      )}
      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => setStatus("active")} disabled={busy || currentStatus === "active"} className="rounded-xl px-3 py-2 border">
            Sæt active
          </button>
          <button onClick={() => setStatus("hidden")} disabled={busy || currentStatus === "hidden"} className="rounded-xl px-3 py-2 border">
            Skjul
          </button>
          <button onClick={() => setStatus("flagged")} disabled={busy || currentStatus === "flagged"} className="rounded-xl px-3 py-2 border">
            Flag
          </button>
        </div>
      )}
    </div>
  );
}
