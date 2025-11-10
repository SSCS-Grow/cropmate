'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabaseBrowser from '@/lib/supabaseBrowser';
import Link from 'next/link';

type Crop = { id: string; name: string };

type LogRow = {
  id: string;
  user_id: string;
  crop_id: string;
  entry_date: string | null;
  text: string | null;
  photo_url: string | null;
  created_at?: string;
};

export default function CropLogsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // 1) Session
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id || null;
        if (!uid) {
          alert('Log ind for at bruge logbog');
          router.push('/');
          return;
        }
        if (!alive) return;
        setUserId(uid);

        // 2) Afgrødenavn
        const { data: c, error: cErr } = await supabase
          .from('crops')
          .select('id, name')
          .eq('id', id)
          .maybeSingle();
        if (cErr || !c) {
          alert('Afgrøde ikke fundet');
          router.push('/crops');
          return;
        }
        if (!alive) return;
        setCrop(c as Crop);

        // 3) Logs (brug én order i SQL, sorter resten i JS)
        const { data: l, error: lErr } = await supabase
          .from('logs')
          .select('*')
          .eq('user_id', uid)
          .eq('crop_id', id)
          .order('entry_date', { ascending: false }); // én order er nok

        if (lErr) {
          alert('Kunne ikke hente logs.');
          setLogs([]);
        } else {
          // fallback-sortering på created_at hvis entry_date er ens eller null
          const sorted = (l || []).sort((a: any, b: any) => {
            const aKey = (a.entry_date || a.created_at || '').toString();
            const bKey = (b.entry_date || b.created_at || '').toString();
            return bKey.localeCompare(aKey);
          });
          setLogs(sorted as LogRow[]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, router, supabase]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !crop) return;
    if (!note && !file) {
      alert('Skriv en note eller vælg et billede.');
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;

      if (file) {
        // Upload til Storage: logs/{userId}/{cropId}/timestamp_filename
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const safeName = file.name.replace(/\s+/g, '_');
        const path = `${userId}/${crop.id}/${ts}_${safeName}`;

        const up = await supabase.storage.from('logs').upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (up.error) throw up.error;

        // Hent public URL (bucket er public)
        const { data: pub } = supabase.storage.from('logs').getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const entry_date = new Date().toISOString().slice(0, 10);
      const { data: ins, error: insErr } = await supabase
        .from('logs')
        .insert({
          user_id: userId,
          crop_id: crop.id,
          entry_date,
          text: note || null,
          photo_url,
        })
        .select('*')
        .single();

      if (insErr) throw insErr;

      // Ryd form, prepend i UI
      setNote('');
      setFile(null);
      setLogs((prev) => [ins as LogRow, ...prev]);
    } catch (e) {
      alert(
        'Kunne ikke gemme logbogen. Tjek at du er logget ind og at Storage bucket "logs" findes.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="opacity-60 p-4">Indlæser logbog…</div>;
  if (!crop) return <div className="p-4">Afgrøde ikke fundet.</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Logbog: {crop.name}</h1>
          <p className="text-sm opacity-70">
            <Link
              href={`/crops/${crop.id}`}
              className="underline decoration-slate-300 hover:decoration-slate-900"
            >
              ← Tilbage til {crop.name}
            </Link>
          </p>
        </div>
      </header>

      {/* Form */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-3">Ny log</h3>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Note (valgfri)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border rounded px-3 py-2 text-sm min-h-[80px]"
              placeholder="Hvad skete der i dag? (vanding, gødning, skadedyr, blomstring, osv.)"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm">Foto (valgfrit)</span>
            <input type="file" accept="image/*" onChange={onFileChange} />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-2 rounded bg-slate-900 text-white text-sm"
            >
              {submitting ? 'Gemmer…' : 'Gem log'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNote('');
                setFile(null);
              }}
              className="px-3 py-2 rounded border border-slate-300 text-slate-900 text-sm hover:bg-slate-50"
            >
              Ryd
            </button>
          </div>
        </form>
      </section>

      {/* Liste */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
        <h3 className="font-medium mb-3">Tidligere logs</h3>
        {!logs.length && (
          <p className="text-sm opacity-70">
            Ingen logs endnu. Tilføj din første ovenfor 🌱
          </p>
        )}
        <ul className="grid gap-3">
          {logs.map((log) => (
            <li key={log.id} className="p-3 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                {log.photo_url && (
                  <img
                    src={log.photo_url}
                    alt="Logfoto"
                    className="w-28 h-28 object-cover rounded"
                    loading="lazy"
                  />
                )}
                <div className="flex-1">
                  <div className="text-sm opacity-70">
                    {log.entry_date || log.created_at?.slice(0, 10)}
                  </div>
                  {log.text ? (
                    <p className="text-sm mt-1 whitespace-pre-line">
                      {log.text}
                    </p>
                  ) : (
                    <p className="text-sm opacity-60">—</p>
                  )}
                  {/* (Valgfrit) Slet-knap kan tilføjes senere */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
