'use client';

import { useMemo } from 'react';
import supabaseBrowser from '@/lib/supabaseBrowser';
import type { SupabaseClient } from '@supabase/supabase-js';

export default function useSupabaseBrowser() {
  return useMemo<SupabaseClient | null>(() => {
    if (typeof window === 'undefined') return null;
    return supabaseBrowser();
  }, []);
}
