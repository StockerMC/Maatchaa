"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const isHomePage = pathname === "/"
    const [isScrolled, setIsScrolled] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Mark as mounted to prevent hydration mismatch
        setMounted(true)

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100)
        }

        // Set initial state
        handleScroll()

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

    return (
        <header className="fixed top-0 left-0 right-0 z-20 py-4 flex justify-center bg-transparent">
            <NavigationMenu.Root
                className={cn(
                    "mx-auto mt-2 flex items-center",
                     "px-8 py-2"
                )}
                style={{
                    borderRadius: scrolledState ? '9999px' : '0px',
                    border: scrolledState ? '1.5px solid rgba(0, 0, 0, 0.15)' : '1.5px solid transparent',
                    backgroundColor: scrolledState ? 'rgb(255, 255, 255)' : 'transparent',
                    backdropFilter: scrolledState ? 'blur(12px)' : 'none',
                    boxSizing: 'border-box',
                    transition: 'all 500ms ease-in-out',
                }}
            >
                <NavigationMenu.List className="flex items-center" style={{ margin: 0, padding: 0, gap: '2.5rem' }}>
                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
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
                                    "text-sm font-medium transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}
                            >
                                Home
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/blog"
                                className={cn(
                                    "text-sm font-medium transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}
                            >
                                Blog
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/onboarding"
                                className={cn(
                                    "text-sm font-medium transition-colors duration-500",
                                    scrolledState ? "text-black hover:text-gray-700" : "text-white hover:text-white/80"
                                )}
                                style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}
                            >
                                Demo
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                        <Button
                            variant="solid"
                            color="lime"
                            size="2"
                            onClick={handleWaitlistClick}
                            style={{
                                height: '28px',
                                padding: '4px 12px',
                                fontSize: '14px',
                                lineHeight: '20px',
                                border: '1px solid transparent',
                                boxSizing: 'border-box',
                                transition: 'all 500ms ease-in-out',
                                color: scrolledState ? undefined : 'white',
                                backgroundColor: scrolledState ? undefined : 'transparent',
                                boxShadow: scrolledState ? undefined : 'none',
                            }}
                        >
                            Waitlist
                        </Button>
                    </NavigationMenu.Item>
                </NavigationMenu.List>
            </NavigationMenu.Root>
        </header>
    )
}
