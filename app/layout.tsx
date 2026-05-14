import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Marketing Inspiration — Inspired by Dan White',
  description: 'An AI-powered marketing inspiration tool trained on 100 iconic case studies from "The Marketing Inspiration Book" by Dan White.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
