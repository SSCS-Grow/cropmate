'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import classNames from 'classnames';
import useAuthSession from '@/hooks/useAuthSession';
import useSupabaseBrowser from '@/hooks/useSupabaseBrowser';

type CropRow = { id: string; name: string; latin_name: string | null };

const regionOptions = [
  { code: 'DK', label: 'Danmark' },
  { code: 'SE', label: 'Sverige' },
  { code: 'NO', label: 'Norge' },
  { code: 'FI', label: 'Finland' },
  { code: 'DE', label: 'Tyskland' },
  { code: 'NL', label: 'Holland' },
  { code: 'BE', label: 'Belgien' },
  { code: 'FR', label: 'Frankrig' },
  { code: 'ES', label: 'Spanien' },
  { code: 'IT', label: 'Italien' },
];

const languageOptions = [
  { value: 'da-DK', label: 'Dansk' },
  { value: 'sv-SE', label: 'Svensk' },
  { value: 'nb-NO', label: 'Norsk' },
  { value: 'en-GB', label: 'Engelsk' },
];

const styleOptions = [
  {
    value: 'eco_only',
    title: 'Kun økologisk',
    description: 'Vis kun naturlige råd og midler.',
  },
  {
    value: 'eco_first',
    title: 'Primært økologisk',
    description: 'Start med naturlige forslag, men vis kemi som sidste udvej.',
  },
  {
    value: 'balanced',
    title: 'Afbalanceret',
    description: 'Kombination af øko og kemi med tydelige advarsler.',
  },
  {
    value: 'allows_chemical',
    title: 'Kemi tilladt',
    description: 'Vis alle typer forslag, også kemiske.',
  },
];

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Indlæser onboarding…</div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const { session, loading: authLoading } = useAuthSession();
  const supabase = useSupabaseBrowser();
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params?.get('next') || '/dashboard';

  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [region, setRegion] = useState('');
  const [language, setLanguage] = useState(languageOptions[0]?.value ?? 'da-DK');
  const [style, setStyle] = useState('eco_only');
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cropSearch, setCropSearch] = useState('');
  const [cropResults, setCropResults] = useState<CropRow[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<CropRow | null>(null);
  const [creatingFirstCrop, setCreatingFirstCrop] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/');
    }
  }, [authLoading, session, router]);

  useEffect(() => {
    if (!session || !supabase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('region_code, language, growing_style, onboarded_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (data) {
        if (data.region_code) setRegion(data.region_code);
        if (data.language) setLanguage(data.language);
        if (data.growing_style) setStyle(data.growing_style);
        if (data.onboarded_at) {
          router.replace(nextPath);
          return;
        }
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, supabase, router, nextPath]);

  useEffect(() => {
    if (!supabase) return;
    if (!cropSearch.trim()) {
      setCropResults([]);
      setSearchBusy(false);
      return;
    }
    let cancelled = false;
    setSearchBusy(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('id, name, scientific_name')
        .ilike('name', `%${cropSearch.trim()}%`)
        .order('name')
        .limit(15);
      if (!cancelled) {
        if (!error && data) {
          setCropResults(
            data.map((row) => ({
              id: row.id,
              name: row.name,
              latin_name: (row as any).scientific_name ?? null,
            })),
          );
        }
        setSearchBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [cropSearch, supabase]);

  const disableStep0 = !region || !language;
  const disableStep1 = !style;
  const disableStep2 = !selectedCrop || creatingFirstCrop;

  async function saveProfilePreferences() {
    if (!session || !supabase) return;
    setSavingProfile(true);
    setError(null);
    try {
      const update = await supabase
        .from('profiles')
        .update({
          region_code: region,
          language,
          growing_style: style,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);
      if (update.error) throw update.error;

      await supabase
        .from('alert_prefs')
        .upsert(
          {
            user_id: session.user.id,
            locale: language,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Kunne ikke gemme præferencer. Prøv igen.',
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function finishOnboarding() {
    if (!session || !selectedCrop || !supabase) return;
    setCreatingFirstCrop(true);
    setError(null);
    try {
      const insert = await supabase
        .from('user_crops')
        .insert({
          user_id: session.user.id,
          crop_id: selectedCrop.id,
          planted_on: new Date().toISOString().slice(0, 10),
        })
        .select('id')
        .single();

      if (insert?.error && insert.error.code !== '23505') {
        throw insert.error;
      }

      const { error: onboardErr } = await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', session.user.id);
      if (onboardErr) throw onboardErr;

      router.replace(nextPath);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Kunne ikke færdiggøre onboarding.',
      );
    } finally {
      setCreatingFirstCrop(false);
    }
  }

  if (authLoading || loadingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
          Indlæser onboarding…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Velkommen til CropMate
        </p>
        <h1 className="text-2xl font-semibold">Lad os gøre appen personlig</h1>
        <p className="text-sm text-slate-600">
          Tre hurtige trin – det tager under 3 minutter.
        </p>
      </header>

      <nav className="flex items-center gap-3 text-xs font-medium">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className={classNames(
                'inline-flex h-6 w-6 items-center justify-center rounded-full border',
                idx === step
                  ? 'border-emerald-600 text-emerald-700'
                  : idx < step
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 text-slate-400',
              )}
            >
              {idx + 1}
            </span>
            <span
              className={classNames(
                'uppercase tracking-wide',
                idx === step ? 'text-emerald-700' : 'text-slate-500',
              )}
            >
              {['Region & sprog', 'Dyrkningsstil', 'Første afgrøde'][idx]}
            </span>
          </div>
        ))}
      </nav>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}

      {step === 0 && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Hvor dyrker du?</h2>
            <p className="text-sm text-slate-600">
              Vi bruger regionen til vejrudsigter og advarsler.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {regionOptions.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setRegion(opt.code)}
                className={classNames(
                  'rounded-xl border px-3 py-3 text-left text-sm transition',
                  region === opt.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">App-sprog</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={disableStep0}
              onClick={() => setStep(1)}
              className={classNames(
                'rounded-xl px-4 py-2 text-sm font-medium',
                disableStep0
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
            >
              Fortsæt
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Hvordan dyrker du?</h2>
            <p className="text-sm text-slate-600">
              Vi bruger valget til at prioritere rådgivning.
            </p>
          </div>
          <div className="grid gap-3">
            {styleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={classNames(
                  'rounded-2xl border px-4 py-3 text-left transition',
                  style === opt.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div className="font-medium">{opt.title}</div>
                <div className="text-sm text-slate-600">{opt.description}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Tilbage
            </button>
            <button
              type="button"
              disabled={disableStep1 || savingProfile}
              onClick={saveProfilePreferences}
              className={classNames(
                'rounded-xl px-4 py-2 text-sm font-medium',
                disableStep1 || savingProfile
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
            >
              {savingProfile ? 'Gemmer…' : 'Gem og fortsæt'}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5 space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Tilføj din første afgrøde</h2>
            <p className="text-sm text-slate-600">
              Vi bruger den til at foreslå opgaver og oprette kalenderen.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Søg efter afgrøde</label>
            <input
              type="text"
              value={cropSearch}
              onChange={(e) => setCropSearch(e.target.value)}
              placeholder="Fx Tomat, Gulerod, Jordbær…"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          {searchBusy && (
            <div className="text-sm text-slate-500">Søger…</div>
          )}

          <div className="grid gap-2">
            {cropResults.map((crop) => (
              <button
                key={crop.id}
                type="button"
                onClick={() => setSelectedCrop(crop)}
                className={classNames(
                  'rounded-xl border px-3 py-2 text-left text-sm',
                  selectedCrop?.id === crop.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-400',
                )}
              >
                <div className="font-medium">{crop.name}</div>
                {crop.latin_name && (
                  <div className="text-xs text-slate-500">{crop.latin_name}</div>
                )}
              </button>
            ))}
            {!cropResults.length && cropSearch && !searchBusy && (
              <p className="text-xs italic text-slate-500">
                Ingen match endnu – prøv et andet navn.
              </p>
            )}
          </div>

          {selectedCrop && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Valgt afgrøde: <strong>{selectedCrop.name}</strong>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
            >
              Tilbage
            </button>
            <button
              type="button"
              disabled={disableStep2}
              onClick={finishOnboarding}
              className={classNames(
                'rounded-xl px-4 py-2 text-sm font-medium',
                disableStep2
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
            >
              {creatingFirstCrop ? 'Gemmer…' : 'Færdiggør onboarding'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
