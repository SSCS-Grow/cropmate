import React from "react";
import Link from "next/link";
// Update the import path if the alias '@' is not configured, or fix tsconfig.json
import { getUserAndAdmin } from "@/utils/supabase/server";

export default async function AdminGuard({
  children,
  title = "Library (Admin)",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { user, isAdmin } = await getUserAndAdmin();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="mb-4">Du skal være logget ind.</p>
        <Link href="/login" className="underline">Log ind</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p>Du skal være admin for at se denne side.</p>
      </div>
    );
  }

  return <>{children}</>;
}
