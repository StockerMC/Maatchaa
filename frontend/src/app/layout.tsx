import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import { GoogleAnalytics } from '@next/third-parties/google'
import { Theme } from '@radix-ui/themes'
import ConditionalHeader from "@/components/ConditionalHeader"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Toaster } from 'react-hot-toast'

const figtree = Figtree({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-figtree",
    display: "swap",
})

export const metadata: Metadata = {
    title: "Maatchaa",
    description: "",
    generator: "",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`${figtree.variable}`}>
            <Theme appearance="light" accentColor="green" radius="full">
                <Providers>
                    <div className="flex flex-col min-h-screen overflow-x-hidden">
                        <ConditionalHeader/>
                        <main className="flex flex-grow w-full">
                            {children}
                        </main>
                    </div>
                    <Toaster />
                </Providers>
            </Theme>
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
                <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
            )}
        </body>
        </html>
    )
}
