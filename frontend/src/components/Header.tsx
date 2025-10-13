"use client"

//FIXME: AFTER SCROLLING AND REFERESHING THE HEADER STATE RESETS TO WHITE
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
                    "mx-auto mt-2 flex items-center justify-between gap-3",
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
                <NavigationMenu.List className="flex items-center gap-8">
                    <NavigationMenu.Item>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/"
                                className={cn(
                                    "text-sm font-medium transition-colors duration-500",
                                    isScrolled ? "text-gray-600 hover:text-gray-900" : "text-white hover:text-white/80"
                                )}
                            >
                                Home
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item>
                        <NavigationMenu.Link asChild>
                            <Link
                                href="/blog"
                                className={cn(
                                    "text-sm font-medium transition-colors duration-500",
                                    isScrolled ? "text-gray-600 hover:text-gray-900" : "text-white hover:text-white/80"
                                )}
                            >
                                Blog
                            </Link>
                        </NavigationMenu.Link>
                    </NavigationMenu.Item>

                    <NavigationMenu.Item>
                        <Button
                            variant="surface"
                            color="lime"
                            size="2"
                            onClick={handleWaitlistClick}
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 500ms ease-in-out',
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
