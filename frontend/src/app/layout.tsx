import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Komi - Pedidos con IA',
    template: '%s | Komi'
  },
  description: 'Pide comida usando lenguaje natural. Komi entiende lo que quieres comer y encuentra los mejores restaurantes para ti.',
  keywords: ['comida', 'pedidos', 'inteligencia artificial', 'delivery', 'restaurantes'],
  authors: [{ name: 'Komi Team' }],
  creator: 'Komi Team',
  publisher: 'Komi Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Komi - Pedidos con IA',
    description: 'Pide comida usando lenguaje natural. Komi entiende lo que quieres comer y encuentra los mejores restaurantes para ti.',
    url: '/',
    siteName: 'Komi',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Komi - Pedidos con IA',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Komi - Pedidos con IA',
    description: 'Pide comida usando lenguaje natural',
    images: ['/og-image.png'],
    creator: '@komiapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    title: 'Komi',
    statusBarStyle: 'default',
    capable: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e85d4a' },
    { media: '(prefers-color-scheme: dark)', color: '#e85d4a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div id="root" className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
          {children}
        </div>
        <div id="modal-root" />
        <div id="toast-root" />
      </body>
    </html>
  )
} 