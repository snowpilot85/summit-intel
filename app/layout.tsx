import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Summit Intel - CCMR Dashboard',
  description: 'Summit Intel College, Career & Military Readiness Dashboard',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
