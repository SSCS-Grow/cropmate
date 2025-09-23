import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'
import NavTasksBadge from '../components/NavTasksBadge'
import AdminBadge from '@/components/AdminBadge'
import AdminNavLink from '@/components/AdminNavLink'

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'CropMate',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-4xl mx-auto p-4">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                {process.env.NEXT_PUBLIC_APP_NAME || 'CropMate'}
              </h1>
              {/* Vises kun for admin-brugere */}
              <AdminBadge />
            </div>

            <nav className="flex gap-4 text-sm">
              <Link className="underline" href="/dashboard">Dashboard</Link>
              <Link className="underline" href="/crops">Katalog</Link>
              <Link className="underline" href="/hazards">Skadedyr</Link>
              <Link className="underline" href="/my">Min have</Link>
              <Link className="underline inline-flex items-center" href="/tasks">
                Opgaver
                <NavTasksBadge /> {/* ← badge her */}
              </Link>
              <Link className="underline" href="/settings">Indstillinger</Link>
               <AdminNavLink /> {/* ← vises kun for admins */}
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  )
}
