'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProfileRow = {
  role?: string | null;
  is_admin?: boolean | null;
};

export default function AdminBadge() {
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) {
        if (alive) setIsAdmin(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('role,is_admin')
        .eq('id', uid)
        .maybeSingle();

      if (!alive) return;
      if (error) {
        setIsAdmin(false);
        return;
      }

      const row = (data || {}) as ProfileRow;
      const admin = Boolean(row.is_admin) || row.role === 'admin';
      setIsAdmin(admin);
    })();

    return () => {
      alive = false;
    };
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-slate-900 text-white"
      title="Administrator"
    >
      Admin
    </span>
  );
}
