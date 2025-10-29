"use client";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

function sbBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function DiagnosePage() {
  const s = useMemo(() => sbBrowser(), []);
  const [plant, setPlant] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  async function uploadFile() {
    if (!file) return "";
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await s.storage.from("diagnose-uploads").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (error) throw error;
    const { data: signed } = await s.storage.from("diagnose-uploads").createSignedUrl(path, 60 * 60);
    return signed?.signedUrl || "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setSaveMsg("");
    try {
      let imgUrl = uploadedUrl.trim();
      if (!imgUrl && file) imgUrl = await uploadFile();

      const r = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: plant || undefined,
          symptoms,
          imageUrls: imgUrl ? [imgUrl] : undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Fejl i diagnose");
      setResult({ ...j.result, _imageUrl: imgUrl || "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveObservation() {
    if (!result) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const topDiag = (result.diagnoses || [])[0]?.name || null;
      const r = await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: plant || null,
          symptoms_text: symptoms,
          diagnosis: topDiag,
          photo_url: result._imageUrl || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Kunne ikke gemme observation");
      setSaveMsg("Observation gemt ✔");
    } catch (e: any) {
      setSaveMsg(`Fejl: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AI-diagnose</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Plante (valgfri)</label>
          <input
            value={plant}
            onChange={(e) => setPlant(e.target.value)}
            className="mt-1 w-full rounded-xl border p-2"
            placeholder="Tomat, æbletræ, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Symptomer (krævet)</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="mt-1 w-full rounded-xl border p-2 h-28"
            placeholder="Gule pletter, krøllede blade, mug, …"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="block text-sm font-medium">Foto (valgfrit)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="text-xs opacity-70">Eller indsæt direkte URL:</div>
          <input
            value={uploadedUrl}
            onChange={(e) => setUploadedUrl(e.target.value)}
            className="w-full rounded-xl border p-2"
            placeholder="https://…"
          />
        </div>

        <button disabled={loading} className="rounded-2xl border px-4 py-2 disabled:opacity-50">
          {loading ? "Analyserer…" : "Diagnosér"}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Forslag</h2>
            <button
              onClick={saveObservation}
              disabled={saving}
              className="rounded-2xl border px-3 py-1.5 text-sm disabled:opacity-50"
              title="Gem plante, symptomer, øverste diagnose og evt. foto som observation"
            >
              {saving ? "Gemmer…" : "Gem som observation"}
            </button>
          </div>

          {!!saveMsg && <div className="text-sm">{saveMsg}</div>}

          {(result.diagnoses || []).slice(0, 3).map((d: any, i: number) => (
            <div key={i} className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.name}</span>
                <span className="text-sm opacity-70">{Math.round((d.confidence || 0) * 100)}%</span>
              </div>
              <p className="text-sm">{d.rationale}</p>

              {Array.isArray(d.references) && d.references.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium mb-1">Kilder</div>
                  <ul className="list-disc pl-5">
                    {d.references.map((r: any, idx: number) => (
                      <li key={idx}>
                        {r.slug ? (
                          <a className="underline" href={`/library/${r.slug}`}>
                            {r.title || r.slug}
                          </a>
                        ) : (
                          <span>{r.title || "Ukendt kilde"}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(d.recommended_actions) && d.recommended_actions.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium mb-1">Handling</div>
                  <ul className="list-disc pl-5">
                    {d.recommended_actions.map((a: string, idx: number) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {!!(result.red_flags || []).length && (
            <div className="rounded-2xl border p-4">
              <div className="font-medium mb-1">Red flags</div>
              <ul className="list-disc pl-5 text-sm">
                {result.red_flags.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
