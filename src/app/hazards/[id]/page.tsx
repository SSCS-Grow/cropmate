import Link from "next/link";
import HazardTags from "@/components/hazards/HazardTags";
import { getSupabaseServer } from "@/lib/supabase/server";
// import HazardReportsMap from "@/components/HazardReportsMap"; // hvis du har den

export default async function HazardDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await getSupabaseServer();

  const { data: hazard, error } = await supabase
    .from("hazard_reports")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) console.error("hazard_reports error:", error);

  if (!hazard) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">Observation</h1>
        <p>Kunne ikke finde observationen.</p>
        <Link href="/hazards" className="underline">Tilbage til kortet</Link>
      </div>
    );
  }

  const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hazard-photos`;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Observation</h1>
        <Link href="/admin/moderation" className="underline text-sm">Moderation</Link>
      </div>

      {/* <HazardReportsMap center={{ lat: hazard.lat, lon: hazard.lon }} /> */}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div><span className="font-medium">Koordinater:</span>{" "}
            {typeof hazard.lat === "number" && typeof hazard.lon === "number"
              ? `${hazard.lat.toFixed(5)}, ${hazard.lon.toFixed(5)}`
              : "—"}
          </div>
          <div><span className="font-medium">Status:</span> {hazard.status}</div>
          {hazard.severity != null && (
            <div><span className="font-medium">Sværhedsgrad:</span> {hazard.severity}/5</div>
          )}
          {hazard.observed_at && (
            <div><span className="font-medium">Observeret:</span>{" "}
              {new Date(hazard.observed_at).toLocaleString("da-DK")}
            </div>
          )}
          {hazard.note && (
            <div className="mt-2">
              <span className="font-medium block">Note:</span>
              <p className="whitespace-pre-wrap">{hazard.note}</p>
            </div>
          )}
        </div>

        <div>
          {Array.isArray(hazard.photo_paths) && hazard.photo_paths.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {hazard.photo_paths.map((p: string) => (
                <a key={p} href={`${storageBase}/${p}`} target="_blank" rel="noreferrer" className="block">
                  <img src={`${storageBase}/${p}`} alt="Hazard photo" className="w-full h-32 object-cover rounded-xl border" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Ingen fotos</div>
          )}
        </div>
      </div>

      <section className="pt-4 border-t">
        <h2 className="text-lg font-semibold mb-2">Skadedyr & sygdomme</h2>
        <HazardTags hazardId={params.id} />
      </section>
    </div>
  );
}
