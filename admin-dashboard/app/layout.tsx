import type React from "react"
import type { Metadata } from "next"
import { Work_Sans, Open_Sans } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/sidebar-provider"

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "600", "700"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "MATCHAA Business Dashboard",
  description: "Connect your Shopify business with YouTube creators for product placement",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} ${openSans.variable} font-sans antialiased`}>
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  )
}
