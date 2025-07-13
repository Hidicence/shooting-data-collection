import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'

export const metadata: Metadata = {
  title: '拍攝數據收集系統',
  description: '簡易高效的拍攝現場數據收集平台',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen">
        <div className="container mx-auto max-w-md">
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </div>
      </body>
    </html>
  )
} 