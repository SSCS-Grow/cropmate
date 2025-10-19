"use client";

export default function AdminRow({ o }: { o: any }) {
  async function setStatus(status: "active" | "hidden" | "flagged") {
    const res = await fetch(`/api/observations/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert((await res.json()).error ?? "Fejl");
      return;
    }
    location.reload();
  }

  async function doDelete() {
    if (!confirm("Slet observation?")) return;
    const res = await fetch(`/api/observations/${o.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json()).error ?? "Fejl");
      return;
    }
    location.reload();
  }

  return (
    <div className="grid grid-cols-6 items-center px-2 py-1 border rounded-xl">
      <a href={`/observations/${o.id}`} className="truncate hover:underline">{o.title}</a>
      <div className="text-xs truncate">{o.user_id ?? "—"}</div>
      <div className="text-xs">{o.status}</div>
      <div className="text-xs">{new Date(o.created_at).toLocaleString()}</div>
      <div>{o.photo_url ? <img src={o.photo_url} className="w-16 h-12 object-cover rounded" /> : "—"}</div>
      <div className="flex gap-2 justify-end">
        <button onClick={() => setStatus("active")} className="px-2 py-1 border rounded">Active</button>
        <button onClick={() => setStatus("hidden")} className="px-2 py-1 border rounded">Skjul</button>
        <button onClick={() => setStatus("flagged")} className="px-2 py-1 border rounded">Flag</button>
        <button onClick={doDelete} className="px-2 py-1 border rounded text-red-600">Slet</button>
      </div>
    </div>
  );
}
