import Link from "next/link";

async function fetchObservations(q: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/observations${q}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Kunne ikke hente observationer");
  return res.json() as Promise<{ items: any[]; count: number }>;
}

type SP = {
  pest_id?: string;
  disease_id?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export default async function ObservationsPage({
  searchParams,
}: {
  searchParams: Promise<SP>; // 👈 Next 15: async
}) {
  const sp = await searchParams; // 👈 await før brug

  const params = new URLSearchParams();
  if (sp?.pest_id) params.set("pest_id", sp.pest_id);
  if (sp?.disease_id) params.set("disease_id", sp.disease_id);
  if (sp?.status) params.set("status", sp.status);
  if (sp?.fromDate) params.set("fromDate", sp.fromDate);
  if (sp?.toDate) params.set("toDate", sp.toDate);
  params.set("limit", "50");

  const data = await fetchObservations(`?${params.toString()}`);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Observationer</h1>

      {/* Simple filter form (GET) */}
      <form className="grid md:grid-cols-5 gap-3" method="GET">
        <input
          name="pest_id"
          placeholder="pest_id (uuid)"
          className="border rounded-xl p-2"
          defaultValue={sp?.pest_id ?? ""}
        />
        <input
          name="disease_id"
          placeholder="disease_id (uuid)"
          className="border rounded-xl p-2"
          defaultValue={sp?.disease_id ?? ""}
        />
        <select
          name="status"
          className="border rounded-xl p-2"
          defaultValue={sp?.status ?? ""}
        >
          <option value="">status (alle)</option>
          <option value="active">active</option>
          <option value="hidden">hidden</option>
          <option value="flagged">flagged</option>
        </select>
        <input
          type="date"
          name="fromDate"
          className="border rounded-xl p-2"
          defaultValue={sp?.fromDate ?? ""}
        />
        <input
          type="date"
          name="toDate"
          className="border rounded-xl p-2"
          defaultValue={sp?.toDate ?? ""}
        />
        <div className="md:col-span-5">
          <button className="mt-1 rounded-xl px-4 py-2 bg-black text-white">Filtrér</button>
        </div>
      </form>

      <div className="grid gap-4">
        {data.items.map((o) => (
          <Link key={o.id} href={`/observations/${o.id}`} className="block border rounded-2xl p-4 hover:bg-gray-50">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{o.title}</div>
                <div className="text-sm text-gray-600">{o.description}</div>
                <div className="text-xs mt-1">lat:{o.lat} • lng:{o.lng} • status:{o.status}</div>
              </div>
              {o.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.photo_url} alt="" className="w-32 h-20 object-cover rounded-xl border" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
