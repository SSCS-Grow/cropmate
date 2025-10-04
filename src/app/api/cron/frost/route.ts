import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

// POST /api/cron/frost
export async function POST(req: NextRequest) {
  const unauth = requireCronAuth(req);
  if (unauth) return unauth;

  const supabase = await getSupabaseServer();

  // Minimal “no-op” der prøver at logge en alert (hvis tabellen findes).
  // Byg din rigtige frostlogik her (ET frost-advarsel, flag tasks, osv.)
  try {
    const message = `Frost cron ran at ${new Date().toISOString()}`;
    const { error } = await supabase
      .from("alerts")
      .insert({ type: "cron-frost", message });

    if (error) {
      // Hvis alerts ikke findes, svarer vi stadig ok (undgår 500)
      console.warn("alerts insert failed:", error.message);
    }
  } catch (e: any) {
    console.warn("frost cron insert exception:", e?.message ?? e);
  }

  return NextResponse.json({ ok: true });
}
