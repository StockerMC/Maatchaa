"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ExternalLink,
  Mail,
  FileText,
  LinkIcon,
} from "lucide-react"
import Image from "next/image"

interface Partnership {
  id: string
  creatorName: string
  creatorHandle: string
  creatorAvatar: string
  videoTitle: string
  videoThumbnail: string
  videoUrl: string
  status: "pending" | "confirmed" | "rejected"
  matchedProducts: string[]
  views: number
  likes: number
  comments: number
  initiatedDate: string
  responseDate?: string
}

const mockPartnerships: Partnership[] = [
  {
    id: "1",
    creatorName: "Sarah Johnson",
    creatorHandle: "@cookingwithsarah",
    creatorAvatar: "/cooking-channel-avatar.jpg",
    videoTitle: "5 Kitchen Gadgets That Changed My Life",
    videoThumbnail: "/youtube-shorts-cooking-video.jpg",
    videoUrl: "https://youtube.com/shorts/example1",
    status: "confirmed",
    matchedProducts: ["Smart Kitchen Scale", "Silicone Spatula Set"],
    views: 1200000,
    likes: 45000,
    comments: 2300,
    initiatedDate: "2 days ago",
    responseDate: "1 day ago",
  },
  {
    id: "2",
    creatorName: "Mike Chen",
    creatorHandle: "@fitlifemike",
    creatorAvatar: "/fitness-channel-avatar.jpg",
    videoTitle: "Morning Workout Routine",
    videoThumbnail: "/fitness-workout-video.png",
    videoUrl: "https://youtube.com/shorts/example2",
    status: "pending",
    matchedProducts: ["Yoga Mat", "Resistance Bands"],
    views: 850000,
    likes: 32000,
    comments: 1800,
    initiatedDate: "5 hours ago",
  },
  {
    id: "3",
    creatorName: "Alex Rivera",
    creatorHandle: "@techreviewalex",
    creatorAvatar: "/tech-channel-avatar.png",
    videoTitle: "This Phone Case is INSANE!",
    videoThumbnail: "/tech-review-video.jpg",
    videoUrl: "https://youtube.com/shorts/example3",
    status: "rejected",
    matchedProducts: ["Phone Case"],
    views: 650000,
    likes: 28000,
    comments: 1200,
    initiatedDate: "3 days ago",
    responseDate: "2 days ago",
  },
]

export default function PartnershipsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showContractDialog, setShowContractDialog] = useState(false)
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null)
  const [generatedEmail, setGeneratedEmail] = useState("")
  const [generatedContract, setGeneratedContract] = useState("")
  const [affiliateLink, setAffiliateLink] = useState("")

  const filteredPartnerships = mockPartnerships.filter((partnership) => {
    const matchesSearch =
      partnership.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnership.creatorHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnership.videoTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = selectedTab === "all" || partnership.status === selectedTab

    return matchesSearch && matchesTab
  })

  const stats = {
    total: mockPartnerships.length,
    pending: mockPartnerships.filter((p) => p.status === "pending").length,
    confirmed: mockPartnerships.filter((p) => p.status === "confirmed").length,
    rejected: mockPartnerships.filter((p) => p.status === "rejected").length,
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getStatusBadge = (status: Partnership["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        )
    }
  }

  const handleAcceptPartnership = async (partnership: Partnership) => {
    setSelectedPartnership(partnership)

    const email = `Hi ${partnership.creatorName},

Thank you for your interest in partnering with us! We're excited to collaborate with you on featuring our products in your content.

We've reviewed your video "${partnership.videoTitle}" and believe it's a perfect match for our ${partnership.matchedProducts.join(", ")}.

Here are the next steps:
1. Review and sign the partnership agreement (attached)
2. Use your unique affiliate link to track conversions
3. Feature the products naturally in your content

Your Affiliate Link: https://matchamatcha.ca/ref/${partnership.creatorHandle.replace("@", "")}

We're looking forward to a successful partnership!

Best regards,
The MATCHAA Team`

    setGeneratedEmail(email)
    setAffiliateLink(`https://matchamatcha.ca/ref/${partnership.creatorHandle.replace("@", "")}`)
    setShowEmailDialog(true)
  }

  const handleGenerateContract = () => {
    if (!selectedPartnership) return

    const contract = `PARTNERSHIP AGREEMENT

This Partnership Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()} between:

MATCHAA ("Business")
and
${selectedPartnership.creatorName} ("Creator")

1. SCOPE OF WORK
Creator agrees to feature the following products in their content:
${selectedPartnership.matchedProducts.map((p) => `- ${p}`).join("\n")}

2. COMPENSATION
- Commission: 15% of sales generated through affiliate link
- Affiliate Link: ${affiliateLink}
- Payment Terms: Net 30 days

3. CONTENT REQUIREMENTS
- Natural product integration
- Disclosure of sponsored content per FTC guidelines
- Minimum 1 mention per video

4. TERM
This agreement is effective for 90 days from the date of signing.

5. TERMINATION
Either party may terminate with 14 days written notice.

By signing below, both parties agree to the terms outlined above.

_______________________          _______________________
Business Signature                Creator Signature

Date: ${new Date().toLocaleDateString()}`

    setGeneratedContract(contract)
    setShowEmailDialog(false)
    setShowContractDialog(true)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-heading font-bold tracking-tight text-stone-dark">Active Partnerships</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage your creator collaborations and track partnership status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Partnerships</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Response</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting creator response</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">Active collaborations</p>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Not interested</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border border-stone-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-2xl">Partnership List</CardTitle>
              <CardDescription>View and manage all your creator partnerships</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partnerships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="rejected">Declined ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4">
              {filteredPartnerships.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No partnerships found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search" : "Start discovering shorts to create partnerships"}
                  </p>
                </div>
              ) : (
                filteredPartnerships.map((partnership) => (
                  <Card key={partnership.id} className="border border-stone-700">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Video Thumbnail */}
                        <div className="relative w-full lg:w-48 h-64 lg:h-auto rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={partnership.videoThumbnail || "/placeholder.svg"}
                            alt={partnership.videoTitle}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button size="sm" className="bg-white/90 hover:bg-white text-black" asChild>
                              <a href={partnership.videoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Short
                              </a>
                            </Button>
                          </div>
                        </div>

                        {/* Partnership Details */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={partnership.creatorAvatar || "/placeholder.svg"} />
                                <AvatarFallback>{partnership.creatorName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">{partnership.creatorName}</h3>
                                <p className="text-sm text-muted-foreground">{partnership.creatorHandle}</p>
                              </div>
                            </div>
                            {getStatusBadge(partnership.status)}
                          </div>

                          <div>
                            <h4 className="font-medium mb-1">{partnership.videoTitle}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {formatNumber(partnership.views)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {formatNumber(partnership.likes)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {formatNumber(partnership.comments)}
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Matched Products:</p>
                            <div className="flex flex-wrap gap-2">
                              {partnership.matchedProducts.map((product, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-[var(--lime-3)] text-[var(--lime-11)] border-[var(--lime-7)]"
                                >
                                  {product}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-stone-700">
                            <div className="text-sm text-muted-foreground">
                              <p>Initiated: {partnership.initiatedDate}</p>
                              {partnership.responseDate && <p>Response: {partnership.responseDate}</p>}
                            </div>
                            <div className="flex gap-2">
                              {partnership.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black"
                                    onClick={() => handleAcceptPartnership(partnership)}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Accept & Draft Email
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-stone-700 bg-transparent">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Reminder
                                  </Button>
                                </>
                              )}
                              {partnership.status === "confirmed" && (
                                <Button size="sm" variant="outline" className="border-stone-700 bg-transparent">
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI-Generated Partnership Email</DialogTitle>
            <DialogDescription>Review and edit the email before sending to the creator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={generatedEmail} onChange={(e) => setGeneratedEmail(e.target.value)} rows={12} />
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-stone-700">
              <LinkIcon className="w-4 h-4" />
              <div className="flex-1">
                <p className="text-sm font-medium">Affiliate Link Generated</p>
                <p className="text-xs text-muted-foreground">{affiliateLink}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateContract} className="bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black">
                <FileText className="w-4 h-4 mr-2" />
                Generate Contract
              </Button>
              <Button variant="outline" className="border-stone-700 bg-transparent">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Partnership Agreement</DialogTitle>
            <DialogDescription>Review the auto-generated contract</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={generatedContract} onChange={(e) => setGeneratedContract(e.target.value)} rows={16} />
            <div className="flex gap-2">
              <Button className="bg-matcha-glow-1 hover:bg-matcha-glow-2 text-black">
                <FileText className="w-4 h-4 mr-2" />
                Send for Signature
              </Button>
              <Button variant="outline" className="border-stone-700 bg-transparent">
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
