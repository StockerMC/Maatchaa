"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  body_html: string
  vendor: string
  product_type: string
  tags: string[]
  variants: Array<{
    id: number
    title: string
    price: string
    inventory_quantity: number
  }>
  images: Array<{
    id: number
    src: string
    alt: string | null
  }>
}

export default function DashboardPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [userName, setUserName] = useState("Business Owner")

  useEffect(() => {
    fetch("https://matchamatcha.ca/products.json")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || [])
      })
      .catch((err) => console.error("[v0] Error fetching products:", err))
  }, [])

  const stats = {
    pendingMatches: 12,
    activePartnerships: 3,
    totalReach: 45000,
    productsMatched: products.length,
  }

  const recentActivity = [
    { type: "match", message: `New match found for "${products[0]?.title || "Matcha Powder"}"`, time: "2 min ago" },
    { type: "partnership", message: "Creator @fitlife accepted partnership", time: "1 hour ago" },
    {
      type: "match",
      message: `"${products[1]?.title || "Ceremonial Matcha"}" matched with 3 creators`,
      time: "3 hours ago",
    },
    {
      type: "product",
      message: `Product '${products[2]?.title || "Matcha Set"}' matched 5 times`,
      time: "5 hours ago",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-heading font-bold tracking-tight text-stone-dark">Welcome back, {userName}</h1>
        <p className="text-lg text-muted-foreground mt-2">Here's what's happening with your sponsorships.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-stone-700 hover:border-stone-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.pendingMatches}</div>
            <p className="text-xs text-muted-foreground mt-1">New shorts to review</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700 hover:border-stone-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Partnerships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.activePartnerships}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed collaborations</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700 hover:border-stone-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">
              {stats.totalReach >= 1000 ? `${(stats.totalReach / 1000).toFixed(0)}K` : stats.totalReach}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Views from partnerships</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700 hover:border-stone-600 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.productsMatched}</div>
            <p className="text-xs text-muted-foreground mt-1">In active campaigns</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-stone-700">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Quick Actions</CardTitle>
            <CardDescription>Jump into your workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Link href="/shorts">
                <Button className="h-32 w-full bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black flex flex-col gap-3 border border-matcha-glow-2 hover:scale-[1.02] transition-all relative">
                  <div className="text-center">
                    <div className="font-semibold text-lg">Discover Shorts</div>
                    <div className="text-sm opacity-90 mt-1">Swipe through AI-matched content</div>
                  </div>
                  {stats.pendingMatches > 0 && (
                    <Badge className="absolute top-3 right-3 bg-black text-white border border-white">
                      {stats.pendingMatches}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link href="/partnerships">
                <Button
                  variant="outline"
                  className="h-32 w-full flex flex-col gap-3 bg-white hover:bg-gray-50 border border-stone-700 hover:border-stone-600 transition-all"
                >
                  <div className="text-center">
                    <div className="font-semibold text-lg">Active Partnerships</div>
                    <div className="text-sm text-muted-foreground mt-1">Manage collaborations</div>
                  </div>
                </Button>
              </Link>

              <Link href="/products">
                <Button
                  variant="outline"
                  className="h-32 w-full flex flex-col gap-3 bg-white hover:bg-gray-50 border border-stone-700 hover:border-stone-600 transition-all"
                >
                  <div className="text-center">
                    <div className="font-semibold text-lg">Manage Products</div>
                    <div className="text-sm text-muted-foreground mt-1">Update your catalog</div>
                  </div>
                </Button>
              </Link>

              <Link href="/analytics">
                <Button
                  variant="outline"
                  className="h-32 w-full flex flex-col gap-3 bg-white hover:bg-gray-50 border border-stone-700 hover:border-stone-600 transition-all"
                >
                  <div className="text-center">
                    <div className="font-semibold text-lg">View Analytics</div>
                    <div className="text-sm text-muted-foreground mt-1">Track performance</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-stone-700">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Recent Activity</CardTitle>
              <CardDescription>Latest updates from your campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === "partnership" ? "bg-matcha-glow-1" : "bg-gray-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-dark leading-tight">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
