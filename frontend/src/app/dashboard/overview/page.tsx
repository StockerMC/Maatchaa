"use client";

import { Card, Flex, Text, Box, Button, Badge } from "@radix-ui/themes";
import { sage, amber, blue, lime } from "@radix-ui/colors";

const POSITIVE_COLOR = "#5c9a31";
const NEGATIVE_COLOR = "#f81f1f";
import { Users, Eye, Package, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface DashboardStats {
  pending_matches: number;
  active_partnerships: number;
  total_reach: number;
  products_count: number;
}

interface RecentMatch {
  id: string;
  creator: string;
  action: string;
  time: string;
  status: string;
}

interface RecentActivity {
  id: string;
  action: string;
  detail: string;
  time: string;
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [recentActions, setRecentActions] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Use demo company ID for now (matches DEV_COMPANY_ID in backend)
        let companyId = localStorage.getItem("access_token");

        // Fallback to demo company ID from env if not found
        if (!companyId) {
          companyId = process.env.NEXT_PUBLIC_DEMO_COMPANY_ID || "";
          console.log("Using demo company ID from env");
        }

        console.log("Company ID:", companyId);
        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

        const url = `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats?company_id=${companyId}`;
        console.log("Fetching from:", url);

        const response = await fetch(url);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dashboard data:", data);

        setStats(data.stats);
        setRecentMatches(data.recent_matches || []);
        setRecentActions(data.recent_activity || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default empty data on error
        setStats({
          pending_matches: 0,
          active_partnerships: 0,
          total_reach: 0,
          products_count: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const statsConfig = stats
    ? [
        {
          title: "Pending Matches",
          value: stats.pending_matches.toString(),
          changeNumber: "",
          changeDesc: "awaiting contact",
          icon: Clock,
          color: amber.amber9,
        },
        {
          title: "Active Partnerships",
          value: stats.active_partnerships.toString(),
          changeNumber: "",
          changeDesc: "currently active",
          icon: CheckCircle,
          color: sage.sage9,
        },
        {
          title: "Total Reach",
          value: formatNumber(stats.total_reach),
          changeNumber: "",
          changeDesc: "total views",
          icon: Eye,
          color: blue.blue9,
        },
        {
          title: "Products Listed",
          value: stats.products_count.toString(),
          changeNumber: "",
          changeDesc: "synced from Shopify",
          icon: Package,
          color: sage.sage10,
        },
      ]
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <Flex direction="column" gap="6" align="center" justify="center" style={{ minHeight: "400px" }}>
          <Text size="4" style={{ color: sage.sage11 }}>
            Loading dashboard...
          </Text>
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Text size="8" weight="bold">
            Dashboard Overview
          </Text>
          <Text size="3" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
            Welcome back! Here&apos;s what&apos;s happening with your partnerships.
          </Text>
        </Box>

        {/* Stats Cards */}
        <Flex gap="4" wrap="wrap">
          {statsConfig.map((stat) => {
            const Icon = stat.icon;
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
                  <Text size="2" style={{ color: "sage.sage11", fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <Text size="7" weight="medium" style={{ color: "#000" }}>
                    {stat.value}
                  </Text>
                  <Flex align="center" gap="1">
                    {stat.changeNumber && (
                      <Text size="1" style={{ color: POSITIVE_COLOR, fontWeight: 600 }}>
                        {stat.changeNumber}
                      </Text>
                    )}
                    <Text size="1" style={{ color: "#000", fontWeight: 400 }}>
                      {stat.changeDesc}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* Recent Activity Cards */}
        <Flex gap="4" wrap="wrap">
          {/* Recent Matches */}
          <Card style={{ flex: 1, minWidth: "320px", padding: "1.5rem" }}>
            <Flex direction="column" gap="4">
              <Flex align="center" justify="between">
                <Text size="5" weight="medium">
                  Recent Matches
                </Text>
                <Button variant="solid" color="lime" size="2" asChild>
                  <Link href="/dashboard/reels">View All</Link>
                </Button>
              </Flex>

              <Flex direction="column" gap="3">
                {recentMatches.map((item) => (
                  <Box key={item.id}>
                    <Flex align="start" justify="between" mb="1">
                      <Text size="2" weight="medium">
                        {item.creator}
                      </Text>
                      <Badge
                        size="1"
                        color={
                          item.status === "confirmed"
                            ? "purple"
                            : item.status === "pending"
                            ? "amber"
                            : "gray"
                        }
                      >
                        {item.status}
                      </Badge>
                    </Flex>
                    <Text size="1" style={{ color: sage.sage11, display: "block", marginBottom: "0.25rem" }}>
                      {item.action}
                    </Text>
                    <Text size="1" style={{ color: sage.sage10 }}>
                      {item.time}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>

          {/* Recent Activity */}
          <Card style={{ flex: 1, minWidth: "320px", padding: "1.5rem" }}>
            <Flex direction="column" gap="4">
              <Flex align="center" justify="between">
                <Text size="5" weight="medium">
                  Activity Log
                </Text>
                <Button variant="solid" color="lime" size="2" asChild>
                  <Link href="/dashboard/analytics">View All</Link>
                </Button>
              </Flex>

              <Flex direction="column" gap="3">
                {recentActions.map((item) => (
                  <Box key={item.id}>
                    <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.25rem" }}>
                      {item.action}
                    </Text>
                    <Text size="1" style={{ color: sage.sage11, display: "block", marginBottom: "0.25rem" }}>
                      {item.detail}
                    </Text>
                    <Text size="1" style={{ color: sage.sage10 }}>
                      {item.time}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Flex>
          </Card>

          {/* Quick Actions */}
          <Card style={{ flex: "0 0 250px", maxWidth: "250px", padding: "1.5rem" }}>
            <Flex direction="column" gap="4">
              <Text size="5" weight="medium">
                Quick Actions
              </Text>
              <Flex direction="column" gap="3" align="center">
                <Button
                  variant="solid"
                  color="lime"
                  size="3"
                  asChild
                  style={{ width: "85%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <Link href="/dashboard/reels">
                    Discover Shorts
                  </Link>
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  asChild
                  style={{ width: "85%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <Link href="/dashboard/products">
                    Manage Products
                  </Link>
                </Button>
                <Button
                  variant="soft"
                  color="gray"
                  size="3"
                  asChild
                  style={{ width: "85%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <Link href="/dashboard/agents">
                    Create Agent
                  </Link>
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </DashboardLayout>
  );
}
