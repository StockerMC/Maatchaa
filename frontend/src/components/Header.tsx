"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { cn } from "@/lib/utils"

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const isHomePage = pathname === "/"
    const [isScrolled, setIsScrolled] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100)
        }

        // Batch initial state updates to prevent flickering
        requestAnimationFrame(() => {
            const initialScrollY = window.scrollY > 100
            setMounted(true)
            setIsScrolled(initialScrollY)
        })

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleWaitlistClick = () => {
        if (isHomePage) {
            // Already on home page, just scroll
            document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
        } else {
            // Navigate to home page, then scroll will be handled by WaitlistScrollHandler
            router.push('/#waitlist')
        }
    }

    // Use mounted state to prevent hydration mismatch
    const scrolledState = mounted && isScrolled

    // Static button styles - dynamic color/bg handled via CSS classes to avoid re-render glitch
    const buttonStyle = useMemo(() => ({
        height: '34px',
        padding: '0 14px',
        margin: '0 1px',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        borderRadius: '18px',
        border: 'none',
        boxSizing: 'border-box' as const,
        cursor: 'pointer',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }), [])

    const linkStyle = useMemo(() => ({
        padding: '0 18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.2px',
        textDecoration: 'none',
        transition: 'all 500ms ease-in-out',
        boxSizing: 'border-box' as const,
    }), [])

    return (
        <header className="fixed top-0 left-0 right-0 z-20 py-4 flex justify-center bg-transparent">
            <NavigationMenu.Root
                className={cn(
                    "mx-auto mt-2 flex items-center"
                )}
                style={{
                    height: '42px',
                    padding: '2px',
                    borderRadius: '9999px',
                    border: scrolledState ? '1.5px solid rgba(0, 0, 0, 0.15)' : '1.5px solid transparent',
                    backgroundColor: scrolledState ? 'rgb(255, 255, 255)' : 'transparent',
                    backdropFilter: scrolledState ? 'blur(12px)' : 'none',
                    boxSizing: 'border-box',
                    transition: 'all 500ms ease-in-out',
                }}
            >
                <NavigationMenu.List className="flex items-center" style={{ margin: 0, padding: 0, gap: '3px', height: '100%' }}>
                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0, height: '100%' }}>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/"
                                onClick={(e) => {
                                    if (isHomePage) {
                                        e.preventDefault();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className={cn(
                                    "transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={linkStyle}
                            >
                                Home
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0, height: '100%' }}>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/blog"
                                className={cn(
                                    "transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={linkStyle}
                            >
                                Blog
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0, height: '100%' }}>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/dashboard"
                                className={cn(
                                    "transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={linkStyle}
                            >
                                Demo
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0, height: '100%' }}>
                        <button
                            onClick={handleWaitlistClick}
                            className={cn(
                                "transition-all duration-500",
                                scrolledState
                                    ? "text-black bg-[var(--lime-10)]"
                                    : "text-white bg-transparent"
                            )}
                            style={buttonStyle}
                        >
                            Waitlist
                        </button>
                    </NavigationMenu.Item>
                </NavigationMenu.List>
            </NavigationMenu.Root>
        </header>
    )
}
