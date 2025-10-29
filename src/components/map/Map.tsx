'use client';

import dynamic from 'next/dynamic';

export type Point = { lat: number; lng: number; v?: number };
type MapInnerProps = { points: Point[] };

// Typér dynamic import, så TS kender props
const LeafletMap = dynamic<MapInnerProps>(
  () => import('./MapInner').then((m) => m.default),
  { ssr: false }
);

export default function Map({ points }: { points: Point[] }) {
  return <LeafletMap points={points} />;
}
