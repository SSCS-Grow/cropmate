import { notFound, redirect } from "next/navigation";
import AdminGuard from "@/components/admin/AdminGuard";
import LibraryForm from "@/components/admin/LibraryForm";
import { getSupabaseServer, getUserAndAdmin } from "@/lib/supabase/server";

export default async function EditDisease({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from("diseases")
    .select("id, slug, name_da, name_en, pathogen, description, symptoms, control")
    .eq("id", params.id).maybeSingle();

  if (!data) notFound();

  return (
    <AdminGuard title={`Redigér Disease: ${data.name_da}`}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Redigér Disease</h1>
        <FormWrapper initial={data}/>
      </div>
    </AdminGuard>
  );
}

async function FormWrapper({ initial }: { initial: any }) {
  async function onSubmit(vals: any) {
    "use server";
    const { isAdmin } = await getUserAndAdmin();
    if (!isAdmin) throw new Error("Not admin");

    const supabase = getSupabaseServer();
    const { error } = await supabase.from("diseases")
      .update({
        slug: vals.slug,
        name_da: vals.name_da,
        name_en: vals.name_en || null,
        pathogen: vals.pathogen || null,
        description: vals.description || null,
        symptoms: vals.symptoms || null,
        control: vals.control || null,
      })
      .eq("id", initial.id);

    if (error) throw error;
    redirect("/admin/library");
  }

  return <LibraryForm type="disease" initial={initial} onSubmit={onSubmit} />;
}
