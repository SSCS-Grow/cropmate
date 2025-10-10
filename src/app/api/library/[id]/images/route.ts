import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { fileName, contentType } = await req.json();

  const key = `${params.id}/${crypto.randomUUID()}-${fileName}`;
  const { data: signed, error: signErr } = await supabase.storage
    .from("pests")
    .createSignedUploadUrl(key);
  if (signErr) return Response.json({ error: signErr.message }, { status: 400 });

  return Response.json({ uploadUrl: signed.signedUrl, path: key });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { path, imageId } = await req.json();

  await supabase.storage.from("pests").remove([path]);
  if (imageId) await supabase.from("pest_images").delete().eq("id", imageId);
  return Response.json({ ok: true });
}
