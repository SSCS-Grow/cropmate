'use client'

import { useInsights } from '@/hooks/useInsights'
import InsightsCard from '@/components/insights/InsightsCard'

export default function InsightsPanel() {
  // Valgfrit: hent bbox fra din kort-state. Her viser vi globalt (uden bbox):
  const { data, loading, error } = useInsights({ days: 7 })

  if (loading) return <section className="p-4 rounded-2xl border bg-white">Henter indsigter…</section>
  if (error) return <section className="p-4 rounded-2xl border bg-white text-red-600">Kunne ikke hente indsigter.</section>

  return <InsightsCard items={data?.insights ?? []} title="Grow-AI indsigter (7 dage)" />
}
