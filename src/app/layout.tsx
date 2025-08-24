import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'CropMate',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-4xl mx-auto p-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-4">
            <h1 className="text-2xl font-semibold">
              {process.env.NEXT_PUBLIC_APP_NAME || 'CropMate'}
            </h1>

            <nav className="flex gap-4 text-sm">
  <a className="underline" href="/dashboard">Dashboard</a>
  <a className="underline" href="/crops">Katalog</a>
  <a className="underline" href="/my">Min have</a>
  <a className="underline" href="/settings">Indstillinger</a>
</nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  )
}
