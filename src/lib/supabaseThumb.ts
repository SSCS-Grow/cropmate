/**
 * Supabase image URL helper med on-the-fly transformations.
 * Brug denne til thumbnails og optimeret billedvisning.
 *
 * Eksempel:
 * const thumb = getPublicThumbUrl(path, 300);
 */

export function getPublicThumbUrl(path: string, width = 400, quality = 80) {
  if (!path) return '';
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Eks: https://xyz.supabase.co/storage/v1/object/public/diagnose-photos/myimg.jpg
    const url = new URL(path.startsWith('http') ? path : `${base}/storage/v1/object/public/${path}`);
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', String(quality));
    return url.toString();
  } catch (e) {
    console.error('getPublicThumbUrl fejl:', e);
    return path;
  }
}
