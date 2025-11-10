export function WeatherAlert({ type, message }: { type: 'frost'|'dry'|'rain'|'heat'; message: string }) {
  const icon = { frost: '❄️', dry: '🌵', rain: '🌧️', heat: '🔥' }[type];
  return (
    <div className="rounded-xl border p-3 text-sm flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <p>{message}</p>
    </div>
  );
}
