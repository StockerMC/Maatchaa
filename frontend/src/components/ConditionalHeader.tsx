"use client"

import { usePathname } from "next/navigation"
import Header from "./Header"

export default function ConditionalHeader() {
    const pathname = usePathname()

    // Don't show header on dashboard routes or onboarding
    if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding')) {
        return null
    }

    return <Header />
}
