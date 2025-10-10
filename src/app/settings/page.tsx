import ServiceWorkerReady from "@/components/system/ServiceWorkerReady";
import PushCta from "@/components/settings/PushCta";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Sørger for at service worker er registreret i browseren */}
      <ServiceWorkerReady />

      <h1 className="text-2xl font-bold">Indstillinger</h1>

      {/* Notifikationer (Web Push) */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Notifikationer</h2>
        <p className="text-sm opacity-70">
          Aktiver web push for at få beskeder om vigtige hændelser (frost, sygdomsvarsler m.m.).
        </p>
        <PushCta />
      </section>

      {/* Plads til flere indstillinger senere */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">PWA</h2>
        <ul className="list-disc pl-5 text-sm opacity-80">
          <li>Installer CropMate som app via browserens “Installér app”/“Add to Home Screen”.</li>
          <li>Giv tilladelse til notifikationer for at modtage push-beskeder.</li>
        </ul>
      </section>
    </div>
  );
}
