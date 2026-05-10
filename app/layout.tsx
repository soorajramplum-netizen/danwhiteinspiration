import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marketing Oracle — 100 Lessons of Marketing Excellence',
  description: 'An AI-powered marketing advisor trained on 100 iconic case studies from "The Marketing Inspiration Book" by Dan White. Strategy and inspiration for CMOs and brand leaders.',
  keywords: 'marketing strategy, brand building, CMO, marketing inspiration, case studies',
  openGraph: {
    title: 'Marketing Oracle',
    description: 'AI-powered marketing advisor trained on 100 iconic case studies of marketing excellence',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="noise-texture">
        {children}
      </body>
    </html>
  )
}
