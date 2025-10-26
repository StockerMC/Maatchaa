"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { TrendingUp, TrendingDown, Eye, Heart, Users, Package, Download } from "lucide-react"

// Mock data for analytics
const reachData = [
  { month: "Jan", views: 1200000, likes: 45000, comments: 12000 },
  { month: "Feb", views: 1800000, likes: 67000, comments: 18000 },
  { month: "Mar", views: 2100000, likes: 78000, comments: 21000 },
  { month: "Apr", views: 2400000, likes: 89000, comments: 24000 },
  { month: "May", views: 2800000, likes: 105000, comments: 28000 },
  { month: "Jun", views: 3200000, likes: 120000, comments: 32000 },
]

const categoryData = [
  { name: "Most Viral", value: 45, color: "#ef4444" },
  { name: "High Growth", value: 30, color: "#22c55e" },
  { name: "Niche Gem", value: 20, color: "#3b82f6" },
  { name: "High Risk/Reward", value: 5, color: "#f97316" },
]

const productPerformanceData = [
  { product: "Kitchen Scale", matches: 24, conversions: 8, revenue: 399.92 },
  { product: "Yoga Mat", matches: 18, conversions: 6, revenue: 239.94 },
  { product: "Phone Case", matches: 15, conversions: 12, revenue: 359.88 },
  { product: "Spatula Set", matches: 12, conversions: 4, revenue: 99.96 },
  { product: "Resistance Bands", matches: 10, conversions: 3, revenue: 59.97 },
]

const creatorEngagementData = [
  { week: "Week 1", emails: 12, responses: 8, partnerships: 3 },
  { week: "Week 2", emails: 18, responses: 14, partnerships: 6 },
  { week: "Week 3", emails: 24, responses: 18, partnerships: 8 },
  { week: "Week 4", emails: 30, responses: 22, partnerships: 12 },
]

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
  likes: {
    label: "Likes",
    color: "hsl(var(--secondary))",
  },
  comments: {
    label: "Comments",
    color: "hsl(var(--accent))",
  },
  emails: {
    label: "Emails Sent",
    color: "hsl(var(--primary))",
  },
  responses: {
    label: "Responses",
    color: "hsl(var(--secondary))",
  },
  partnerships: {
    label: "Partnerships",
    color: "hsl(var(--accent))",
  },
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedMetric, setSelectedMetric] = useState("all")

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold tracking-tight text-stone-dark">Analytics</h1>
          <p className="text-lg text-muted-foreground mt-2">Track your MATCHAA performance and creator partnerships</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-[var(--lime-3)] hover:text-[var(--lime-11)] hover:border-[var(--lime-9)] transition-colors bg-transparent"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-200">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">12.5M</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+23.5%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center border border-pink-200">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">4.2%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+0.8%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Partnerships</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">29</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">+11</span>
              <span className="text-muted-foreground">new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-stone-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--lime-11)]">2.8%</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-red-600 font-medium">-0.3%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reach" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="reach" className="data-[state=active]:bg-[var(--lime-9)] data-[state=active]:text-black">
            Reach & Engagement
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-[var(--lime-9)] data-[state=active]:text-black"
          >
            Reel Categories
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-[var(--lime-9)] data-[state=active]:text-black"
          >
            Product Performance
          </TabsTrigger>
          <TabsTrigger
            value="creators"
            className="data-[state=active]:bg-[var(--lime-9)] data-[state=active]:text-black"
          >
            Creator Outreach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reach" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Reach Over Time</CardTitle>
                <CardDescription>Views, likes, and comments from matched reels</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={reachData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stackId="1"
                      stroke="var(--color-views)"
                      fill="var(--color-views)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="likes"
                      stackId="1"
                      stroke="var(--color-likes)"
                      fill="var(--color-likes)"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Engagement Breakdown</CardTitle>
                <CardDescription>Monthly engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={reachData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      stroke="var(--color-likes)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-likes)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      stroke="var(--color-comments)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-comments)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Reel Category Distribution</CardTitle>
                <CardDescription>Breakdown of reel types you've reviewed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                    <span className="text-sm font-medium">{data.name}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">{data.value}% of total reels</div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Category Performance</CardTitle>
                <CardDescription>Success rates by reel category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{category.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${category.value}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card className="border border-stone-700">
            <CardHeader>
              <CardTitle className="font-heading">Product Performance</CardTitle>
              <CardDescription>How your products are performing in reel matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformanceData.map((product, index) => (
                  <div
                    key={product.product}
                    className="flex items-center justify-between p-4 border border-stone-700 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{product.product}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.matches} matches • {product.conversions} conversions
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold">${product.revenue}</div>
                      <div className="text-sm text-muted-foreground">
                        {((product.conversions / product.matches) * 100).toFixed(1)}% conversion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Creator Outreach</CardTitle>
                <CardDescription>Email campaigns and response rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={creatorEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="emails" fill="var(--color-emails)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="responses" fill="var(--color-responses)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="partnerships" fill="var(--color-partnerships)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border border-stone-700">
              <CardHeader>
                <CardTitle className="font-heading">Outreach Metrics</CardTitle>
                <CardDescription>Current month performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Emails Sent</span>
                    <span className="font-bold">84</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "84%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Rate</span>
                    <span className="font-bold">73.8%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-secondary h-2 rounded-full" style={{ width: "73.8%" }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Partnership Rate</span>
                    <span className="font-bold">34.5%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: "34.5%" }} />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Partnerships</span>
                    <Badge className="bg-green-100 text-green-800">29</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
