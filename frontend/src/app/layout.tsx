import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import Header from "@/components/Header"
import "./globals.css"

const figtree = Figtree({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-figtree",
    display: "swap",
})

export const metadata: Metadata = {
    title: "Knotch - Connect creators with brands",
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
        <div className="flex flex-col min-h-screen overflow-x-hidden">
            <Header/>
            <main className="flex flex-grow items-center justify-center w-full px-6">
                {children}
            </main>
        </div>
        </body>
        </html>
    )
}
