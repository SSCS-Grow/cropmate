"use client";
import { useEffect, useState } from "react";

export default function AdminAIPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");

  async function loadStats() {
    const r = await fetch("/api/admin/ai-stats");
    const j = await r.json();
    setStats(j);
  }
  useEffect(()=>{ loadStats(); },[]);

  async function reindexAll() {
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/reindex-library", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Reindex fejlede");
      setMsg(`Reindex OK – embeddings genereret: ${j.count}`);
      await loadStats();
    } catch (e:any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI / RAG – Admin</h1>

      <div className="rounded-2xl border p-4 space-y-2">
        <div className="font-medium">Status</div>
        <div className="text-sm opacity-80">
          {stats ? (
            <div className="space-y-1">
              <div>Biblioteksposter: <b>{stats.items ?? "ukendt"}</b></div>
              <div>Embeddings: <b>{stats.embeddings ?? "ukendt"}</b></div>
            </div>
          ) : "Indlæser…"}
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="font-medium">Reindex</div>
        <button
          onClick={reindexAll}
          disabled={loading}
          className="rounded-2xl border px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Kører…" : "Genberegn embeddings nu"}
        </button>
        {msg && <div className="text-sm">{msg}</div>}
      </div>
    </div>
  );
}
