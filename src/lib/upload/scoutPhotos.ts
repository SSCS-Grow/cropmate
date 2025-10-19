'use server';
import { createClient } from '@/lib/supabase/server';

export async function uploadScoutPhoto(file: File, profileId: string) {
 const supabase = await createClient(); 
  const bucket = 'scout-photos';
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${profileId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
