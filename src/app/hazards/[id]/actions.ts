"use server";

import { getSupabaseServer, getUserAndAdmin } from "@/lib/supabase/server";

export async function addHazardPest(hazardId: string, pestId: string) {
  const { user, isAdmin } = await getUserAndAdmin();
  if (!user) throw new Error("Not authenticated");

  const supabase = getSupabaseServer();
  // user_id medsendes jf. RLS with check
  const { error } = await supabase
    .from("hazard_report_pests")
    .insert({ hazard_id: hazardId, pest_id: pestId, user_id: user.id });
  if (error) throw new Error(error.message);
}

export async function removeHazardPest(hazardId: string, pestId: string) {
  const { user } = await getUserAndAdmin();
  if (!user) throw new Error("Not authenticated");

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("hazard_report_pests")
    .delete()
    .eq("hazard_id", hazardId)
    .eq("pest_id", pestId);
  if (error) throw new Error(error.message);
}

export async function addHazardDisease(hazardId: string, diseaseId: string) {
  const { user } = await getUserAndAdmin();
  if (!user) throw new Error("Not authenticated");

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("hazard_report_diseases")
    .insert({ hazard_id: hazardId, disease_id: diseaseId, user_id: user.id });
  if (error) throw new Error(error.message);
}

export async function removeHazardDisease(hazardId: string, diseaseId: string) {
  const { user } = await getUserAndAdmin();
  if (!user) throw new Error("Not authenticated");

  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("hazard_report_diseases")
    .delete()
    .eq("hazard_id", hazardId)
    .eq("disease_id", diseaseId);
  if (error) throw new Error(error.message);
}
