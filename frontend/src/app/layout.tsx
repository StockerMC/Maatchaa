import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { GoogleAnalytics } from '@next/third-parties/google'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Theme } from '@radix-ui/themes'
import ConditionalHeader from "@/components/ConditionalHeader"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Toaster } from 'react-hot-toast'

const satoshi = localFont({
    src: [
        {
            path: "../../public/fonts/satoshi/Satoshi-Light.otf",
            weight: "300",
            style: "normal",
        },
        {
            path: "../../public/fonts/satoshi/Satoshi-Regular.otf",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../public/fonts/satoshi/Satoshi-Medium.otf",
            weight: "500",
            style: "normal",
        },
        {
            path: "../../public/fonts/satoshi/Satoshi-Bold.otf",
            weight: "700",
            style: "normal",
        },
        {
            path: "../../public/fonts/satoshi/Satoshi-Black.otf",
            weight: "900",
            style: "normal",
        },
    ],
    variable: "--font-satoshi",
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
        <body className={satoshi.variable}>
            <Theme appearance="light" accentColor="lime" grayColor="sage" radius="medium">
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
            <SpeedInsights />
        </body>
        </html>
    )
}
