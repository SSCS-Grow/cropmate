import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const supabase = await supabaseServer();

  // contentType er ikke nødvendig i denne handler
  const { fileName } = await req.json();

  const key = `${id}/${crypto.randomUUID()}-${fileName}`;
  const { data: signed, error: signErr } = await supabase.storage
    .from("pests")
    .createSignedUploadUrl(key, { upsert: false }); // <-- fjern contentType her

  if (signErr) return Response.json({ error: signErr.message }, { status: 400 });

  // de fleste clients kan PUT'e direkte til signedUrl
  return Response.json({ uploadUrl: signed.signedUrl, path: key });
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const { id } = await context.params; // id bruges kun til konsistens
  const supabase = await supabaseServer();

  const { path, imageId } = await req.json();

  const { error: rmErr } = await supabase.storage.from("pests").remove([path]);
  if (rmErr) return Response.json({ error: rmErr.message }, { status: 400 });

  if (imageId) {
    const { error: dbErr } = await supabase.from("pest_images").delete().eq("id", imageId);
    if (dbErr) return Response.json({ error: dbErr.message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
