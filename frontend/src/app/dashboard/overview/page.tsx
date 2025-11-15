"use client";

import { Card, Flex, Text, Box, Button, Badge } from "@radix-ui/themes";
import { sage, amber, blue, lime } from "@radix-ui/colors";

const POSITIVE_COLOR = "#5c9a31";
const NEGATIVE_COLOR = "#f81f1f";
import { Users, Eye, Package, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardOverviewPage() {
  // Mock data - replace with real data later
  const stats = [
    {
      title: "Pending Matches",
      value: "12",
      changeNumber: "+3",
      changeDesc: "this week",
      icon: Clock,
      color: amber.amber9,
    },
    {
      title: "Active Partnerships",
      value: "8",
      changeNumber: "+2",
      changeDesc: "this month",
      icon: CheckCircle,
      color: sage.sage9,
    },
    {
      title: "Total Reach",
      value: "2.4M",
      changeNumber: "+18%",
      changeDesc: "this month",
      icon: Eye,
      color: blue.blue9,
    },
    {
      title: "Products Listed",
      value: "47",
      changeNumber: "",
      changeDesc: "All synced",
      icon: Package,
      color: sage.sage10,
    },
  ];

  const recentMatches = [
    {
      id: 1,
      creator: "@cookingwithsarah",
      action: "New creator match found",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      creator: "@fitlifemike",
      action: "Partnership confirmed",
      time: "5 hours ago",
      status: "confirmed",
    },
    {
      id: 3,
      creator: "@techreviewalex",
      action: "Creator viewed your products",
      time: "1 day ago",
      status: "viewed",
    },
  ];

  const recentActions = [
    {
      id: 1,
      action: "Product sync completed",
      detail: "47 products updated",
      time: "1 hour ago",
    },
    {
      id: 2,
      action: "New reel discovered",
      detail: "Matcha morning routine by @teawithsarah",
      time: "3 hours ago",
    },
    {
      id: 3,
      action: "Partnership request sent",
      detail: "To @fitlifemike",
      time: "Yesterday",
    },
  ];

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Text size="8" weight="bold" as="h1">
            Dashboard Overview
          </Text>
          <Text size="3" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
            Welcome back! Here&apos;s what&apos;s happening with your partnerships.
          </Text>
        </Box>

        {/* Stats Cards */}
        <Flex gap="4" wrap="wrap">
          {stats.map((stat) => {
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
