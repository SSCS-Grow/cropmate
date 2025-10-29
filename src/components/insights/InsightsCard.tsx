// src/components/insights/InsightsCard.tsx
'use client'

import type { Insight } from '@/hooks/useInsights'

function pillColor(sev: Insight['severity']) {
  return sev === 'high' ? 'bg-red-100 text-red-700'
       : sev === 'medium' ? 'bg-amber-100 text-amber-700'
       : 'bg-emerald-100 text-emerald-700'
}

export default function InsightsCard({ items, title = 'Indsigter' }: { items: Insight[]; title?: string }) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <ul className="divide-y">
        {items.length === 0 && (
          <li className="p-4 text-sm text-slate-500">Ingen indsigter i perioden.</li>
        )}

        {items.map((it) => (
          <li key={it.hazard} className="p-4 flex items-start gap-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${pillColor(it.severity)}`}>
              {it.severity.toUpperCase()}
            </span>
            <div className="flex-1">
              <div className="font-medium">{it.hazard}</div>
              <div className="text-sm text-slate-600">{it.message}</div>
              <div className="text-xs mt-1 text-slate-500">
                Sidste periode: {it.previous} · Nu: {it.recent} · Trend: {it.trendPct >= 0 ? '+' : ''}{it.trendPct}%
              </div>
              <div className="text-sm mt-2">{it.suggestion}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
