"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react"

interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
  followers: string
  engagement: string
  status: "pending" | "responded" | "partnered" | "declined"
  lastContact: string
  reelTitle: string
  productMatched: string
}

const mockCreators: Creator[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    handle: "@CookingHacks",
    avatar: "/cooking-channel-avatar.jpg",
    followers: "125K",
    engagement: "4.2%",
    status: "responded",
    lastContact: "2 hours ago",
    reelTitle: "Amazing Kitchen Gadgets You Need!",
    productMatched: "Smart Kitchen Scale",
  },
  {
    id: "2",
    name: "Mike Fitness",
    handle: "@FitLife",
    avatar: "/fitness-channel-avatar.jpg",
    followers: "89K",
    engagement: "5.1%",
    status: "partnered",
    lastContact: "1 day ago",
    reelTitle: "5 Minute Morning Workout",
    productMatched: "Yoga Mat",
  },
  {
    id: "3",
    name: "Tech Reviewer",
    handle: "@TechReviews",
    avatar: "/tech-channel-avatar.png",
    followers: "234K",
    engagement: "3.8%",
    status: "pending",
    lastContact: "3 days ago",
    reelTitle: "This Phone Case is INSANE!",
    productMatched: "Phone Case",
  },
  {
    id: "4",
    name: "Home Decor Pro",
    handle: "@HomeStyle",
    avatar: "/placeholder.svg",
    followers: "67K",
    engagement: "6.2%",
    status: "declined",
    lastContact: "1 week ago",
    reelTitle: "Transform Your Living Room",
    productMatched: "Decorative Pillows",
  },
]

export default function CommunicationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [isComposeOpen, setIsComposeOpen] = useState(false)

  const filteredCreators = mockCreators.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.handle.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || creator.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "responded":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "partnered":
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-[var(--lime-11)]" />
      case "declined":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "responded":
        return "bg-green-100 text-green-800"
      case "partnered":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-[var(--lime-3)] text-[var(--lime-11)]"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Creator Communications</h1>
          <p className="text-muted-foreground">Manage your outreach and partnerships with content creators</p>
        </div>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Compose Message</DialogTitle>
              <DialogDescription>Send a direct message to a creator</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="creatorHandle">Creator Handle</Label>
                <Input id="creatorHandle" placeholder="@CreatorHandle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Partnership Opportunity" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Hi there! I'd love to discuss..." className="min-h-[120px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsComposeOpen(false)}>
                <Send className="w-4 h-4 mr-1" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outreach</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73.8%</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partnerships</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29</div>
            <p className="text-xs text-muted-foreground">+7 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Awaiting reply</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="responded">Responded</TabsTrigger>
            <TabsTrigger value="partnered">Partnered</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                className="h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Creator Communications</CardTitle>
              <CardDescription>All your creator outreach and partnership communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCreators.map((creator) => (
                  <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.name} />
                        <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-muted-foreground">{creator.handle}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{creator.followers} followers</span>
                          <span>{creator.engagement} engagement</span>
                          <span>Last contact: {creator.lastContact}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Reel:</span> {creator.reelTitle}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Product:</span> {creator.productMatched}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(creator.status)}>
                        {getStatusIcon(creator.status)}
                        <span className="ml-1 capitalize">{creator.status}</span>
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-[var(--lime-11)] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pending Responses</h3>
                <p className="text-muted-foreground">Creators who haven't responded to your outreach yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responded">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Creator Responses</h3>
                <p className="text-muted-foreground">Creators who have responded to your partnership invitations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partnered">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Active Partnerships</h3>
                <p className="text-muted-foreground">Creators you're currently partnered with</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="declined">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Declined Partnerships</h3>
                <p className="text-muted-foreground">Creators who declined your partnership offers</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
