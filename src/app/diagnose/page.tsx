"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Loader2, Save, Leaf, Sparkles, AlertTriangle, Camera } from "lucide-react";
import useAuthSession from "@/hooks/useAuthSession";
import useSupabaseBrowser from "@/hooks/useSupabaseBrowser";

const styleOptions = [
  {
    value: "eco_only",
    label: "Kun økologisk",
    description: "Vis kun naturlige råd og midler",
  },
  {
    value: "eco_first",
    label: "Primært økologisk",
    description: "Start med øko, vis kemi som sidste udvej",
  },
  {
    value: "balanced",
    label: "Afbalanceret",
    description: "Kombination øko/kemi med advarsler",
  },
  {
    value: "allows_chemical",
    label: "Kemi tilladt",
    description: "Vis alle forslag, også kemiske",
  },
];

export default function DiagnosePage() {
  const supabase = useSupabaseBrowser();
  const { session, loading: authLoading } = useAuthSession();

  const [plant, setPlant] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [style, setStyle] = useState(styleOptions[0]?.value ?? "eco_only");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  function reset() {
    setPlant("");
    setSymptoms("");
    setStyle(styleOptions[0]?.value ?? "eco_only");
    setFile(null);
    setPreviewUrl("");
    setUploadedUrl("");
    setResult(null);
    setError(null);
    setSaveMsg("");
    setMatches([]);
  }

  async function uploadFile() {
    if (!supabase || !file) return "";
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("diagnose-uploads")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "image/jpeg",
      });
    if (error) throw error;
    const { data: signed } = await supabase.storage
      .from("diagnose-uploads")
      .createSignedUrl(path, 60 * 60);
    return signed?.signedUrl || "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Skriv symptomer først");
      return;
    }
    if (!supabase) return;

    setLoading(true);
    setResult(null);
    setMatches([]);
    setError(null);
    setSaveMsg("");
    try {
      let imgUrl = uploadedUrl.trim();
      if (!imgUrl && file) imgUrl = await uploadFile();

      const response = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant: plant || undefined,
          symptoms,
          imageUrls: imgUrl ? [imgUrl] : undefined,
          growingStyle: style,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Diagnostics API-fejl");
      setResult({ ...payload.result, _imageUrl: imgUrl || "" });
      setMatches(payload.matches || []);
    } catch (err: any) {
      setError(err?.message || "Kunne ikke færdiggøre diagnosen");
    } finally {
      setLoading(false);
    }
  }

  async function saveObservation() {
    if (!supabase || !result || !session?.user) {
      setSaveMsg("Log ind for at gemme observationer");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      const topDiag = (result.diagnoses || [])[0]?.name || null;
      const { error } = await supabase.from("observations").insert({
        plant: plant || null,
        symptoms_text: symptoms,
        diagnosis: topDiag,
        photo_url: result._imageUrl || null,
      });
      if (error) throw error;
      setSaveMsg("Observation gemt");
    } catch (err: any) {
      setSaveMsg(err?.message || "Kunne ikke gemme observation");
    } finally {
      setSaving(false);
    }
  }

  const topDiagnoses = (result?.diagnoses || []).slice(0, 3);
  const redFlags = result?.red_flags || [];
  const showLoginNotice = !authLoading && !session;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Diagnose V1
        </p>
        <h1 className="text-3xl font-semibold">AI-diagnose</h1>
        <p className="text-sm text-slate-600">
          Upload et foto og beskriv symptomerne – få 2-3 sandsynlige diagnoser,
          forklaring og anbefalede handlinger.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-slate-700">Plante (valgfri)</span>
            <input
              value={plant}
              onChange={(e) => setPlant(e.target.value)}
              placeholder="Tomat, æbletræ, jordbær…"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium text-slate-700">Dyrkningsstil</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            >
              {styleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-700">Symptomer*</span>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            required
            placeholder="Gule pletter på blade, hvide larver under bladene, muglugt…"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm min-h-[140px]"
          />
          <span className="text-xs text-slate-500">
            Jo mere specifik du er, jo bedre bliver diagnosen.
          </span>
        </label>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <label className="font-medium text-slate-700 text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" /> Foto (valgfrit)
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl("");
                  setUploadedUrl(" ");
                }}
                className="text-xs text-slate-500 underline"
              >
                Fjern
              </button>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f) {
                setPreviewUrl(URL.createObjectURL(f));
                setUploadedUrl("");
              } else {
                setPreviewUrl("");
              }
            }}
          />
          <div className="text-xs text-slate-500">Eller indsæt direkte URL:</div>
          <input
            value={uploadedUrl}
            onChange={(e) => setUploadedUrl(e.target.value)}
            placeholder="https://…"
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
          {previewUrl && (
            <div className="relative mt-2 w-full overflow-hidden rounded-2xl border">
              <Image
                src={previewUrl}
                alt="Preview"
                width={640}
                height={360}
                className="w-full object-cover"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold",
            loading
              ? "bg-slate-200 text-slate-500"
              : "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyserer…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Diagnosér
            </>
          )}
        </button>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}
      </form>

      {result && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Forslag</h2>
              <p className="text-sm text-slate-600">
                Baseret på dine symptomer og vores bibliotek.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={saveObservation}
                disabled={saving || !!showLoginNotice}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm",
                  saving || showLoginNotice
                    ? "border-slate-200 text-slate-400"
                    : "border-emerald-600 text-emerald-700 hover:bg-emerald-50",
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gemmer…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Gem som observation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Start ny diagnose
              </button>
            </div>
          </div>

          {showLoginNotice && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Log ind for at gemme observationer.
            </div>
          )}

          {!!saveMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {saveMsg}
            </div>
          )}

          <div className="grid gap-4">
            {topDiagnoses.map((diagnosis: any, idx: number) => (
              <div
                key={`${diagnosis.name}-${idx}`}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Forslag {idx + 1}
                    </div>
                    <h3 className="text-lg font-semibold">{diagnosis.name}</h3>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {Math.round((diagnosis.confidence || 0) * 100)}%
                  </span>
                </div>

                {diagnosis.rationale && (
                  <p className="mt-2 text-sm text-slate-600">
                    {diagnosis.rationale}
                  </p>
                )}

                {Array.isArray(diagnosis.recommended_actions) && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium mb-1">Handling</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {diagnosis.recommended_actions.map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(diagnosis.references) && diagnosis.references.length > 0 && (
                  <div className="mt-3 text-sm">
                    <div className="font-medium mb-1">Læs mere</div>
                    <ul className="space-y-2">
                      {diagnosis.references.map((ref: any, refIdx: number) => (
                        <li key={refIdx} className="flex items-center gap-2">
                          <Leaf className="h-3 w-3 text-emerald-600" />
                          {ref.slug ? (
                            <a
                              href={`/library/${ref.slug}`}
                              className="underline text-slate-700"
                            >
                              {ref.title || ref.slug}
                            </a>
                          ) : (
                            <span>{ref.title || "Ukendt kilde"}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!!redFlags.length && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-semibold mb-1">Red flags</div>
                <ul className="list-disc pl-5 space-y-1">
                  {redFlags.map((flag: string, idx: number) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!!matches.length && (
            <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="font-semibold">Bibliotekskilder brugt i analysen</div>
              <ul className="grid gap-2">
                {matches.slice(0, 4).map((match: any) => (
                  <li key={match.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="text-sm font-semibold">{match.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      Relevans {Math.round((match.score || 0) * 100)}%
                      {match.slug && (
                        <a
                          href={`/library/${match.slug}`}
                          className="inline-flex items-center gap-1 text-emerald-600"
                        >
                          Læs mere →
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
