"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Flex, Text, Box } from "@radix-ui/themes";
import { Eye, Clock, Users, Package } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getCurrentUser } from "@/lib/auth";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface DashboardStats {
  pending_matches: number;
  active_partnerships: number;
  total_reach: number;
  products_count: number;
}

interface Partnership {
  id: string;
  status: string;
  created_at: string | null;
  views: number | null;
  likes: number | null;
  matched_products?: Array<{ id?: string; title?: string; name?: string }>;
}

const STATUS_ORDER: Array<{ key: string; label: string; color: string }> = [
  { key: "to_contact", label: "To Contact", color: "#F7D590" },
  { key: "contacted", label: "Contacted", color: "#F2B083" },
  { key: "in_discussion", label: "In Discussion", color: "#9BBFF4" },
  { key: "active", label: "Active", color: "#B7DC8D" },
  { key: "closed", label: "Closed", color: "#D4D4D4" },
];

const partnershipsChartConfig = {
  partnerships: { label: "Partnerships", color: "#8DBBD4" },
};

const reachChartConfig = {
  views: { label: "Views", color: "#F2B083" },
  likes: { label: "Likes", color: "#B7DC8D" },
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

function lastSixMonths(): Array<{ key: string; month: string }> {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en-US", { month: "short" }),
    };
  });
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { companyId } = getCurrentUser();
        const [statsRes, partnershipsRes] = await Promise.all([
          fetch(`/api/dashboard/stats?company_id=${companyId}`),
          fetch(`/api/partnerships?company_id=${companyId}`),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }
        if (partnershipsRes.ok) {
          const data = await partnershipsRes.json();
          setPartnerships(data.partnerships || []);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of partnerships) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [partnerships]);

  const monthlyData = useMemo(() => {
    const buckets = lastSixMonths().map((m) => ({ ...m, partnerships: 0, views: 0, likes: 0 }));
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const p of partnerships) {
      const bucket = p.created_at ? byKey.get(p.created_at.slice(0, 7)) : undefined;
      if (!bucket) continue;
      bucket.partnerships += 1;
      bucket.views += p.views || 0;
      bucket.likes += p.likes || 0;
    }
    return buckets;
  }, [partnerships]);

  const { topProducts, matchedProductCount } = useMemo(() => {
    const byProduct = new Map<string, { product: string; partnerships: number; views: number }>();
    for (const p of partnerships) {
      const seen = new Set<string>();
      for (const prod of p.matched_products || []) {
        const name = prod.title || prod.name;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        const entry = byProduct.get(name) || { product: name, partnerships: 0, views: 0 };
        entry.partnerships += 1;
        entry.views += p.views || 0;
        byProduct.set(name, entry);
      }
    }
    const topProducts = [...byProduct.values()]
      .sort((a, b) => b.partnerships - a.partnerships || b.views - a.views)
      .slice(0, 5);
    return { topProducts, matchedProductCount: byProduct.size };
  }, [partnerships]);

  const totalLikes = partnerships.reduce((sum, p) => sum + (p.likes || 0), 0);
  const inDiscussion = statusCounts["in_discussion"] || 0;

  const statsConfig = stats
    ? [
        {
          title: "Total Reach",
          value: formatNumber(stats.total_reach),
          desc: `${formatNumber(totalLikes)} likes across ${partnerships.length} partnerships`,
          icon: Eye,
        },
        {
          title: "Active Partnerships",
          value: stats.active_partnerships.toString(),
          desc: `${inDiscussion} in discussion, ${statusCounts["closed"] || 0} closed`,
          icon: Users,
        },
        {
          title: "Pending Matches",
          value: stats.pending_matches.toString(),
          desc: `${statusCounts["to_contact"] || 0} to contact, ${statusCounts["contacted"] || 0} contacted`,
          icon: Clock,
        },
        {
          title: "Products",
          value: stats.products_count.toString(),
          desc: `${matchedProductCount} featured in partnerships`,
          icon: Package,
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Text size="8" weight="bold" style={{ color: "sage.sage12" }}>
            Analytics
          </Text>
          <Text size="3" style={{ color: "sage.sage11", marginTop: "0.5rem", display: "block" }}>
            Track your performance and creator partnerships
          </Text>
        </Box>

        {/* Stats Cards */}
        <Flex gap="4" wrap="wrap">
          {loading && (
            <Text size="2" style={{ color: "sage.sage11" }}>
              Loading analytics...
            </Text>
          )}
          {statsConfig.map((stat) => (
            <Card
              key={stat.title}
              style={{
                flex: "1 1 calc(25% - 1rem)",
                minWidth: "240px",
                padding: "1.5rem",
              }}
            >
              <Flex direction="column" gap="3">
                <Flex align="center" justify="between">
                  <Text size="2" style={{ color: "sage.sage11", fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <stat.icon size={16} color="#6B7280" />
                </Flex>
                <Text size="7" weight="medium" style={{ color: "#000" }}>
                  {stat.value}
                </Text>
                <Text size="1" style={{ color: "sage.sage11" }}>
                  {stat.desc}
                </Text>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Flex gap="4" direction={{ initial: "column", md: "row" }}>
          {/* Partnerships per month */}
          <Card style={{ flex: 1, padding: "1.5rem" }}>
            <Text size="5" weight="medium" style={{ color: "sage.sage12", marginBottom: "0.5rem", display: "block" }}>
              Partnerships Over Time
            </Text>
            <Text size="2" style={{ color: "sage.sage11", marginBottom: "1.5rem", display: "block" }}>
              Partnerships created per month, last 6 months
            </Text>

            <ChartContainer config={partnershipsChartConfig} style={{ height: "300px", width: "100%" }}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="sage.sage11" fontSize={12} />
                <YAxis stroke="sage.sage11" fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="partnerships" fill="var(--color-partnerships)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          {/* Reach per month */}
          <Card style={{ flex: 1, padding: "1.5rem" }}>
            <Text size="5" weight="medium" style={{ color: "sage.sage12", marginBottom: "0.5rem", display: "block" }}>
              Reach Over Time
            </Text>
            <Text size="2" style={{ color: "sage.sage11", marginBottom: "1.5rem", display: "block" }}>
              Views and likes on reels from partnerships created each month
            </Text>

            <ChartContainer config={reachChartConfig} style={{ height: "300px", width: "100%" }}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="sage.sage11" fontSize={12} />
                <YAxis stroke="sage.sage11" fontSize={12} tickFormatter={(value) => formatNumber(value)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  fill="var(--color-views)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="likes"
                  stroke="var(--color-likes)"
                  fill="var(--color-likes)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </Card>
        </Flex>

        <Flex gap="4" direction={{ initial: "column", md: "row" }}>
          {/* Status breakdown */}
          <Card style={{ flex: 1, padding: "1.5rem" }}>
            <Text size="5" weight="medium" style={{ color: "sage.sage12", marginBottom: "0.5rem", display: "block" }}>
              Partnership Pipeline
            </Text>
            <Text size="2" style={{ color: "sage.sage11", marginBottom: "1.5rem", display: "block" }}>
              Partnerships by status
            </Text>

            <Flex direction="column" gap="4">
              {STATUS_ORDER.map((status) => {
                const count = statusCounts[status.key] || 0;
                const pct = partnerships.length ? (count / partnerships.length) * 100 : 0;
                return (
                  <Box key={status.key}>
                    <Flex align="center" justify="between" mb="2">
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: status.color,
                          }}
                        />
                        <Text size="2" weight="medium">
                          {status.label}
                        </Text>
                      </Flex>
                      <Text size="2" style={{ color: "sage.sage11" }}>
                        {count}
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
                          width: `${pct}%`,
                          height: "100%",
                          background: status.color,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Flex>
          </Card>

          {/* Top products */}
          <Card style={{ flex: 1, padding: "1.5rem" }}>
            <Text size="5" weight="medium" style={{ color: "sage.sage12", marginBottom: "0.5rem", display: "block" }}>
              Top Products
            </Text>
            <Text size="2" style={{ color: "sage.sage11", marginBottom: "1.5rem", display: "block" }}>
              Products most often matched in partnerships
            </Text>

            <Flex direction="column" gap="3">
              {!loading && topProducts.length === 0 && (
                <Text size="2" style={{ color: "sage.sage11" }}>
                  No products matched in partnerships yet
                </Text>
              )}
              {topProducts.map((product) => (
                <Flex key={product.product} align="center" justify="between" p="4" style={{ borderRadius: "8px" }}>
                  <Box>
                    <Text size="3" weight="medium" style={{ display: "block", marginBottom: "0.25rem" }}>
                      {product.product}
                    </Text>
                    <Text size="1" style={{ color: "sage.sage11" }}>
                      {product.partnerships} {product.partnerships === 1 ? "partnership" : "partnerships"}
                    </Text>
                  </Box>
                  <Box style={{ textAlign: "right" }}>
                    <Text size="4" weight="medium" style={{ display: "block", marginBottom: "0.25rem" }}>
                      {formatNumber(product.views)}
                    </Text>
                    <Text size="1" style={{ color: "sage.sage11" }}>
                      views
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </DashboardLayout>
  );
}
