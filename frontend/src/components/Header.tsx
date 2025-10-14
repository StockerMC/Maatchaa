"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import { sage, gold } from "@radix-ui/colors"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Header() {
    const pathname = usePathname()
    const router = useRouter()
    const isHomePage = pathname === "/"
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        // Check initial scroll position on mount
        const checkScrollPosition = () => {
            setIsScrolled(window.scrollY > 100)
        }

        // Check immediately on mount
        checkScrollPosition()

        // Then add scroll listener
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100)
        }

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

    return (
        <header className="fixed top-0 left-0 right-0 z-20 py-4 flex justify-center bg-transparent">
            <NavigationMenu.Root
                className={cn(
                    "mx-auto mt-2 flex items-center",
                    "px-4 py-2",
                    "transition-all duration-500 ease-in-out"
                )}
                style={{
                    borderRadius: isScrolled ? '9999px' : '0px',
                    border: isScrolled ? `2px solid ${sage.sage7}` : '2px solid transparent',
                    backgroundColor: isScrolled ? `${gold.gold2}99` : 'transparent',
                    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
                    boxShadow: isScrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none',
                }}
            >
                <NavigationMenu.List className="flex items-center gap-8" style={{ margin: 0, padding: 0 }}>
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
                                    isScrolled ? "text-gray-600 hover:text-gray-900" : "text-white hover:text-white/80"
                                )}
                                style={{ display: 'flex', alignItems: 'center' }}
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
                                    isScrolled ? "text-gray-600 hover:text-gray-900" : "text-white hover:text-white/80"
                                )}
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                Blog
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item style={{ display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                        <Button
                            variant="surface"
                            color="lime"
                            size="2"
                            onClick={handleWaitlistClick}
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 500ms ease-in-out',
                                height: 'auto',
                                padding: '0.25rem 0.75rem',
                                lineHeight: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                ...(!isScrolled && {
                                    color: 'white',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    boxShadow: 'none',
                                    outline: 'none',
                                })
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
