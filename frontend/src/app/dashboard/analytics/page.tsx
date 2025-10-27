"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Tabs, Badge, Button, Select } from "@radix-ui/themes";
import { TrendingUp, TrendingDown, Eye, Heart, Users, Package, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Mock data for analytics
const reachData = [
  { month: "Jan", views: 1200000, likes: 45000, comments: 12000 },
  { month: "Feb", views: 1800000, likes: 67000, comments: 18000 },
  { month: "Mar", views: 2100000, likes: 78000, comments: 21000 },
  { month: "Apr", views: 2400000, likes: 89000, comments: 24000 },
  { month: "May", views: 2800000, likes: 105000, comments: 28000 },
  { month: "Jun", views: 3200000, likes: 120000, comments: 32000 },
];

const categoryData = [
  { name: "Most Viral", value: 45, color: "#B4D88B" },
  { name: "High Growth", value: 30, color: "#7DD3C0" },
  { name: "Niche Gem", value: 20, color: "#9AE6F5" },
  { name: "High Risk/Reward", value: 5, color: "#A8E6CF" },
];

const productPerformanceData = [
  { product: "Kitchen Scale", matches: 24, conversions: 8, revenue: 399.92 },
  { product: "Yoga Mat", matches: 18, conversions: 6, revenue: 239.94 },
  { product: "Phone Case", matches: 15, conversions: 12, revenue: 359.88 },
  { product: "Spatula Set", matches: 12, conversions: 4, revenue: 99.96 },
  { product: "Resistance Bands", matches: 10, conversions: 3, revenue: 59.97 },
];

const creatorEngagementData = [
  { week: "Week 1", emails: 12, responses: 8, partnerships: 3 },
  { week: "Week 2", emails: 18, responses: 14, partnerships: 6 },
  { week: "Week 3", emails: 24, responses: 18, partnerships: 8 },
  { week: "Week 4", emails: 30, responses: 22, partnerships: 12 },
];

// Chart configurations for shadcn/recharts
const reachChartConfig = {
  views: {
    label: "Views",
    color: "#B4D88B",
  },
  likes: {
    label: "Likes",
    color: "#7DD3C0",
  },
  comments: {
    label: "Comments",
    color: "#9AE6F5",
  },
};

const engagementChartConfig = {
  likes: {
    label: "Likes",
    color: "#B4D88B",
  },
  comments: {
    label: "Comments",
    color: "#7DD3C0",
  },
};

const outreachChartConfig = {
  emails: {
    label: "Emails Sent",
    color: "#B4D88B",
  },
  responses: {
    label: "Responses",
    color: "#7DD3C0",
  },
  partnerships: {
    label: "Partnerships",
    color: "#9AE6F5",
  },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6months");

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
              Analytics
            </Text>
            <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
              Track your performance and creator partnerships
            </Text>
          </Box>
          <Flex align="center" gap="2">
            <Select.Root value={timeRange} onValueChange={setTimeRange}>
              <Select.Trigger style={{ width: "160px" }} />
              <Select.Content>
                <Select.Item value="7days">Last 7 days</Select.Item>
                <Select.Item value="30days">Last 30 days</Select.Item>
                <Select.Item value="3months">Last 3 months</Select.Item>
                <Select.Item value="6months">Last 6 months</Select.Item>
                <Select.Item value="1year">Last year</Select.Item>
              </Select.Content>
            </Select.Root>
            <Button variant="outline" size="2">
              <Download size={16} />
              Export
            </Button>
          </Flex>
        </Flex>

        {/* Stats Cards */}
        <Flex gap="4" wrap="wrap">
          {[
            {
              title: "Total Reach",
              value: "12.5M",
              change: "+23.5%",
              trend: "up",
              icon: Eye,
              color: "#8B5CF6",
            },
            {
              title: "Engagement Rate",
              value: "4.2%",
              change: "+0.8%",
              trend: "up",
              icon: Heart,
              color: "#EC4899",
            },
            {
              title: "Active Partnerships",
              value: "29",
              change: "+11 new",
              trend: "up",
              icon: Users,
              color: "#3B82F6",
            },
            {
              title: "Conversion Rate",
              value: "2.8%",
              change: "-0.3%",
              trend: "down",
              icon: Package,
              color: "#F97316",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <Card
                key={stat.title}
                style={{
                  flex: "1 1 calc(25% - 1rem)",
                  minWidth: "240px",
                  padding: "1.5rem",
                }}
              >
                <Flex direction="column" gap="3">
                  <Text size="2" style={{ color: "#737373", fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <Text size="7" weight="bold" style={{ color: "#000" }}>
                    {stat.value}
                  </Text>
                  <Flex align="center" gap="1">
                    <TrendIcon size={12} color={stat.trend === "up" ? "#10B981" : "#EF4444"} />
                    <Text
                      size="1"
                      style={{ color: stat.trend === "up" ? "#10B981" : "#EF4444" }}
                    >
                      {stat.change}
                    </Text>
                    <Text size="1" style={{ color: "#737373" }}>
                      from last month
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* Tabs for different analytics views */}
        <Tabs.Root defaultValue="reach">
          <Tabs.List>
            <Tabs.Trigger value="reach">Reach & Engagement</Tabs.Trigger>
            <Tabs.Trigger value="categories">Reel Categories</Tabs.Trigger>
            <Tabs.Trigger value="products">Product Performance</Tabs.Trigger>
            <Tabs.Trigger value="creators">Creator Outreach</Tabs.Trigger>
            <Tabs.Trigger value="partnerships">Partnerships</Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            <Tabs.Content value="reach">
              <Flex gap="4" direction={{ initial: "column", md: "row" }}>
                {/* Reach Over Time - Line Chart */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                    Reach Over Time
                  </Text>
                  <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                    Views, likes, and comments from matched reels
                  </Text>

                  <ChartContainer config={reachChartConfig} style={{ height: "300px", width: "100%" }}>
                    <LineChart data={reachData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis
                        dataKey="month"
                        stroke="#737373"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#737373"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="var(--color-views)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-views)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="likes"
                        stroke="var(--color-likes)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-likes)", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="comments"
                        stroke="var(--color-comments)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-comments)", r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </Card>

                {/* Engagement Breakdown - Area Chart */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                    Engagement Breakdown
                  </Text>
                  <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                    Monthly engagement metrics
                  </Text>

                  <ChartContainer config={engagementChartConfig} style={{ height: "300px", width: "100%" }}>
                    <AreaChart data={reachData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis
                        dataKey="month"
                        stroke="#737373"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#737373"
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area
                        type="monotone"
                        dataKey="likes"
                        stroke="var(--color-likes)"
                        fill="var(--color-likes)"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="comments"
                        stroke="var(--color-comments)"
                        fill="var(--color-comments)"
                        fillOpacity={0.6}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </Card>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="categories">
              <Flex gap="4" direction={{ initial: "column", md: "row" }}>
                {/* Pie Chart for Category Distribution */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                    Reel Category Distribution
                  </Text>
                  <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                    Breakdown of reel types you&apos;ve reviewed
                  </Text>

                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Category Performance */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "12px",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                    Category Performance
                  </Text>
                  <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                    Success rates by reel category
                  </Text>

                  <Flex direction="column" gap="4" style={{ marginTop: "2rem" }}>
                    {categoryData.map((category) => (
                      <Box key={category.name}>
                        <Flex align="center" justify="between" mb="2">
                          <Flex align="center" gap="2">
                            <Box
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: category.color,
                              }}
                            />
                            <Text size="2" weight="medium">
                              {category.name}
                            </Text>
                          </Flex>
                          <Text size="2" style={{ color: "#737373" }}>
                            {category.value}%
                          </Text>
                        </Flex>
                        <Box
                          style={{
                            height: "8px",
                            background: "#F5F5F5",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            style={{
                              width: `${category.value}%`,
                              height: "100%",
                              background: category.color,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>

            <Tabs.Content value="products">
              <Card
                style={{
                  padding: "1.5rem",
                  border: "1px solid #E5E5E5",
                  borderRadius: "12px",
                }}
              >
                <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                  Product Performance
                </Text>
                <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                  How your products are performing in reel matches
                </Text>

                <Flex direction="column" gap="3">
                  {productPerformanceData.map((product) => (
                    <Flex
                      key={product.product}
                      align="center"
                      justify="between"
                      p="4"
                      style={{
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px",
                      }}
                    >
                      <Box>
                        <Text size="3" weight="medium" style={{ display: "block", marginBottom: "0.25rem" }}>
                          {product.product}
                        </Text>
                        <Text size="1" style={{ color: "#737373" }}>
                          {product.matches} matches • {product.conversions} conversions
                        </Text>
                      </Box>
                      <Box style={{ textAlign: "right" }}>
                        <Text size="4" weight="bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                          ${product.revenue}
                        </Text>
                        <Text size="1" style={{ color: "#10B981" }}>
                          {((product.conversions / product.matches) * 100).toFixed(1)}% conversion
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                </Flex>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="creators">
              <Flex gap="4" direction={{ initial: "column", md: "row" }}>
                {/* Bar Chart for Creator Outreach */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "12px",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "0.5rem", display: "block" }}>
                    Creator Outreach
                  </Text>
                  <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
                    Email campaigns and response rates
                  </Text>

                  <ChartContainer config={outreachChartConfig} style={{ height: "300px", width: "100%" }}>
                    <BarChart data={creatorEngagementData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis
                        dataKey="week"
                        stroke="#737373"
                        fontSize={12}
                        tickFormatter={(value) => value.replace("Week ", "W")}
                      />
                      <YAxis
                        stroke="#737373"
                        fontSize={12}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="emails"
                        fill="var(--color-emails)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="responses"
                        fill="var(--color-responses)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="partnerships"
                        fill="var(--color-partnerships)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </Card>

                {/* Metrics */}
                <Card
                  style={{
                    flex: 1,
                    padding: "1.5rem",
                    border: "1px solid #E5E5E5",
                    borderRadius: "12px",
                  }}
                >
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "1.5rem", display: "block" }}>
                    Outreach Metrics
                  </Text>

                  <Flex direction="column" gap="4">
                    {[
                      { label: "Emails Sent", value: 84, percentage: 84, color: "#B4D88B" },
                      { label: "Response Rate", value: "73.8%", percentage: 73.8, color: "#7DD3C0" },
                      { label: "Partnership Rate", value: "34.5%", percentage: 34.5, color: "#9AE6F5" },
                    ].map((metric) => (
                      <Box key={metric.label}>
                        <Flex align="center" justify="between" mb="2">
                          <Text size="2" style={{ color: "#737373" }}>
                            {metric.label}
                          </Text>
                          <Text size="3" weight="bold">
                            {metric.value}
                          </Text>
                        </Flex>
                        <Box
                          style={{
                            height: "8px",
                            background: "#F5F5F5",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            style={{
                              width: `${metric.percentage}%`,
                              height: "100%",
                              background: metric.color,
                              transition: "width 0.3s ease",
                            }}
                          />
                        </Box>
                      </Box>
                    ))}

                    <Box
                      pt="4"
                      style={{
                        borderTop: "1px solid #E5E5E5",
                      }}
                    >
                      <Flex align="center" justify="between">
                        <Text size="2" weight="medium">
                          Active Partnerships
                        </Text>
                        <Badge size="2" color="green">
                          29
                        </Badge>
                      </Flex>
                    </Box>
                  </Flex>
                </Card>
              </Flex>
            </Tabs.Content>

            {/* New Partnerships Tab */}
            <Tabs.Content value="partnerships">
              <Flex direction="column" gap="4">
                {/* Filter Section */}
                <Flex align="center" justify="between">
                  <Box>
                    <Text size="6" weight="bold" style={{ color: "#1A1A1A", display: "block" }}>
                      Active Partnerships
                    </Text>
                    <Text size="2" style={{ color: "#737373", marginTop: "0.25rem", display: "block" }}>
                      Track performance by creator
                    </Text>
                  </Box>
                  <Select.Root defaultValue="all">
                    <Select.Trigger placeholder="Filter by creator" style={{ minWidth: "200px" }} />
                    <Select.Content>
                      <Select.Item value="all">All Creators</Select.Item>
                      <Select.Item value="sarah">Sarah Johnson</Select.Item>
                      <Select.Item value="mike">Mike Fitness</Select.Item>
                      <Select.Item value="tech">Tech Reviewer</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>

                {/* Partnership Cards */}
                <Flex direction="column" gap="3">
                  {/* Sarah Johnson */}
                  <Card style={{ padding: "1rem" }}>
                    <Flex align="center" justify="between" mb="3">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#B4D88B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="3" weight="bold" style={{ color: "#000" }}>SJ</Text>
                        </Box>
                        <Box>
                          <Text size="3" weight="bold" style={{ display: "block", color: "#1A1A1A" }}>
                            Sarah Johnson
                          </Text>
                          <Text size="1" style={{ color: "#737373" }}>
                            @CookingHacks • 125K followers
                          </Text>
                        </Box>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Badge color="green" size="1">Active</Badge>
                        <Text size="1" style={{ color: "#737373" }}>
                          • 45 days
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex gap="4" wrap="wrap">
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Clicks
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>342</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Sales
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>28</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Revenue
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#10B981" }}>$1,247</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Content
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>3/5</Text>
                      </Box>
                    </Flex>

                    <Flex gap="2" mt="2">
                      <Badge variant="soft" size="1">Kitchen Scale</Badge>
                      <Badge variant="soft" size="1">Non-Stick Pan</Badge>
                    </Flex>
                  </Card>

                  {/* Mike Fitness */}
                  <Card style={{ padding: "1rem" }}>
                    <Flex align="center" justify="between" mb="3">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#7DD3C0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="3" weight="bold" style={{ color: "#000" }}>MF</Text>
                        </Box>
                        <Box>
                          <Text size="3" weight="bold" style={{ display: "block", color: "#1A1A1A" }}>
                            Mike Fitness
                          </Text>
                          <Text size="1" style={{ color: "#737373" }}>
                            @FitLife • 89K followers
                          </Text>
                        </Box>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Badge color="green" size="1">Active</Badge>
                        <Text size="1" style={{ color: "#737373" }}>
                          • 62 days
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex gap="4" wrap="wrap">
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Clicks
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>518</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Sales
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>42</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Revenue
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#10B981" }}>$1,876</Text>
                      </Box>
                      <Box>
                        <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.25rem" }}>
                          Content
                        </Text>
                        <Text size="5" weight="bold" style={{ color: "#10B981" }}>5/5</Text>
                      </Box>
                    </Flex>

                    <Flex gap="2" mt="2">
                      <Badge variant="soft" size="1">Yoga Mat</Badge>
                      <Badge variant="soft" size="1">Resistance Bands</Badge>
                    </Flex>
                  </Card>

                  {/* Tech Reviewer */}
                  <Card style={{ padding: "1rem" }}>
                    <Flex align="center" justify="between" mb="3">
                      <Flex align="center" gap="3">
                        <Box
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#9AE6F5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text size="3" weight="bold" style={{ color: "#000" }}>TR</Text>
                        </Box>
                        <Box>
                          <Text size="3" weight="bold" style={{ display: "block", color: "#1A1A1A" }}>
                            Tech Reviewer
                          </Text>
                          <Text size="1" style={{ color: "#737373" }}>
                            @TechReviews • 234K followers
                          </Text>
                        </Box>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Badge color="yellow" size="1">Pending</Badge>
                        <Text size="1" style={{ color: "#737373" }}>
                          • 3 days ago
                        </Text>
                      </Flex>
                    </Flex>

                    <Box p="2" style={{ background: "#F9FAFB", borderRadius: "6px" }}>
                      <Text size="1" style={{ color: "#737373" }}>
                        Awaiting response — follow up scheduled
                      </Text>
                    </Box>

                    <Flex gap="2" mt="2">
                      <Badge variant="soft" size="1">Phone Case</Badge>
                    </Flex>
                  </Card>
                </Flex>

                {/* Summary Stats */}
                <Flex gap="4" wrap="wrap" mt="2">
                  <Card style={{ flex: "1 1 200px", padding: "1.25rem" }}>
                    <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
                      Total Clicks
                    </Text>
                    <Text size="7" weight="bold" style={{ color: "#1A1A1A" }}>860</Text>
                  </Card>
                  <Card style={{ flex: "1 1 200px", padding: "1.25rem" }}>
                    <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
                      Total Sales
                    </Text>
                    <Text size="7" weight="bold" style={{ color: "#1A1A1A" }}>70</Text>
                  </Card>
                  <Card style={{ flex: "1 1 200px", padding: "1.25rem" }}>
                    <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
                      Total Revenue
                    </Text>
                    <Text size="7" weight="bold" style={{ color: "#10B981" }}>$3,124</Text>
                  </Card>
                  <Card style={{ flex: "1 1 200px", padding: "1.25rem" }}>
                    <Text size="1" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
                      Conversion Rate
                    </Text>
                    <Text size="7" weight="bold" style={{ color: "#1A1A1A" }}>8.1%</Text>
                  </Card>
                </Flex>
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Flex>
    </DashboardLayout>
  );
}
