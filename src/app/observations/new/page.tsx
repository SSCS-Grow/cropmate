"use client";

import { useState } from "react";
import PhotoUploader from "@/components/PhotoUploader";

export default function NewObservationPage() {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(formData: FormData) {
    setBusy(true);
    try {
      const payload = {
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        lat: Number(formData.get("lat") || 0),
        lng: Number(formData.get("lng") || 0),
        pest_id: (formData.get("pest_id") as string) || null,
        disease_id: (formData.get("disease_id") as string) || null,
        garden_id: (formData.get("garden_id") as string) || null,
        photo_url: photoUrl,
        taken_at: new Date().toISOString(),
      };

      const res = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kunne ikke oprette observation");
      window.location.href = `/observations/${json.item.id}`;
    } catch (e: any) {
      alert(e.message ?? e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ny observation</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          handleSubmit(fd);
        }}
        className="space-y-4"
      >
        <input name="title" placeholder="Titel" className="w-full border rounded-xl p-3" required />
        <textarea name="description" placeholder="Beskrivelse" className="w-full border rounded-xl p-3" rows={4} />
        <div className="grid grid-cols-2 gap-3">
          <input name="lat" type="number" step="0.000001" placeholder="Lat" className="border rounded-xl p-3" required />
          <input name="lng" type="number" step="0.000001" placeholder="Lng" className="border rounded-xl p-3" required />
        </div>

        <PhotoUploader onUploaded={(url) => setPhotoUrl(url)} />

        <button
          type="submit"
          className="rounded-2xl px-5 py-3 bg-green-600 text-white disabled:opacity-50"
          disabled={busy}
        >
          {busy ? "Gemmer..." : "Gem observation"}
        </button>
      </form>
    </div>
  );
}
