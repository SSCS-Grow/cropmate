"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addHazardPest,
  removeHazardPest,
  addHazardDisease,
  removeHazardDisease,
} from "@/app/hazards/[id]/actions";

type Option = { id: string; slug: string; name_da: string };

function Section({
  title,
  placeholder,
  options,
  selected,
  onAdd,
  onRemove,
  pending,
}: {
  title: string;
  placeholder: string;
  options: Option[];
  selected: Option[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options.slice(0, 50);
    return options
      .filter(
        (o) =>
          o.name_da.toLowerCase().includes(s) ||
          (o.slug && o.slug.toLowerCase().includes(s))
      )
      .slice(0, 50);
  }, [q, options]);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  return (
    <div>
      <div className="font-semibold mb-2">{title}</div>

      <div className="flex items-center gap-2 mb-3">
        <input
          className="border rounded-xl p-2 w-full"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {pending && <span className="text-sm text-gray-500">Opdaterer…</span>}
      </div>

      {/* Resultater / valg */}
      <div className="grid md:grid-cols-2 gap-2 mb-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">Ingen match</div>
        ) : (
          filtered.map((o) => {
            const already = selectedIds.has(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => !already && onAdd(o.id)}
                className={`text-left px-3 py-2 border rounded-xl hover:bg-gray-50 ${
                  already ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={o.slug}
              >
                <div className="font-medium">{o.name_da}</div>
                <div className="text-xs text-gray-500">{o.slug}</div>
              </button>
            );
          })
        )}
      </div>

      {/* Valgte tags */}
      <div className="flex flex-wrap gap-2">
        {selected.map((o) => (
          <span key={o.id} className="px-3 py-1 border rounded-2xl">
            {o.name_da}
            <button
              className="ml-2 text-gray-500"
              onClick={() => onRemove(o.id)}
              aria-label={`Fjern ${o.name_da}`}
            >
              ×
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-sm text-gray-500">Ingen tags endnu</span>
        )}
      </div>
    </div>
  );
}

export default function HazardTags({ hazardId }: { hazardId: string }) {
  const [pests, setPests] = useState<Option[]>([]);
  const [diseases, setDiseases] = useState<Option[]>([]);
  const [selPests, setSelPests] = useState<Option[]>([]);
  const [selDiseases, setSelDiseases] = useState<Option[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const headers = { apikey };

      const q = (path: string) =>
        fetch(`${base}/rest/v1/${path}`, { headers }).then((r) => r.json());

      const [allPests, allDiseases, hrPests, hrDiseases] = await Promise.all([
        q(`pests?select=id,slug,name_da`),
        q(`diseases?select=id,slug,name_da`),
        q(
          `hazard_report_pests?hazard_id=eq.${hazardId}&select=pest_id,pests(id,slug,name_da)`
        ),
        q(
          `hazard_report_diseases?hazard_id=eq.${hazardId}&select=disease_id,diseases(id,slug,name_da)`
        ),
      ]);

      setPests(allPests ?? []);
      setDiseases(allDiseases ?? []);
      setSelPests((hrPests ?? []).map((r: any) => r.pests));
      setSelDiseases((hrDiseases ?? []).map((r: any) => r.diseases));
    })();
  }, [hazardId]);

  function addPest(id: string) {
    const opt = pests.find((p) => p.id === id);
    if (!opt) return;
    startTransition(async () => {
      await addHazardPest(hazardId, id);
      setSelPests((prev) => (prev.some((p) => p.id === id) ? prev : [...prev, opt]));
    });
  }

  function removePest(id: string) {
    startTransition(async () => {
      await removeHazardPest(hazardId, id);
      setSelPests((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function addDisease(id: string) {
    const opt = diseases.find((d) => d.id === id);
    if (!opt) return;
    startTransition(async () => {
      await addHazardDisease(hazardId, id);
      setSelDiseases((prev) =>
        prev.some((d) => d.id === id) ? prev : [...prev, opt]
      );
    });
  }

  function removeDisease(id: string) {
    startTransition(async () => {
      await removeHazardDisease(hazardId, id);
      setSelDiseases((prev) => prev.filter((d) => d.id !== id));
    });
  }

  return (
    <div className="space-y-8">
      <Section
        title="Skadedyr"
        placeholder="Søg skadedyr…"
        options={pests}
        selected={selPests}
        onAdd={addPest}
        onRemove={removePest}
        pending={isPending}
      />
      <Section
        title="Sygdomme"
        placeholder="Søg sygdomme…"
        options={diseases}
        selected={selDiseases}
        onAdd={addDisease}
        onRemove={removeDisease}
        pending={isPending}
      />
    </div>
  );
}
