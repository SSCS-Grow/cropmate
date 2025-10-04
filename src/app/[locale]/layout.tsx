import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import PwaRegistrar from '../../components/PwaRegistrar';

export const locales = ['da', 'en'] as const;
export type Locale = typeof locales[number];

export function generateStaticParams() {
  return locales.map((l) => ({ locale: l }));
}

export const metadata = {
  title: 'CropMate',
  description: 'Have- og markassistent: vejr, opgaver, observationer og bibliotek.'
};

export default async function LocaleLayout({
  children,
  params
}: { children: ReactNode; params: { locale: string } }) {
  const locale = params.locale;
  if (!locales.includes(locale as any)) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <PwaRegistrar />
      </body>
    </html>
  );
}
