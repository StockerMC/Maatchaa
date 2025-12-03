"use client"

import { usePathname } from "next/navigation"
import Header from "./Header"

export default function ConditionalHeader() {
    const pathname = usePathname()

    // Don't show header on dashboard routes, onboarding, or partnership pages
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding') || pathname?.startsWith('/partnership')) {
        return null
    }

    return <Header />
}
