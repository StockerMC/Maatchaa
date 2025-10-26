"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "./sidebar-provider"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, BarChart3, Settings, HelpCircle, LogOut, Search, Users } from "lucide-react"
import SquigglyUnderlineText from "./squiggly-underline-text"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()

  return (
    <>
      <div
        className={cn("fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden", isOpen ? "block" : "hidden")}
        onClick={toggle}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-stone-dark",
          "transition-transform duration-300 ease-in-out",
          "border-r border-white/10",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/dashboard" className="flex items-center group">
            <span className="text-xl font-heading font-bold text-white">
              <SquigglyUnderlineText colors={["#90f3c0", "#B4D88B"]}>Maatchaa</SquigglyUnderlineText>
            </span>
          </Link>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-3">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Main</p>
              </div>
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-[var(--lime-9)] text-black shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--lime-9)] px-1.5 text-[0.625rem] font-bold text-black">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t border-white/10 p-3">
            <nav className="grid gap-1">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Account</p>
              </div>
              {footerItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-[var(--lime-9)] text-black shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Discover Shorts", href: "/shorts", icon: Search, badge: 0 },
  { name: "Active Partnerships", href: "/partnerships", icon: Users, badge: 0 },
  { name: "Products", href: "/products", icon: Package },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const footerItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help & Support", href: "/help", icon: HelpCircle },
  { name: "Logout", href: "/logout", icon: LogOut },
]
