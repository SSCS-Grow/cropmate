'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import supabaseBrowser from '@/lib/supabaseBrowser'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet.heat'

import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import supercluster, { type PointFeature } from 'supercluster'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

type ReportRow = {
  id: string
  latitude: number | null
  longitude: number | null
  created_at: string
  severity: number | null
  crop_id: string | null
  crops?: { name: string } | null
  photo_url: string | null
  user_id: string
}
type CropOpt = { crop_id: string; name: string }
// Removed duplicate type GradientMap declaration

const HAZARD_BUCKET = 'hazard-photos'

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function colorFor(sev: number | null | undefined) {
  const s = sev ?? 3
  if (s >= 5) return '#7f1d1d'
  if (s === 4) return '#dc2626'
  if (s === 3) return '#f59e0b'
  if (s === 2) return '#10b981'
  return '#3b82f6'
}
function pinIcon(sev: number | null | undefined) {
  const c = colorFor(sev)
  return L.divIcon({
    className: 'custom-pin',
    html: `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;
      background:${c};box-shadow:0 0 0 2px #fff, 0 1px 6px rgba(0,0,0,.25);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}
function clusterDivIcon(count: number) {
  let bg = '#3b82f6'
  if (count > 50) bg = '#7f1d1d'
  else if (count > 20) bg = '#dc2626'
  else if (count > 10) bg = '#f59e0b'
  else if (count > 5) bg = '#10b981'
  const size = count > 50 ? 48 : count > 20 ? 42 : count > 10 ? 36 : 30
  return L.divIcon({
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};color:#fff;font-weight:600;
      box-shadow:0 0 0 2px #fff, 0 2px 10px rgba(0,0,0,.25);
    ">${count}</div>`,
    className: 'custom-cluster',
    iconSize: [size, size],
  })
}
function ViewportTracker({ onChange }: { onChange: (v: { bounds: L.LatLngBounds; zoom: number; center: [number, number] }) => void }) {
  useMapEvents({
    moveend: (e) => {
      const map = (e.target as L.Map)
      const c = map.getCenter()
      onChange({ bounds: map.getBounds(), zoom: map.getZoom(), center: [c.lat, c.lng] })
    },
    zoomend: (e) => {
      const map = (e.target as L.Map)
      const c = map.getCenter()
      onChange({ bounds: map.getBounds(), zoom: map.getZoom(), center: [c.lat, c.lng] })
    },
    load: (e) => {
      const map = (e.target as L.Map)
      const c = map.getCenter()
      onChange({ bounds: map.getBounds(), zoom: map.getZoom(), center: [c.lat, c.lng] })
    },
  })
  return null
}
function HeatmapLayer({
  points,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  enabled,
  gradient,
}: {
  points: Array<[number, number, number]>;
  radius?: number; blur?: number; maxZoom?: number; enabled: boolean
  gradient: GradientMap
}) {
  const map = useMap()
  const layerRef = useRef<any>(null)
  useEffect(() => {
    if (!enabled) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    const layer = (L as any).heatLayer(points, { radius, blur, maxZoom, gradient })
    layer.addTo(map)
    layerRef.current = layer
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, enabled, radius, blur, maxZoom, points, gradient])
  return null
}

// CSV helper
function debounce<T extends (...args:any[])=>void>(fn:T, ms:number){
  let t: any
  return (...args: Parameters<T>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

// URL helpers
function readQuery(): Record<string, string> {
  try {
    const usp = new URLSearchParams(window.location.search)
    const obj: Record<string, string> = {}
    usp.forEach((v, k) => { obj[k] = v })
    return obj
  } catch { return {} }
}
function writeQuery(next: Record<string, string | number | boolean | undefined | null>) {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === null || v === '') continue
    usp.set(k, String(v))
  }
  const url = `${window.location.pathname}?${usp.toString()}${window.location.hash || ''}`
  window.history.replaceState({}, '', url)
}

// Heatmap gradients
type GradientMap = Record<number, string>
const HEAT_GRADIENTS: Record<string, GradientMap> = {
  classic: { 0.0: '#2c7bb6', 0.2: '#abd9e9', 0.4: '#ffffbf', 0.6: '#fdae61', 0.8: '#d7191c', 1.0: '#8b0000' },
  fire: { 0.0: '#000000', 0.2: '#440154', 0.4: '#31688e', 0.6: '#35b779', 0.8: '#fde725', 1.0: '#ffffff' },
  bluegreen: { 0.0: '#0a2540', 0.25: '#1e3a8a', 0.5: '#0ea5a5', 0.75: '#a7f3d0', 1.0: '#ecfccb' },
}
function gradientToCssLinear(grad: GradientMap) {
  const stops = Object.entries(grad)
    .map(([k, v]) => ({ stop: Number(k), color: v }))
    .sort((a, b) => a.stop - b.stop)
    .map(({ stop, color }) => `${color} ${Math.round(stop * 100)}%`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

// Min placering knap – bruger mapRef
function MyLocationButton({
  onLocated, setBusy, mapRef,
}: {
  onLocated: (pos: { lat: number; lng: number; acc?: number }) => void
  setBusy: (b: boolean) => void
  mapRef: React.MutableRefObject<L.Map | null>
}) {
  const handleClick = () => {
    if (!('geolocation' in navigator)) {
      alert('Din browser understøtter ikke geolokation.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = pos.coords.accuracy
        onLocated({ lat, lng, acc })
        const map = mapRef.current
        if (map) map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { animate: true })
      },
      (err) => {
        setBusy(false)
        alert('Kunne ikke hente din placering: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }
  return (
    <button type="button" onClick={handleClick} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border hover:bg-slate-50" title="Zoom til min nuværende position">
      📍 Min placering
    </button>
  )
}

// Klik-capture til “Drop nål”
function MapClickCapture({ enabled, onPick }: { enabled: boolean; onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      const { lat, lng } = e.latlng
      onPick(lat, lng)
    }
  })
  return null
}

/** Vises kun til ejeren af en rapport i popup (skjul/soft-delete) */
function OwnerOnlyHideButton({
  reportId, ownerUserId, onHide,
}: {
  reportId: string
  ownerUserId: string
  onHide?: () => void
}) {
  const [isOwner, setIsOwner] = useState(false)
  const supabase = useMemo(() => supabaseBrowser(), [])

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession()
      const uid = session.session?.user.id
      setIsOwner(Boolean(uid && ownerUserId && uid === ownerUserId))
    })()
  }, [supabase, ownerUserId])

  if (!isOwner) return null

  return (
    <button
      type="button"
      className="text-xs px-2 py-1 rounded border hover:bg-rose-50 text-rose-700 border-rose-200"
      onClick={async () => { await onHide?.() }}
      title="Skjul (soft-delete) din egen rapport"
    >
      🗑️ Skjul
    </button>
  )
}

export default function HazardReportsMapClient({ hazardId }: { hazardId: string }) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [initialZoom, setInitialZoom] = useState<number>(7)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const mapRef = useRef<L.Map | null>(null)

  // Min placering
  const [myPos, setMyPos] = useState<[number, number] | null>(null)
  const [myAcc, setMyAcc] = useState<number | null>(null)
  const [locBusy, setLocBusy] = useState(false)

  // Følg mig
  const [followMe, setFollowMe] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Drop nål
  const [dropMode, setDropMode] = useState(false)
  const [tempPin, setTempPin] = useState<{ lat: number; lng: number } | null>(null)
  const [tempCropId, setTempCropId] = useState<string>('')
  const [tempSeverity, setTempSeverity] = useState<number>(3)
  const [tempNote, setTempNote] = useState<string>('')

  // Foto upload-UI
  const [tempFile, setTempFile] = useState<File | null>(null)
  const [tempPreview, setTempPreview] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  // Filtre
  const today = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  const [from, setFrom] = useState<string>(toDateInput(thirtyDaysAgo))
  const [to, setTo] = useState<string>(toDateInput(today))
  const [minSeverity, setMinSeverity] = useState<number>(1)
  const [cropId, setCropId] = useState<string>('')
  const [onlyMine, setOnlyMine] = useState<boolean>(false)
  const [cropOptions, setCropOptions] = useState<CropOpt[]>([])

  // Clustering
  const indexRef = useRef<supercluster | null>(null)
  const [clusters, setClusters] = useState<any[]>([])
  const [viewport, setViewport] = useState<{ bounds: L.LatLngBounds | null; zoom: number; center: [number, number] | null }>(
    { bounds: null, zoom: initialZoom, center: null }
  )

  // Heatmap
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatRadius, setHeatRadius] = useState(25)
  const [heatBlur, setHeatBlur] = useState(15)
  const [heatPalette, setHeatPalette] = useState<'classic' | 'fire' | 'bluegreen'>('classic')

  // Persistens
  const storageKey = `cm_hazardMap_${hazardId}`

  useEffect(() => {
    try {
      const q = readQuery()
      const raw = localStorage.getItem(storageKey)
      const saved = raw ? JSON.parse(raw) : {}

      const pick = <T extends string>(key:T, alt?:any) => (q[key] ?? saved[key] ?? alt)

      const qFrom = pick('from'); const qTo = pick('to')
      if (qFrom) setFrom(qFrom)
      if (qTo) setTo(qTo)

      const qMin = pick('minSeverity'); if (qMin) setMinSeverity(Number(qMin))
      const qCrop = pick('cropId'); if (qCrop) setCropId(qCrop)
      const qMine = pick('onlyMine'); if (qMine != null) setOnlyMine(qMine === 'true')

      const qShow = pick('heat');
      if (qShow != null) setShowHeatmap(String(qShow) === '1' || String(qShow) === 'true');
      const qRad = pick('hr'); if (qRad) setHeatRadius(Number(qRad))
      const qBlur = pick('hb'); if (qBlur) setHeatBlur(Number(qBlur))
      const qPal = pick('hp');
      if (qPal && ['classic', 'fire', 'bluegreen'].includes(qPal)) setHeatPalette(qPal as 'classic' | 'fire' | 'bluegreen')

      const qLat = pick('lat'); const qLng = pick('lng'); const qZoom = pick('z')
      if (qLat && qLng) setCenter([Number(qLat), Number(qLng)])
      if (qZoom) setInitialZoom(Number(qZoom))

      const qFollow = pick('fm'); if (qFollow != null) setFollowMe(String(qFollow) === '1' || String(qFollow) === 'true')
    } catch {/* ignore */}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useMemo(() => debounce((payload:any) => {
    try { localStorage.setItem(storageKey, JSON.stringify(payload)) } catch {/* ignore */}
    try { writeQuery(payload) } catch {/* ignore */}
  }, 300), [storageKey])

  useEffect(() => {
    const pay = {
      from, to, minSeverity, cropId, onlyMine,
      heat: showHeatmap ? 1 : 0, hr: heatRadius, hb: heatBlur, hp: heatPalette,
      lat: (viewport.center ?? center)?.[0],
      lng: (viewport.center ?? center)?.[1],
      z: viewport.zoom ?? initialZoom,
      fm: followMe ? 1 : 0,
    }
    persist(pay)
  }, [from, to, minSeverity, cropId, onlyMine, showHeatmap, heatRadius, heatBlur, heatPalette, center, viewport.center, viewport.zoom, initialZoom, followMe, persist])

  function setRangePreset(preset: '7' | '14' | '30' | 'ytd' | 'all') {
    const now = new Date()
    let start = new Date()
    if (preset === '7') start = new Date(Date.now() - 7 * 24 * 3600 * 1000)
    if (preset === '14') start = new Date(Date.now() - 14 * 24 * 3600 * 1000)
    if (preset === '30') start = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    if (preset === 'ytd') start = new Date(now.getFullYear(), 0, 1)
    if (preset === 'all') start = new Date(Date.now() - 365 * 24 * 3600 * 1000)
    setFrom(toDateInput(start)); setTo(toDateInput(now))
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link kopieret!')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = window.location.href
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      alert('Link kopieret!')
    }
  }

  // Datahentning
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true); setErr(null)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user.id

        const fromIso = new Date(from + 'T00:00:00').toISOString()
        const toIso = new Date(to + 'T23:59:59').toISOString()

        let q = supabase
          .from('hazard_reports')
          .select('id, latitude, longitude, created_at, severity, crop_id, photo_url, user_id, crops(name)')
          .eq('hazard_id', hazardId)
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
          .limit(5000)

        if (minSeverity > 1) q = q.gte('severity', minSeverity)
        if (cropId) q = q.eq('crop_id', cropId)
        if (onlyMine && uid) q = q.eq('user_id', uid)

        const { data, error } = await q
        if (error) throw error

        const mapped = (data || []).map((r: any): ReportRow => {
          let crops: { name: string } | null = null
          if (r.crops && !Array.isArray(r.crops)) crops = { name: r.crops?.name }
          else if (Array.isArray(r.crops) && r.crops.length > 0) crops = { name: r.crops[0]?.name }
          return { id: r.id, latitude: r.latitude, longitude: r.longitude, created_at: r.created_at, severity: r.severity, crop_id: r.crop_id, photo_url: r.photo_url ?? null, crops, user_id: r.user_id }
        })

        if (!alive) return
        setReports(mapped)

        const uniq = new Map<string, string>()
        for (const r of mapped) if (r.crop_id) uniq.set(r.crop_id, r.crops?.name || r.crop_id)
        setCropOptions(Array.from(uniq).map(([id, name]) => ({ crop_id: id, name })).sort((a, b) => a.name.localeCompare(b.name)))

        if (!center) {
          let ctr: [number, number] | null = null
          if (uid) {
            const { data: prof } = await supabase.from('profiles').select('latitude, longitude').eq('id', uid).maybeSingle()
            if (prof?.latitude != null && prof?.longitude != null) ctr = [prof.latitude, prof.longitude]
          }
          if (!ctr) {
            const first = mapped.find(r => r.latitude != null && r.longitude != null)
            ctr = first ? [first.latitude as number, first.longitude as number] : [56, 10]
          }
          setCenter(ctr)
        }
      } catch (e: any) {
        if (!alive) return
        setErr(e?.message || 'Kunne ikke hente rapporter.')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [supabase, hazardId, from, to, minSeverity, cropId, onlyMine]) // eslint-disable-line

  // supercluster index
  useEffect(() => {
    const features: PointFeature<any>[] = reports
      .filter(r => r.latitude != null && r.longitude != null)
      .map(r => ({
        type: 'Feature',
        properties: {
          cluster: false,
          id: r.id,
          severity: r.severity,
          created_at: r.created_at,
          crop_name: r.crops?.name || 'Afgrøde',
          photo_url: r.photo_url || null,
          latitude: r.latitude,
          longitude: r.longitude,
          user_id: r.user_id, // ← nødvendigt for owner-knap i popup
        },
        geometry: { type: 'Point', coordinates: [r.longitude as number, r.latitude as number] }
      }))
    const idx = new supercluster({ radius: 60, maxZoom: 20 })
    idx.load(features as any)
    indexRef.current = idx
    if (viewport.bounds) {
      const b = viewport.bounds; const z = viewport.zoom
      setClusters(idx.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(z)) as any)
    } else setClusters([])
  }, [reports]) // eslint-disable-line

  function handleViewportChange(v: { bounds: L.LatLngBounds; zoom: number; center: [number, number] }) {
    setViewport(v)
    const idx = indexRef.current
    if (!idx) return
    setClusters(idx.getClusters([v.bounds.getWest(), v.bounds.getSouth(), v.bounds.getEast(), v.bounds.getNorth()], Math.round(v.zoom)) as any)
  }

  function resetFilters() {
    setFrom(toDateInput(new Date(Date.now() - 30 * 24 * 3600 * 1000)))
    setTo(toDateInput(new Date()))
    setMinSeverity(1)
    setCropId('')
    setOnlyMine(false)
  }

  // Export CSV – alle filtrerede eller kun viewport
  function exportCsv(allFiltered: boolean) {
    const makeCsv = (rows: Array<Record<string, any>>) => {
      if (!rows.length) return ''
      const headers = Object.keys(rows[0])
      const esc = (v: any) => {
        if (v == null) return ''
        const s = String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      return [
        headers.join(','),
        ...rows.map(r => headers.map(h => esc(r[h])).join(',')),
      ].join('\n')
    }

    let chosen: ReportRow[] = []
    if (allFiltered) {
      chosen = reports
    } else {
      if (!viewport.bounds) {
        alert('Zoom/flyt kortet, så der er et udsnit at eksportere.')
        return
      }
      const b = viewport.bounds
      chosen = reports.filter(r => {
        if (r.latitude == null || r.longitude == null) return false
        return b.contains(L.latLng(r.latitude, r.longitude))
      })
      if (chosen.length === 0) {
        alert('Ingen punkter i det synlige kort-udsyn.')
        return
      }
    }

    const rows = chosen.map(r => ({
      id: r.id,
      created_at: r.created_at,
      severity: r.severity ?? null,
      crop_name: r.crops?.name || 'Afgrøde',
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      photo_url: r.photo_url ?? null,
    }))

    const csv = makeCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateTag = `${from}_to_${to}`
    a.href = url
    a.download = `hazard_reports_${dateTag}${allFiltered ? '' : '_viewport'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const heatPoints = useMemo(
    () => reports
      .filter(r => r.latitude != null && r.longitude != null)
      .map(r => {
        const sev = r.severity ?? 3
        const intensity = Math.max(0.2, Math.min(1, (sev / 5)))
        return [r.latitude as number, r.longitude as number, intensity] as [number, number, number]
      }),
    [reports]
  )
  const legendCss = gradientToCssLinear(HEAT_GRADIENTS[heatPalette])

  const handleLocated = (p: { lat: number; lng: number; acc?: number }) => { setMyPos([p.lat, p.lng]); setMyAcc(p.acc ?? null) }

  // Følg mig
  useEffect(() => {
    if (!followMe) {
      if (watchIdRef.current != null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      return
    }
    if (!('geolocation' in navigator)) { alert('Din browser understøtter ikke geolokation.'); setFollowMe(false); return }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude; const acc = pos.coords.accuracy
        setMyPos([lat, lng]); setMyAcc(acc ?? null)
        if (mapRef.current) {
          const map = mapRef.current
          const nextZoom = Math.max(map.getZoom(), 14)
          map.setView([lat, lng], nextZoom, { animate: true })
        }
      },
      (err) => { console.warn('watchPosition error', err); alert('Live-tracking fejlede: ' + err.message); setFollowMe(false) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    )
    watchIdRef.current = id as unknown as number
    return () => {
      if (watchIdRef.current != null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [followMe])

  // Drop nål – klik på kortet
  function onPickMap(lat: number, lng: number) {
    if (!dropMode) return
    setTempPin({ lat, lng })
    if (!tempCropId && cropId) setTempCropId(cropId)
  }

  // ==== MODERATION HANDLERS ====
  async function flagReport(reportId: string) {
    const reason = prompt('Skriv kort hvorfor du flagger (valgfrit):') || null
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    if (!uid) { alert('Log ind for at flagge.'); return }

    const { error } = await supabase
      .from('hazard_reports')
      .update({
        status: 'flagged',
        flagged_by: uid,
        flagged_reason: reason,
        flagged_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (error) { alert('Kunne ikke flagge: ' + error.message); return }
    alert('Tak! Rapporten er flagget til gennemgang.')
    // (vi lader den blive synlig – admin kan skjule senere)
  }

  async function hideOwnReport(reportId: string) {
    if (!confirm('Skjul rapporten for offentlig visning?')) return
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    if (!uid) { alert('Log ind først.'); return }

    const { error } = await supabase
      .from('hazard_reports')
      .update({ status: 'hidden' })
      .eq('id', reportId)
      .eq('user_id', uid)

    if (error) { alert('Kunne ikke skjule: ' + error.message); return }
    // Fjern fra visning
    setReports(prev => prev.filter(r => r.id !== reportId))
  }
  // =============================

  // Gem dropped (med valgfri foto-upload)
  async function saveDroppedReport() {
    if (!tempPin) return
    const { data: session } = await supabase.auth.getSession()
    const uid = session.session?.user.id
    if (!uid) { alert('Du skal være logget ind for at gemme en rapport.'); return }
    if (!tempCropId) { alert('Vælg en afgrøde.'); return }

    try {
      setUploadBusy(true)

      // 1) Upload billede (valgfrit)
      let photoUrl: string | null = null
      if (tempFile) {
        const ext = (tempFile.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${uid}/${hazardId}/${Date.now()}.${ext}`

        const up = await supabase.storage.from(HAZARD_BUCKET).upload(path, tempFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: tempFile.type || 'image/jpeg',
        })
        if (up.error) throw up.error

        const pub = supabase.storage.from(HAZARD_BUCKET).getPublicUrl(path)
        photoUrl = pub.data.publicUrl || null
      }

      // 2) Indsæt rapport
      const payload: any = {
        user_id: uid,
        hazard_id: hazardId,
        crop_id: tempCropId,
        latitude: Number(tempPin.lat.toFixed(6)),
        longitude: Number(tempPin.lng.toFixed(6)),
        severity: tempSeverity,
        message: tempNote || null,
        photo_url: photoUrl,
      }

      const { data, error } = await supabase
        .from('hazard_reports')
        .insert(payload)
        .select('id, created_at')

      if (error) throw error

      const newId = data?.[0]?.id || crypto.randomUUID()
      const created_at = data?.[0]?.created_at || new Date().toISOString()
      const cropName = cropOptions.find(c => c.crop_id === tempCropId)?.name || 'Afgrøde'

      // 3) Optimistisk UI-opdatering
      setReports(prev => [
        {
          id: newId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          created_at,
          severity: tempSeverity,
          crop_id: tempCropId,
          photo_url: photoUrl,
          user_id: uid,
          crops: { name: cropName }
        },
        ...prev,
      ])

      // 4) Ryd panel
      setTempPin(null)
      setTempNote('')
      setTempSeverity(3)
      setTempCropId('')
      setTempFile(null)
      setTempPreview(null)
      setDropMode(false)

      alert('Rapport gemt.')
    } catch (e: any) {
      alert('Kunne ikke gemme rapport: ' + (e?.message || e))
    } finally {
      setUploadBusy(false)
    }
  }
  function cancelDropped() {
    setTempPin(null)
    setTempNote('')
    setTempSeverity(3)
    setTempCropId('')
    setTempFile(null)
    setTempPreview(null)
  }

  return (
    <div className="grid gap-3">
      {/* FILTRE */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Fra</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border px-2 py-1 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Til</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border px-2 py-1 rounded" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Min. alvorlighed</span>
            <select value={minSeverity} onChange={(e) => setMinSeverity(Number(e.target.value))} className="border px-2 py-1 rounded">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-70">Afgrøde</span>
            <select value={cropId} onChange={(e) => setCropId(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">Alle</option>
              {cropOptions.map(c => <option key={c.crop_id} value={c.crop_id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 mb-0.5" title="Intensiteten vægtes efter alvorlighed: 1→0.2, 5→1.0. Farven viser tæthed × alvorlighed.">
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
            <span className="text-sm">Heatmap</span>
          </label>

          {/* Højre side */}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <MyLocationButton onLocated={handleLocated} setBusy={setLocBusy} mapRef={mapRef} />
            {locBusy && <span className="text-xs opacity-70">Finder position…</span>}

            <label className="flex items-center gap-2" title="Live-tracking: kortet følger din GPS-position.">
              <input type="checkbox" checked={followMe} onChange={(e) => setFollowMe(e.target.checked)} />
              <span className="text-sm">Følg mig (live)</span>
            </label>

            <button
              type="button"
              onClick={() => setDropMode(v => !v)}
              className={`text-xs px-2 py-1 rounded border hover:bg-slate-50 ${dropMode ? 'bg-amber-50 border-amber-300' : ''}`}
              title="Klik på kortet for at vælge en position; træk nålen for at finjustere."
            >
              📌 {dropMode ? 'Drop nål (aktiv)' : 'Drop nål'}
            </button>

            {showHeatmap && (
              <>
                <label className="grid gap-0.5">
                  <span className="text-[11px] opacity-70">Palette</span>
                  <select value={heatPalette} onChange={(e)=>setHeatPalette(e.target.value as any)} className="border px-2 py-1 rounded">
                    <option value="classic">Classic</option>
                    <option value="fire">Fire</option>
                    <option value="bluegreen">Blue–Green</option>
                  </select>
                </label>
                <label className="grid gap-0.5">
                  <span className="text-[11px] opacity-70">Radius</span>
                  <input type="number" min={5} max={50} value={heatRadius} onChange={e=>setHeatRadius(Number(e.target.value)||25)} className="border px-2 py-1 rounded w-20"/>
                </label>
                <label className="grid gap-0.5">
                  <span className="text-[11px] opacity-70">Blur</span>
                  <input type="number" min={5} max={50} value={heatBlur} onChange={e=>setHeatBlur(Number(e.target.value)||15)} className="border px-2 py-1 rounded w-20"/>
                </label>
              </>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">Hurtigvalg:</span>
              <button type="button" onClick={() => setRangePreset('7')}  className="text-xs px-2 py-1 rounded border hover:bg-slate-50">7 dage</button>
              <button type="button" onClick={() => setRangePreset('14')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">14 dage</button>
              <button type="button" onClick={() => setRangePreset('30')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">30 dage</button>
              <button type="button" onClick={() => setRangePreset('ytd')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">I år</button>
              <button type="button" onClick={() => setRangePreset('all')} className="text-xs px-2 py-1 rounded border hover:bg-slate-50">Alt</button>

              <button type="button" onClick={resetFilters} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" title="Nulstil alle filtre">Nulstil</button>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l">
              <button type="button" onClick={() => exportCsv(true)}  className="text-xs px-2 py-1 rounded border hover:bg-slate-50" title="Download CSV for alle rækker der matcher dine filtre">Export (alle)</button>
              <button type="button" onClick={() => exportCsv(false)} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" title="Download CSV for punkter i det synlige kort-udsyn">Export (udsnit)</button>
              <button type="button" onClick={copyLink} className="text-xs px-2 py-1 rounded border hover:bg-slate-50" title="Kopiér link til denne visning">Kopiér link</button>
            </div>
          </div>
        </div>

        {dropMode && (
          <div className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
            Drop nål er aktiv – klik på kortet for at vælge en position. <b>Træk nålen</b> for at finjustere.
          </div>
        )}
      </div>

      {loading && <div className="opacity-60 text-sm">Indlæser kort…</div>}
      {err && <div className="text-sm text-rose-700 bg-rose-50 p-3 rounded">{err}</div>}

      {!loading && !err && center && (
        <div className="w-full h-[420px] rounded-2xl overflow-hidden ring-1 ring-slate-200 relative">
          <MapContainer
            center={center}
            zoom={initialZoom}
            scrollWheelZoom
            style={{ width: '100%', height: '100%' }}
            className="z-0"
            whenCreated={(map) => { mapRef.current = map }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <Circle center={center} radius={5000} />
            <ViewportTracker onChange={handleViewportChange} />
            <MapClickCapture enabled={dropMode} onPick={onPickMap} />

            {showHeatmap ? (
              <HeatmapLayer enabled points={heatPoints} radius={heatRadius} blur={heatBlur} maxZoom={18} gradient={HEAT_GRADIENTS[heatPalette]} />
            ) : (
              <>
                {clusters.map((f: any) => {
                  const [lng, lat] = f.geometry.coordinates
                  const isCluster = f.properties.cluster
                  if (isCluster) {
                    const count = f.properties.point_count as number
                    const icon = clusterDivIcon(count)
                    return (
                      <Marker
                        key={`cluster-${f.id}`}
                        position={[lat, lng]}
                        icon={icon}
                        eventHandlers={{
                          click: (e) => {
                            const idx = indexRef.current; if (!idx) return
                            const expansionZoom = Math.min(idx.getClusterExpansionZoom(f.id), 20)
                            const map = (e.target as any)._map as L.Map
                            map.setView([lat, lng], expansionZoom, { animate: true })
                          }
                        }}
                      />
                    )
                  } else {
                    const p = f.properties
                    return (
                      <Marker key={p.id} position={[lat, lng]} icon={pinIcon(p.severity)}>
                        <Popup>
                          <div className="text-sm space-y-2">
                            <div>
                              <div className="font-medium">{p.crop_name} · Alvor: {p.severity ?? '-'}</div>
                              <div className="opacity-60 text-xs">{new Date(p.created_at).toLocaleString('da-DK')}</div>
                            </div>

                            {p.photo_url && (
                              <img
                                src={p.photo_url}
                                alt="foto"
                                style={{ maxWidth: 240, maxHeight: 160, display: 'block', borderRadius: 6 }}
                              />
                            )}

                            <div className="flex items-center gap-2 pt-1 border-t">
                              <button
                                type="button"
                                className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                                onClick={() => flagReport(p.id)}
                                title="Rapportér upassende/fejlbehæftet indhold til gennemgang"
                              >
                                🚩 Flag
                              </button>

                              <OwnerOnlyHideButton
                                reportId={p.id}
                                ownerUserId={p.user_id}
                                onHide={() => hideOwnReport(p.id)}
                              />
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  }
                })}
              </>
            )}

            {myPos && (
              <>
                <CircleMarker center={myPos} radius={6} pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }} />
                {myAcc && myAcc > 0 && myAcc < 5000 && (
                  <Circle center={myPos} radius={myAcc} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }} />
                )}
              </>
            )}

            {tempPin && (
              <Marker
                position={[tempPin.lat, tempPin.lng]}
                icon={pinIcon(tempSeverity)}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as L.Marker
                    const ll = m.getLatLng()
                    setTempPin({ lat: ll.lat, lng: ll.lng })
                  }
                }}
              />
            )}
          </MapContainer>

          {showHeatmap && (
            <div
              className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg shadow ring-1 ring-slate-200 px-3 py-2 pointer-events-auto"
              style={{ zIndex: 1000 }}
            >
              <div className="text-[11px] mb-1 opacity-70">Intensitet (vægtet af alvorlighed)</div>
              <div style={{ width: 180, height: 10, borderRadius: 6, background: { ['classic']: gradientToCssLinear(HEAT_GRADIENTS.classic), ['fire']: gradientToCssLinear(HEAT_GRADIENTS.fire), ['bluegreen']: gradientToCssLinear(HEAT_GRADIENTS.bluegreen) }[heatPalette] }} />
              <div className="flex justify-between text-[11px] opacity-70 mt-1"><span>Lav</span><span>Høj</span></div>
              <p className="text-[11px] opacity-70 mt-1">Farveskalaen afspejler <em>tæthed × alvorlighed</em>. Alvorlighed vægter 1→0.2 … 5→1.0.</p>
            </div>
          )}

          {tempPin && (
            <div
              className="absolute bottom-3 right-3 bg-white/95 backdrop-blur rounded-xl shadow-lg ring-1 ring-slate-200 p-3 w-[300px] pointer-events-auto"
              style={{ zIndex: 1001 }}
            >
              <div className="text-sm font-medium mb-2">Gem observation her?</div>
              <div className="text-xs opacity-70 mb-2">
                Lat: {tempPin.lat.toFixed(5)}, Lng: {tempPin.lng.toFixed(5)} (du kan trække nålen)
              </div>

              <div className="grid gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-xs opacity-70">Afgrøde</span>
                  <select value={tempCropId} onChange={(e)=>setTempCropId(e.target.value)} className="border px-2 py-1 rounded">
                    <option value="">— vælg —</option>
                    {cropOptions.map(c => (<option key={c.crop_id} value={c.crop_id}>{c.name}</option>))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs opacity-70">Alvorlighed (1–5)</span>
                  <input type="number" min={1} max={5} value={tempSeverity} onChange={(e)=>setTempSeverity(Math.max(1, Math.min(5, Number(e.target.value) || 3)))} className="border px-2 py-1 rounded" />
                </label>

                <label className="grid gap-1 text-sm">
                  <span className="text-xs opacity-70">Note (valgfri)</span>
                  <textarea value={tempNote} onChange={(e)=>setTempNote(e.target.value)} className="border px-2 py-1 rounded min-h-[60px]" placeholder="Kort note…" />
                </label>

                {/* Foto upload */}
                <label className="grid gap-1 text-sm">
                  <span className="text-xs opacity-70">Foto (valgfrit)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      setTempFile(f || null)
                      if (f) {
                        const url = URL.createObjectURL(f)
                        setTempPreview(url)
                      } else {
                        setTempPreview(null)
                      }
                    }}
                  />
                </label>

                {tempPreview && (
                  <div className="mt-1">
                    <img
                      src={tempPreview}
                      alt="preview"
                      style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8 }}
                      onLoad={() => { if (tempPreview) URL.revokeObjectURL(tempPreview) }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button type="button" onClick={saveDroppedReport} disabled={uploadBusy} className="px-3 py-1.5 text-sm rounded bg-slate-900 text-white">
                  {uploadBusy ? 'Uploader…' : 'Gem'}
                </button>
                <button type="button" onClick={cancelDropped} disabled={uploadBusy} className="px-3 py-1.5 text-sm rounded border">Annullér</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !err && (!reports || reports.length === 0) && (
        <div className="text-sm opacity-70">Ingen rapporter matcher dine filtre.</div>
      )}
    </div>
  )
}
