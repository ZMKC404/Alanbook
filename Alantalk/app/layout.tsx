import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "阿霖的内容生态",
  description: "窄门科创出品",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <style>
          {`
            @font-face {
              font-family: 'KingHwa_OldSong';
              src: url('/fonts/KingHwa_OldSong.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
            
            body {
              font-family: 'KingHwa_OldSong', serif;
            }
          `}
        </style>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
