'use client'

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { memo, useCallback, useRef, useMemo } from 'react'

export type Point = { lat: number; lng: number; v?: number }
export type MapInnerProps = { points: Point[] }

// Binder moveend-event korrekt (React Leaflet v4)
function MoveEndBinder({ onMoveEnd }: { onMoveEnd: () => void }) {
  useMapEvents({
    moveend() {
      onMoveEnd()
    },
  })
  return null
}

// Simpelt heatmap-lag (uden ekstern plugin)
function HeatmapLayer({ points }: { points: Point[] }) {
  const memoPoints = useMemo(() => points.slice(0, 5000), [points])

  return (
    <>
      {memoPoints.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={Math.max(2, (p.v ?? 1) * 3)}
          pathOptions={{
            color: 'rgba(255, 80, 0, 0.4)',
            fillColor: 'rgba(255, 80, 0, 0.6)',
            weight: 0,
          }}
        />
      ))}
    </>
  )
}

function MapInner({ points }: MapInnerProps) {
  const lastUpdate = useRef(0)

  const handleMoveEnd = useCallback(() => {
    const now = performance.now()
    if (now - lastUpdate.current < 300) return // throttle
    lastUpdate.current = now
    console.info('[Map] moveend triggered') // evt. fetch ny data her
  }, [])

  return (
    <MapContainer
      center={[56.2, 10.0]}
      zoom={7}
      preferCanvas
      attributionControl
      whenReady={() => {
        lastUpdate.current = performance.now()
      }}
      className="h-[60vh] w-full rounded-xl shadow-sm"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MoveEndBinder onMoveEnd={handleMoveEnd} />
      <HeatmapLayer points={points} />
    </MapContainer>
  )
}

export default memo(MapInner)
