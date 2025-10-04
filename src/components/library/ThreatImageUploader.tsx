'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

type Img = { id: string; path: string; caption: string | null };

export default function ThreatImageUploader({ threatId }: { threatId: string }) {
  const supabase = createClient();
  const [list, setList] = useState<Img[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const bucket = 'threats-images';

  async function refresh() {
    const { data, error } = await supabase.from('threat_images').select('id,path,caption').eq('threat_id', threatId).order('created_at', { ascending: false });
    if (!error) setList(data ?? []);
  }

  useEffect(() => { refresh(); }, [threatId]);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${bucket}/${threatId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path.replace(`${bucket}/`, ''), file, { upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from('threat_images').insert({
        threat_id: threatId,
        path,
        caption: caption || null,
      });
      if (insErr) throw insErr;
      setFile(null); setCaption('');
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Upload fejlede');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, path: string) {
    if (!confirm('Slet billede?')) return;
    setBusy(true);
    try {
      await supabase.storage.from(bucket).remove([path.replace(`${bucket}/`, '')]);
      await supabase.from('threat_images').delete().eq('id', id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded-xl p-3 space-y-3">
      <div className="text-sm font-medium">Billeder</div>
      <div className="space-y-2">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Billedtekst (valgfri)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <button disabled={!file || busy} onClick={upload} className="px-3 py-2 rounded bg-black text-white disabled:opacity-50">
          {busy ? 'Uploader…' : 'Upload'}
        </button>
      </div>

      {list.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {list.map(img => (
            <li key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.path}`}
                alt={img.caption ?? ''}
                className="rounded-lg object-cover aspect-square"
              />
              <button
                onClick={() => remove(img.id, img.path)}
                className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-white/90 border opacity-0 group-hover:opacity-100 transition"
              >
                Slet
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Ingen billeder endnu.</p>
      )}
    </div>
  );
}
