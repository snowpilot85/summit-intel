import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DSM Dashboard - District Success Manager',
  description: 'Summit K12 District Success Manager Dashboard',
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
