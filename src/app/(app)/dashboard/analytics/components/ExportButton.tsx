'use client';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export default function ExportButton() {
  const sp = useSearchParams();

  const { startDefault, endDefault } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getTime() - 30 * 864e5);
    return {
      startDefault: start.toISOString().slice(0, 10),
      endDefault: today.toISOString().slice(0, 10),
    };
  }, []);

  const start = sp.get('start') ?? startDefault;
  const end = sp.get('end') ?? endDefault;

  const params = new URLSearchParams({ start, end });

  const href = `/api/analytics/export?${params.toString()}`;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
    >
      <span>⬇</span>
      <span>Export CSV</span>
    </a>
  );
}
