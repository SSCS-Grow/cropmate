import Link from "next/link";

export default function PestCard({ item }: { item: any }) {
  return (
    <Link href={`/library/${item.slug}`} className="block p-4 rounded-2xl shadow hover:shadow-md transition">
      <div className="text-sm uppercase opacity-60">{item.category === "pest" ? "Skadedyr" : "Sygdom"}</div>
      <div className="font-semibold text-lg">{item.name}</div>
      {item.latin_name && <div className="text-sm italic opacity-70">{item.latin_name}</div>}
      <div className="mt-2 text-sm line-clamp-3">{item.description}</div>
    </Link>
  );
}
