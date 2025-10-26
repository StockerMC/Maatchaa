"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Eye, ThumbsUp, ThumbsDown, Mail } from "lucide-react"

interface ReelCardProps {
  reel: {
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
  autoEmailEnabled: boolean
  onApprove: (reelId: string) => void
  onDeny: (reelId: string) => void
}

export function ReelCard({ reel, autoEmailEnabled, onApprove, onDeny }: ReelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Most Viral":
        return "bg-red-100 text-red-800"
      case "High Growth":
        return "bg-green-100 text-green-800"
      case "Niche Gem":
        return "bg-blue-100 text-blue-800"
      case "High Risk/High Reward":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto reel-card-shadow reel-card-hover bg-card">
      <CardContent className="p-0">
        {/* Video Thumbnail */}
        <div className="relative aspect-[9/16] bg-gray-100 rounded-t-lg overflow-hidden">
          <img src={reel.thumbnailUrl || "/placeholder.svg"} alt={reel.title} className="w-full h-full object-cover" />
          <Badge className={`absolute top-2 left-2 ${getCategoryColor(reel.category)}`}>{reel.category}</Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Channel Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={reel.channelAvatar || "/placeholder.svg"} alt={reel.channelName} />
              <AvatarFallback>{reel.channelName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-sm text-foreground truncate">{reel.title}</h3>
              <p className="text-xs text-muted-foreground">{reel.channelName}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatNumber(reel.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{formatNumber(reel.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{formatNumber(reel.comments)}</span>
            </div>
          </div>

          {/* Matched Products Preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Matched Products ({reel.matchedProducts.length})</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {reel.matchedProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex-shrink-0">
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                </div>
              ))}
              {reel.matchedProducts.length > 3 && (
                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">+{reel.matchedProducts.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!autoEmailEnabled && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onApprove(reel.id)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Approve
              </Button>
              <Button onClick={() => onDeny(reel.id)} variant="outline" className="flex-1" size="sm">
                <ThumbsDown className="w-4 h-4 mr-1" />
                Pass
              </Button>
            </div>
          )}

          {autoEmailEnabled && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <Mail className="w-3 h-3" />
              <span>Auto-email enabled - creators will be contacted automatically</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
