import dynamic from 'next/dynamic'

// Denne wrapper loader klient-komponenten uden SSR
const HazardReportsMapClient = dynamic(
  () => import('./HazardReportsMap.client').then(m => m.default),
  { ssr: false }
)

export default function HazardReportsMap(props: { hazardId: string }) {
  return <HazardReportsMapClient {...props} />
}
