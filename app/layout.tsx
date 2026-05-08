import type React from 'react'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Suspense } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'VeriFiBIN - Bank Identification Number Verification',
  description: 'Professional BIN verification and card analysis platform',
  generator: 'VeriFiBIN v1.0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-mono ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const density = window.localStorage.getItem('app-density') || 'comfortable';
              document.documentElement.setAttribute('data-density', density);
            })();`,
          }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
