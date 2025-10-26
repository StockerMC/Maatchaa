"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Heart, MessageCircle, Eye, Package, Check, X, Volume2, VolumeX } from "lucide-react"
import Image from "next/image"

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  variants: Array<{
    id: number
    title: string
    price: string
  }>
  images: Array<{
    id: number
    src: string
    alt: string | null
  }>
}

const mockShorts = [
  {
    id: "1",
    videoUrl: "https://www.youtube.com/shorts/vAZfen1wHkA",
    thumbnailUrl: "/youtube-shorts-cooking-video.jpg",
    title: "Morning Matcha Ritual - The Perfect Way to Start Your Day",
    channelName: "@MatchaLifestyle",
    channelAvatar: "/cooking-channel-avatar.jpg",
    views: 1200000,
    likes: 45000,
    comments: 2300,
    category: "Most Viral" as const,
    productHandles: ["ceremonial-matcha", "matcha-whisk", "matcha-bowl"],
  },
  {
    id: "2",
    videoUrl: "https://www.youtube.com/shorts/example2",
    thumbnailUrl: "/fitness-workout-video.png",
    title: "Pre-Workout Matcha Energy Boost",
    channelName: "@FitLife",
    channelAvatar: "/fitness-channel-avatar.jpg",
    views: 850000,
    likes: 32000,
    comments: 1800,
    category: "High Growth" as const,
    productHandles: ["organic-matcha-powder", "matcha-latte-mix"],
  },
  {
    id: "3",
    videoUrl: "https://www.youtube.com/shorts/example3",
    thumbnailUrl: "/tech-review-video.jpg",
    title: "Unboxing the Ultimate Matcha Starter Kit",
    channelName: "@UnboxingDaily",
    channelAvatar: "/tech-channel-avatar.png",
    views: 650000,
    likes: 28000,
    comments: 1200,
    category: "Niche Gem" as const,
    productHandles: ["matcha-starter-kit", "bamboo-scoop"],
  },
]

export default function ShortsDiscoveryPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [matchedProducts, setMatchedProducts] = useState<ShopifyProduct[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("https://matchamatcha.ca/products.json")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || [])
      })
      .catch((err) => console.error("[v0] Error fetching products:", err))
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      const currentShort = mockShorts[currentIndex]
      const matched = products.filter((p) => currentShort.productHandles.includes(p.handle))
      setMatchedProducts(matched.length > 0 ? matched : products.slice(0, 3))
    }
  }, [currentIndex, products])

  const handleScroll = () => {
    if (!containerRef.current) return

    const container = containerRef.current
    const scrollTop = container.scrollTop
    const itemHeight = container.clientHeight
    const newIndex = Math.round(scrollTop / itemHeight)

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < mockShorts.length) {
      setCurrentIndex(newIndex)
      setIsPlaying(false) // Pause when switching videos
    }
  }

  const handleApprove = (shortId: string) => {
    console.log("[v0] Approved short:", shortId)
    // Auto-scroll to next short
    if (currentIndex < mockShorts.length - 1) {
      scrollToShort(currentIndex + 1)
    }
  }

  const handleDeny = (shortId: string) => {
    console.log("[v0] Denied short:", shortId)
    // Auto-scroll to next short
    if (currentIndex < mockShorts.length - 1) {
      scrollToShort(currentIndex + 1)
    }
  }

  const scrollToShort = (index: number) => {
    if (!containerRef.current) return
    const container = containerRef.current
    const itemHeight = container.clientHeight
    container.scrollTo({
      top: index * itemHeight,
      behavior: "smooth",
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="h-screen flex">
      {/* Main Shorts Feed */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          onScroll={handleScroll}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {mockShorts.map((short, index) => (
            <div key={short.id} className="h-screen snap-start relative bg-black flex items-center justify-center">
              {/* Video Thumbnail/Player */}
              <div className="relative w-full max-w-sm h-full bg-gray-900 rounded-lg overflow-hidden border-2 border-white/10">
                <Image src={short.thumbnailUrl || "/placeholder.svg"} alt={short.title} fill className="object-cover" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 border-2 border-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </Button>
                </div>

                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <Image
                      src={short.channelAvatar || "/placeholder.svg"}
                      alt={short.channelName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="text-white font-medium">{short.channelName}</span>
                    <Badge
                      variant="secondary"
                      className="bg-[var(--lime-3)] text-[var(--lime-11)] border-[var(--lime-7)]"
                    >
                      {short.category}
                    </Badge>
                  </div>
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">{short.title}</h3>
                  <div className="flex items-center gap-4 text-white/70 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatNumber(short.views)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {formatNumber(short.likes)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {formatNumber(short.comments)}
                    </div>
                  </div>
                </div>

                {/* Volume Control */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </Button>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black border-2 border-matcha-glow-2"
                  onClick={() => handleApprove(short.id)}
                >
                  <Check className="w-8 h-8" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white border-2 border-red-700"
                  onClick={() => handleDeny(short.id)}
                >
                  <X className="w-8 h-8" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="absolute top-4 left-4 flex flex-col gap-1">
          {mockShorts.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-colors ${
                index === currentIndex ? "bg-[var(--lime-9)]" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Product Sidebar */}
      <div className="w-80 bg-background border-l-2 border-stone-800 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-heading font-semibold mb-2">Matched Products</h2>
            <p className="text-sm text-muted-foreground">AI-detected products for this short</p>
          </div>

          {matchedProducts.map((product) => (
            <Card key={product.id} className="p-3 border border-stone-700">
              <div className="flex gap-3">
                <Image
                  src={product.images[0]?.src || "/placeholder.svg"}
                  alt={product.title}
                  width={60}
                  height={60}
                  className="rounded-md object-cover border border-stone-700"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h4>
                  <p className="text-lg font-bold text-matcha-glow-1">${product.variants[0]?.price}</p>
                  <Button
                    size="sm"
                    className="mt-2 w-full bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black border border-matcha-glow-2"
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Add to Campaign
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="pt-4 border-t border-stone-700">
            <h3 className="font-medium mb-2">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match Score</span>
                <span className="font-medium text-[var(--lime-11)]">
                  {currentIndex === 0 ? "94%" : currentIndex === 1 ? "87%" : "91%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Reach</span>
                <span className="font-medium">{formatNumber(mockShorts[currentIndex]?.views || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engagement</span>
                <span className="font-medium">
                  {(((mockShorts[currentIndex]?.likes || 0) / (mockShorts[currentIndex]?.views || 1)) * 100).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
