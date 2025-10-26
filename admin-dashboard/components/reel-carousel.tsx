"use client"

import { useState, useEffect } from "react"
import { ReelCard } from "./reel-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface Reel {
  id: string
  thumbnailUrl: string
  title: string
  channelName: string
  channelAvatar: string
  views: number
  likes: number
  comments: number
  matchedProducts: Array<{
    id: string
    name: string
    imageUrl: string
    price: number
  }>
  category: "Most Viral" | "High Growth" | "Niche Gem" | "High Risk/High Reward"
}

interface ReelCarouselProps {
  reels: Reel[]
  autoEmailEnabled: boolean
  onApprove: (reelId: string) => void
  onDeny: (reelId: string) => void
}

export function ReelCarousel({ reels, autoEmailEnabled, onApprove, onDeny }: ReelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [processedReels, setProcessedReels] = useState<Set<string>>(new Set())

  const currentReel = reels[currentIndex]

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleApprove = (reelId: string) => {
    setProcessedReels((prev) => new Set(prev).add(reelId))
    onApprove(reelId)
    handleNext()
  }

  const handleDeny = (reelId: string) => {
    setProcessedReels((prev) => new Set(prev).add(reelId))
    onDeny(reelId)
    handleNext()
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setProcessedReels(new Set())
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious()
      if (e.key === "ArrowRight") handleNext()
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentIndex])

  if (!currentReel) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">No more reels to review</p>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Reel {currentIndex + 1} of {reels.length}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Processed: {processedReels.size}</div>
          <Button onClick={handleReset} variant="ghost" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}
        />
      </div>

      {/* Reel Card */}
      <div className="flex justify-center">
        <ReelCard
          reel={currentReel}
          autoEmailEnabled={autoEmailEnabled}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center gap-4">
        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={currentIndex >= reels.length - 1} variant="outline" size="sm">
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-xs text-muted-foreground">Use ← → arrow keys to navigate</div>
    </div>
  )
}
