"use client";
import { useState } from "react";

export default function ImageUploader({ pestId, onSaved }: { pestId: string; onSaved?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const metaRes = await fetch(`/api/library/${pestId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const { uploadUrl, path, error } = await metaRes.json();
      if (error) throw new Error(error);

      const upRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!upRes.ok) throw new Error("Upload failed");

      // gem reference i DB
      await fetch("/api/library/" + pestId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // no-op, but ensures auth context
      });

      await fetch("/api/rpc/insert_pest_image", { // valgfri: hvis du laver en RPC
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pest_id: pestId, path, alt: file.name }),
      }).catch(() => {});

      onSaved?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input type="file" accept="image/*" onChange={onSelect} disabled={busy}/>
      {busy && <span>Uploader…</span>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
