'use client';

import { useCallback, useEffect, useState } from 'react';
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser';

type TaskRow = {
  id: string;
  user_id: string;
  title: string | null;
  note: string | null;
  due_at: string | null;
  created_at: string;
  // Én af disse (eller begge) findes typisk – ret hvis dine felter hedder andet:
  done_at: string | null; // ← tilpas evt. navn
  completed_at: string | null; // ← tilpas evt. navn
};

type TabKey = 'open' | 'done';

function isDone(t: TaskRow) {
  // Opdater denne ifm. dit faktiske skema (hvis kun 'done_at' findes så brug den alene)
  return Boolean(t.done_at || t.completed_at);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function TasksPage() {
  const supabase = useSupabaseBrowser();
  const [tab, setTab] = useState<TabKey>('open');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<TaskRow[]>([]);

  // Henter opgaver for den aktuelle bruger
  const load = useCallback(async () => {
    if (!supabase) return;
    setErr(null);
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Basis-select – begræns felter for hastighed
      const baseSelect =
        'id, user_id, title, note, due_at, created_at, done_at, completed_at';

      let q = supabase
        .from('plant_tasks' as any)
        .select(baseSelect)
        .eq('user_id', uid)
        .order('due_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (tab === 'open') {
        // ÅBNE = ikke-færdige
        q = q.or('done_at.is.null,completed_at.is.null');
      } else {
        // FÆRDIGE = mindst én er sat
        q = q.or('done_at.not.is.null,completed_at.not.is.null');
      }

      const { data, error } = await q;
      if (error) throw error;

      setRows((data || []) as TaskRow[]);
    } catch (e: any) {
      setErr(e?.message || 'Kunne ikke hente opgaver.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, tab]);

  // Initial + når tab ændrer sig
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!alive) return;
      await load();
    };
    // asynkront kick for at undgå “set-state-in-effect”-reglen
    const t = setTimeout(() => {
      void run();
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [load]);

  // Markér som færdig
  const markDone = useCallback(
    async (id: string) => {
      if (!supabase) return;
      try {
        // Vælg det felt du reelt bruger til “færdig” (done_at eller completed_at)
        const payload = { done_at: new Date().toISOString() }; // ← ret hvis dit felt er 'completed_at'
        const { error } = await supabase
          .from('plant_tasks' as any)
          .update(payload)
          .eq('id', id);
        if (error) throw error;

        // Optimistisk opdatering
        setRows((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, ...payload, completed_at: t.completed_at }
              : t,
          ),
        );
      } catch (e: any) {
        alert(e?.message || 'Kunne ikke markere som færdig.');
      }
    },
    [supabase],
  );

  // Fortryd færdig (åbn den igen)
  const uncomplete = useCallback(
    async (id: string) => {
      if (!supabase) return;
      try {
        // Nulstil begge for robusthed – ret, hvis du kun har ét felt
        const payload = { done_at: null, completed_at: null };
        const { error } = await supabase
          .from('plant_tasks' as any)
          .update(payload)
          .eq('id', id);
        if (error) throw error;

        setRows((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...payload } : t)),
        );
      } catch (e: any) {
        alert(e?.message || 'Kunne ikke fortryde.');
      }
    },
    [supabase],
  );

  // Snooze +1 dag (valgfrit – brug hvis du har due_at)
  const snooze = useCallback(
    async (id: string, days = 1) => {
      if (!supabase) return;
      try {
        const t = rows.find((r) => r.id === id);
        const from = t?.due_at ? new Date(t.due_at) : new Date();
        const next = new Date(from.getTime() + days * 24 * 3600 * 1000);
        const payload = { due_at: next.toISOString() };
        const { error } = await supabase
          .from('plant_tasks' as any)
          .update(payload)
          .eq('id', id);
        if (error) throw error;

        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, due_at: payload.due_at } : r)),
        );
      } catch (e: any) {
        alert(e?.message || 'Kunne ikke udskyde.');
      }
    },
    [rows, supabase],
  );

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Opgaver</h1>
        <p className="text-sm opacity-70">
          Se og håndtér dine dyrkningsopgaver for dine afgrøder.
        </p>
      </header>

      {/* Tabs */}
      <div className="inline-flex rounded-lg ring-1 ring-slate-200 bg-white overflow-hidden mb-4">
        {(['open', 'done'] as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={[
              'px-3 py-1.5 text-sm',
              tab === k ? 'bg-slate-900 text-white' : 'text-slate-700',
            ].join(' ')}
            type="button"
          >
            {k === 'open' ? 'Åbne' : 'Færdige'}
          </button>
        ))}
      </div>

      {/* Fejl */}
      {err && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 p-3 text-sm">
          {err}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 text-sm opacity-70">
          Indlæser opgaver…
        </div>
      )}

      {/* Empty state */}
      {!loading && !err && rows.length === 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
          <p className="text-sm">
            {tab === 'open'
              ? 'Du har ingen åbne opgaver. Godt gået! 🎉'
              : 'Ingen færdige opgaver endnu.'}
          </p>
        </div>
      )}

      {/* Liste */}
      {!loading && !err && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((t) => {
            const done = isDone(t);
            return (
              <li
                key={t.id}
                className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 p-3 flex items-start gap-3"
              >
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => (done ? uncomplete(t.id) : markDone(t.id))}
                    aria-label={done ? 'Fortryd færdig' : 'Markér som færdig'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {t.title || 'Opgave'}
                    {t.due_at && (
                      <span className="ml-2 text-xs rounded px-1.5 py-0.5 bg-slate-100">
                        Forfald: {formatDate(t.due_at)}
                      </span>
                    )}
                  </div>
                  {t.note && (
                    <div className="text-sm opacity-80 whitespace-pre-wrap">
                      {t.note}
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    Oprettet: {formatDate(t.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!done && (
                    <>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                        onClick={() => snooze(t.id, 1)}
                        title="Udskyd 1 dag"
                      >
                        +1 dag
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                        onClick={() => snooze(t.id, 7)}
                        title="Udskyd 7 dage"
                      >
                        +7 dage
                      </button>
                    </>
                  )}
                  {done && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Færdig
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
