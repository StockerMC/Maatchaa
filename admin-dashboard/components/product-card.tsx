"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Eye, Edit, Trash2 } from "lucide-react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    category: string
    imageUrl: string
    shopifyUrl: string
    status: "Active" | "Inactive" | "Out of Stock"
    matchCount: number
    lastMatched: string
  }
  onEdit?: (productId: string) => void
  onDelete?: (productId: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-gray-100 text-gray-800"
      case "Out of Stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square relative overflow-hidden">
        <img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}>{product.status}</Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm leading-tight truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">${product.price}</div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{product.matchCount} matches</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">Last matched: {product.lastMatched}</div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="flex-1" asChild>
            <a href={product.shopifyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              Shopify
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(product.id)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete?.(product.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
