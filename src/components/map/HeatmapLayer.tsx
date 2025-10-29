'use client'

import { useMemo } from 'react'
import { CircleMarker, LayerGroup } from 'react-leaflet'

type Point = { lat: number; lng: number; intensity?: number }

export default function HeatmapLayer({ points }: { points: Point[] }) {
  // memoiserer punkterne, så Leaflet ikke rerenderer alt ved små propændringer
  const memoPoints = useMemo(() => points.slice(0, 5000), [points])

  return (
    <LayerGroup>
      {memoPoints.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={Math.max(2, (p.intensity ?? 1) * 3)}
          pathOptions={{ color: 'rgba(255, 80, 0, 0.4)', fillColor: 'rgba(255, 80, 0, 0.6)', weight: 0 }}
        />
      ))}
    </LayerGroup>
  )
}
