// src/app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useAuthSession from '@/hooks/useAuthSession';
import { createClient } from '@/lib/supabase/client'; // Browser-Supabase klient
import PushCta from '@/components/settings/PushCta';
import ServiceWorkerReady from '@/components/system/ServiceWorkerReady';

// ——— Lazy-loadede kort/vejr-komponenter ———
const WeatherCard = dynamic(
  () => import('@/components/WeatherCard').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vejr…
      </div>
    ),
  },
);

const AutoWaterSummary = dynamic(
  () =>
    import('@/components/AutoWaterSummary').then(
      (m) => m.default ?? (m as any),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vandingsoversigt…
      </div>
    ),
  },
);

const WaterAdvisor = dynamic(
  () =>
    import('@/components/WaterAdvisor').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vandingsråd…
      </div>
    ),
  },
);

const WeatherHistory = dynamic(
  () =>
    import('@/components/WeatherHistory').then((m) => m.default ?? (m as any)),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4 opacity-60">
        Indlæser vejrhistorik…
      </div>
    ),
  },
);

// ——— Types ———
type TaskType =
  | 'sow'
  | 'transplant'
  | 'fertilize'
  | 'prune'
  | 'water'
  | 'harvest'
  | 'other';

type TaskStatus = 'pending' | 'done' | 'skipped';

type TaskRow = {
  id: string;
  user_id: string;
  crop_id: string | null;
  type: TaskType;
  due_date: string;
  status: TaskStatus;
  notes: string | null;
  crops?: { name: string | null } | null;
};

type AlertKind = 'frost' | 'pest' | 'disease' | string;

type AlertRow = {
  id: string;
  user_id: string;
  type: AlertKind;
  severity: number | null;
  message: string | null;
  created_at: string;
  valid_from: string | null;
  valid_to: string | null;
  hazard_id?: string | null;
};

export default function DashboardPage() {
  // Auth-gate (robust mod BroadcastChannel-støj)
  const { session, loading: authLoading } = useAuthSession();

  // Supabase klient
  const supabase = useMemo(() => createClient(), []);

  // Data
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  // "I dag" – sikker mod “impure during render”
  const today = useMemo(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      .toISOString()
      .slice(0, 10);
  }, []);

  // Hent data når vi kender auth-tilstand
  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        if (!session) {
          // Ikke logget ind → ingen fetch
          setTasks([]);
          setAlerts([]);
          return;
        }

        const userId = session.user.id;

        const [{ data: t, error: tErr }, { data: a, error: aErr }] =
          await Promise.all([
            (supabase as any)
              .from('tasks')
              .select(
                'id,user_id,crop_id,type,due_date,status,notes,crops(name)',
              )
              .eq('user_id', userId)
              .order('due_date', { ascending: true })
              .limit(40),
            (supabase as any)
              .from('alerts')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(10),
          ]);

        if (!alive) return;

        if (!tErr) {
          const normalized = (t || []).map((row: any) => ({
            ...row,
            crops: Array.isArray(row.crops)
              ? row.crops[0] ?? null
              : row.crops ?? null,
          }));
          setTasks(normalized as TaskRow[]);
        }
        if (!aErr) setAlerts((a || []) as AlertRow[]);
      } catch {
        // undgå console.* pga. lint-regel – vis hellere en lille inline fejl senere hvis ønsket
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authLoading, session, supabase]);

  // UI helpers
  const taskPill = (type: TaskType) =>
    type === 'sow'
      ? 'bg-green-100 text-green-800'
      : type === 'transplant'
      ? 'bg-emerald-100 text-emerald-800'
      : type === 'fertilize'
      ? 'bg-yellow-100 text-yellow-800'
      : type === 'prune'
      ? 'bg-purple-100 text-purple-800'
      : type === 'water'
      ? 'bg-blue-100 text-blue-800'
      : type === 'harvest'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-slate-100 text-slate-800';

  function alertBadge(a: AlertRow) {
    switch (a.type) {
      case 'frost':
        return { cls: 'bg-sky-100 text-sky-800', label: 'Frost', icon: '❄️' };
      case 'pest':
        return {
          cls: 'bg-rose-100 text-rose-800',
          label: 'Skadedyr',
          icon: '🐛',
        };
      case 'disease':
        return {
          cls: 'bg-amber-100 text-amber-900',
          label: 'Sygdom',
          icon: '🦠',
        };
      default:
        return {
          cls: 'bg-slate-100 text-slate-800',
          label: a.type,
          icon: '🔔',
        };
    }
  }

  const todaysInspections = useMemo(
    () =>
      tasks.filter(
        (t) => t.notes?.startsWith('Inspektion:') && t.due_date === today,
      ).length,
    [tasks, today],
  );

  const nextSteps = useMemo(
    () =>
      tasks
        .filter((t) => t.status === 'pending')
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 3),
    [tasks],
  );

  const pendingToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'pending' && t.due_date === today,
      ).length,
    [tasks, today],
  );

  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === 'pending' && t.due_date < today,
      ).length,
    [tasks, today],
  );

  const activeAlerts = alerts.length;
  const highlightAlert =
    alerts.find((a) => (a.severity ?? 0) >= 4) ?? alerts[0] ?? null;

  const quickStats = [
    { label: 'Opgaver i dag', value: pendingToday },
    { label: 'Forfaldne', value: overdueCount },
    { label: 'Aktive varsler', value: activeAlerts },
    { label: 'Inspektioner i dag', value: todaysInspections },
  ];

  const formatDueLabel = (due: string) => {
    try {
      const date = new Date(due);
      const todayDate = new Date(today);
      const diff =
        (date.setHours(0, 0, 0, 0) - todayDate.setHours(0, 0, 0, 0)) /
        (24 * 60 * 60 * 1000);
      if (diff === 0) return 'I dag';
      if (diff === 1) return 'I morgen';
      if (diff === -1) return 'I går';
      return date.toLocaleDateString('da-DK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return due;
    }
  };

  const cropName = (task: TaskRow) => task.crops?.name || 'Afgrøde';

  // ——— Opgavehandlinger ———
  async function setTaskStatus(id: string, newStatus: TaskStatus) {
    const prev = [...tasks];
    setTasks(prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    const { error } = await (supabase as any)
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      setTasks(prev); // rollback
      alert('Kunne ikke opdatere opgaven – prøv igen.');
    }
  }

  async function undoTaskStatus(id: string) {
    await setTaskStatus(id, 'pending');
  }

  // ——— Opret inspektionsopgaver fra et varsel ———
  async function createInspectionFromAlert(a: AlertRow) {
    try {
      if (a.type !== 'pest' && a.type !== 'disease') {
        alert('Kun relevant for skadedyr/sygdom.');
        return;
      }
      if (!a.hazard_id) {
        alert('Denne varsel er ikke knyttet til en trussel.');
        return;
      }

      const uid = session?.user?.id;
      if (!uid) {
        alert('Log ind først.');
        return;
      }

      const { data: uc } = await (supabase as any)
        .from('user_crops')
        .select('crop_id')
        .eq('user_id', uid);
      const mySet = new Set<string>(
        (uc || []).map((r: { crop_id: string }) => r.crop_id),
      );

      const { data: hosts } = await (supabase as any)
        .from('hazard_hosts')
        .select('crop_id')
        .eq('hazard_id', a.hazard_id);

      const hostIds = (hosts || []).map((h: { crop_id: string }) => h.crop_id);
      const affected = hostIds.filter((cid) => mySet.has(cid));

      if (!affected.length) {
        alert('Ingen af dine afgrøder er værter for denne trussel.');
        return;
      }

      const rows = affected.map((cid) => ({
        user_id: uid,
        crop_id: cid,
        type: 'other' as const,
        due_date: today,
        status: 'pending' as const,
        notes: `Inspektion: ${a.message?.split(':')[0] || 'Trussel'}`,
      }));

      const { error } = await (supabase as any).from('tasks').upsert(rows, {
        onConflict: 'user_id,crop_id,type,due_date',
        ignoreDuplicates: true,
      });

      if (error) {
        alert(
          'Kunne ikke oprette opgaver (eller de findes allerede). Tjek dashboard.',
        );
      } else {
        alert(`Oprettet ${rows.length} inspektionsopgave(r) i dag.`);
        const { data: t } = await (supabase as any)
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(20);
        setTasks((t || []) as TaskRow[]);
      }
    } catch {
      alert('Noget gik galt ved oprettelse af inspektionsopgaver.');
    }
  }

  // ——— UI ———
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Indlæser…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-lg font-semibold">Log ind kræves</h1>
          <p className="mb-4 text-sm text-slate-600">
            Du er ikke logget ind. Gå til login for at fortsætte.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
          >
            Log ind
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="opacity-60 p-4">Indlæser dashboard…</div>;

  return (
    <div className="space-y-6">
      <ServiceWorkerReady />

      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 p-6 text-white shadow-xl ring-1 ring-emerald-500/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
              Din dag i haven
            </p>
            <h1 className="text-3xl font-semibold mt-1">
              Næste skridt i dag
            </h1>
            <p className="text-sm text-emerald-100">
              Få overblik over dine opgaver og reager hurtigt på varsler.
            </p>
          </div>
          {highlightAlert && (
            <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
              <div className="text-xs uppercase tracking-wide opacity-80">
                Aktiv varsel
              </div>
              <div className="font-semibold">
                {alertBadge(highlightAlert).label}
              </div>
              <p className="text-emerald-50 text-sm mt-1">
                {highlightAlert.message || 'Hold øje med dine planter.'}
              </p>
              <Link
                href="/alerts"
                className="inline-flex text-xs mt-2 underline text-white"
              >
                Se detaljer
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {quickStats.map((stat) => (
            <span
              key={stat.label}
              className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium"
            >
              {stat.label}: <span className="font-semibold">{stat.value}</span>
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {nextSteps.length ? (
            nextSteps.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl bg-white/10 p-3 text-sm sm:flex-row sm:items-center"
              >
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-emerald-100">
                    {formatDueLabel(task.due_date)}
                  </div>
                  <div className="text-base font-semibold">
                    {cropName(task)} · {task.type}
                  </div>
                  {task.notes && (
                    <p className="text-emerald-100 text-sm">{task.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskStatus(task.id, 'done')}
                    className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-white"
                  >
                    Markér udført
                  </button>
                  <button
                    onClick={() => setTaskStatus(task.id, 'skipped')}
                    className="rounded-xl border border-white/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Spring over
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-emerald-100">
              Ingen ventende opgaver lige nu. Besøg{' '}
              <Link href="/tasks" className="underline font-semibold">
                Opgaver
              </Link>{' '}
              for at planlægge nye aktiviteter.
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <WeatherCard />
        <AutoWaterSummary />
        <WaterAdvisor />
      </div>

      <div className="grid gap-4">
        <WeatherHistory />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Alle opgaver</h2>
              <p className="text-sm opacity-70">
                Dine kommende opgaver, sorteret efter forfaldsdato.
              </p>
            </div>
            <Link href="/tasks" className="text-sm underline">
              Se alle
            </Link>
          </div>

          <ul className="space-y-3">
            {tasks.map((t) => {
              const overdue =
                t.status === 'pending' && new Date(t.due_date) < new Date(today);
              const isToday = t.due_date === today;
              const isInspection = t.notes?.startsWith('Inspektion:');
              return (
                <li
                  key={t.id}
                  className="p-3 rounded-lg bg-white shadow ring-1 ring-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                        <span
                          className={`px-2 py-0.5 rounded ${taskPill(t.type)}`}
                        >
                          {t.type}
                        </span>
                        {isInspection && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-pink-100 text-pink-800">
                            ?? Inspektion
                          </span>
                        )}
                        {t.status !== 'pending' && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {t.status === 'done' ? '✓ Udført' : '↺ Skippet'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>{cropName(t)}</strong>
                      </div>

                      <div className="text-sm mt-1">
                        Forfalden:{' '}
                        <strong>
                          {new Date(t.due_date).toLocaleDateString('da-DK', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </strong>
                        {overdue && (
                          <span className="ml-2 text-xs text-rose-600">
                            Forfalden
                          </span>
                        )}
                        {isToday && !overdue && (
                          <span className="ml-2 text-xs text-emerald-600">
                            I dag
                          </span>
                        )}
                      </div>

                      {t.notes && (
                        <p className="text-sm mt-1 opacity-80">{t.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {t.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => setTaskStatus(t.id, 'done')}
                            className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Markér som udført"
                          >
                            ✓ Udfør
                          </button>
                          <button
                            onClick={() => setTaskStatus(t.id, 'skipped')}
                            className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-800 hover:bg-slate-300"
                            title="Markér som skippet"
                          >
                            ↺ Skip
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => undoTaskStatus(t.id)}
                          className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                          title="Fortryd (tilbage til afventer)"
                        >
                          Fortryd
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {!tasks.length && (
              <p className="text-sm opacity-70">Ingen opgaver endnu.</p>
            )}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-4">
            <h2 className="text-xl font-semibold mb-2">Varsler</h2>
            <ul className="space-y-2">
              {alerts.map((a) => {
                const { cls, label, icon } = alertBadge(a);
                const sev = a.severity ?? 0;
                return (
                  <li key={a.id} className="p-3 rounded-lg bg-white shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
                          {icon} {label}
                        </span>
                        {sev > 0 && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                            title={`Alvorlighed ${sev}/5`}
                          >
                            Alvor: {sev}/5
                          </span>
                        )}
                      </div>
                      <span className="text-xs opacity-60">
                        {new Date(a.created_at).toLocaleString('da-DK')}
                      </span>
                    </div>

                    {a.message && <p className="text-sm mt-1">{a.message}</p>}

                    <div className="flex items-center gap-2 mt-2">
                      {a.valid_to && (
                        <p className="text-xs opacity-60">
                          Gælder til:{' '}
                          {new Date(a.valid_to).toLocaleString('da-DK')}
                        </p>
                      )}

                      {a.type !== 'frost' && a.hazard_id && (
                        <>
                          <Link
                            href={`/hazards/${a.hazard_id}`}
                            className="text-xs px-2 py-1 rounded border"
                            title="Se detaljer og vejledning"
                          >
                            Se detaljer →
                          </Link>
                          <button
                            onClick={() => createInspectionFromAlert(a)}
                            className="ml-auto text-xs px-2 py-1 rounded bg-slate-900 text-white"
                            title="Opret inspektionsopgaver for berørte afgrøder i dag"
                          >
                            Start inspektion
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
              {!alerts.length && (
                <p className="text-sm opacity-70">Ingen varsler endnu.</p>
              )}
            </ul>
          </section>

          <PushCta />
        </div>
      </div>
    </div>
  );
}
