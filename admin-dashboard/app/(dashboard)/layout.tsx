import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { SidebarProvider } from "@/components/sidebar-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-stone-light">
        <Sidebar />
        <div className="lg:pl-72">
          <Header />
          <main className="p-6 md:p-8 lg:p-10">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
