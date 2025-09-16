
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Latela - South African Budgeting App',
  description: 'Modern budgeting application for South African users with ZAR support and AI transaction categorization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-white">
          <header className="bg-green-600 text-white p-4">
            <h1 className="text-xl font-bold">🇿🇦 Latela - ZAR Budgeting</h1>
          </header>
          {children}
        </main>
      </body>
    </html>
  )
}