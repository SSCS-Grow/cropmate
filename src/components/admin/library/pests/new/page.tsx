import { redirect } from "next/navigation";
import React from "react";

import AdminGuard from "@/components/admin/AdminGuard";
import LibraryForm from "@/components/admin/LibraryForm";
import { getSupabaseServer, getUserAndAdmin } from "@/utils/supabase/server";

export default async function NewPest() {
  return (
    <AdminGuard title="Ny Pest">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Ny Pest</h1>
        <FormWrapper />
      </div>
    </AdminGuard>
  );
}

async function FormWrapper() {
  async function onSubmit(vals: any) {
    "use server";
    const { isAdmin } = await getUserAndAdmin();
    if (!isAdmin) throw new Error("Not admin");

    const supabase = getSupabaseServer();
    const { error } = await supabase.from("pests").insert({
      slug: vals.slug,
      name_da: vals.name_da,
      name_en: vals.name_en || null,
      category: vals.category || null,
      description: vals.description || null,
      symptoms: vals.symptoms || null,
      control: vals.control || null,
    });
    if (error) throw error;
    redirect("/admin/library");
  }

  return <LibraryForm type="pest" onSubmit={onSubmit} />;
}
