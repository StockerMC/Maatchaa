import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import { GoogleAnalytics } from '@next/third-parties/google'
import { Theme } from '@radix-ui/themes'
import Header from "@/components/Header"
import "./globals.css"
import Gradient from "@/components/Gradient"
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
                    <div className="flex flex-col min-h-screen overflow-x-hidden relative">
                        {/* Fixed background - outside main content flow */}
                        <div className="fixed inset-0 w-full h-full -z-10">
                            <Gradient
                                className="w-full h-full"
                                gradientColors={[
                                    "#A8BF9C", // Mid-tone matcha
                                    "#98B88C", // Soft matcha
                                    "#9CB894", // Warm matcha
                                    "#A5C39A", // Light matcha
                                    "#8FB080", // Muted green
                                    "#9DBE91", // Balanced matcha
                                    "#A2BB96", // Subtle green
                                    "#96B58A", // Natural matcha
                                ]}
                                noise={0.08}
                                spotlightRadius={0.6}
                                spotlightOpacity={0}
                                distortAmount={2.5}
                                mirrorGradient={true}
                                angle={45}
                                paused={false}
                            />
                        </div>
                        <Header/>
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
