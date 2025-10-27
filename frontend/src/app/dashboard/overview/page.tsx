"use client";

import { Card, Flex, Text, Box, Button, Badge } from "@radix-ui/themes";
import { ArrowUpIcon, Users, Eye, Package, Clock, CheckCircle, Plus } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardOverviewPage() {
  // Mock data - replace with real data later
  const stats = [
    {
      title: "Pending Matches",
      value: "12",
      change: "+3 this week",
      icon: Clock,
      color: "#F59E0B",
    },
    {
      title: "Active Partnerships",
      value: "8",
      change: "+2 this month",
      icon: CheckCircle,
      color: "#10B981",
    },
    {
      title: "Total Reach",
      value: "2.4M",
      change: "+18% this month",
      icon: Eye,
      color: "#8B5CF6",
    },
    {
      title: "Products Listed",
      value: "47",
      change: "All synced",
      icon: Package,
      color: "#3B82F6",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "match",
      creator: "@cookingwithsarah",
      action: "New creator match found",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "partnership",
      creator: "@fitlifemike",
      action: "Partnership confirmed",
      time: "5 hours ago",
      status: "confirmed",
    },
    {
      id: 3,
      type: "match",
      creator: "@techreviewalex",
      action: "Creator viewed your products",
      time: "1 day ago",
      status: "viewed",
    },
  ];

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
            Dashboard Overview
          </Text>
          <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
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
                  <Text size="2" style={{ color: "#737373", fontWeight: 500 }}>
                    {stat.title}
                  </Text>
                  <Text size="7" weight="bold" style={{ color: "#000" }}>
                    {stat.value}
                  </Text>
                  <Text size="1" style={{ color: "#10B981" }}>
                    {stat.change}
                  </Text>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* Main Content Grid */}
        <Flex gap="6" wrap="wrap">
          {/* Quick Actions */}
          <Card
            style={{
              flex: "1 1 calc(50% - 1.5rem)",
              minWidth: "300px",
              padding: "1.5rem",
            }}
          >
            <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "1rem", display: "block" }}>
              Recent Activity
            </Text>

            <Flex direction="column" gap="3">
              <Link href="/dashboard/reels" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  style={{
                    width: "100%",
                    background: "#B4D88B",
                    color: "#000",
                    fontWeight: 600,
                  }}
                >
                  <Plus size={16} />
                  Discover New Creators
                </Button>
              </Link>

              <Link href="/dashboard/partnerships" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  variant="outline"
                  style={{
                    width: "100%",
                    borderColor: "#E5E5E5",
                  }}
                >
                  <CheckCircle size={16} />
                  View Active Partnerships
                </Button>
              </Link>

              <Link href="/dashboard/communications" style={{ textDecoration: "none" }}>
                <Button
                  size="3"
                  variant="outline"
                  style={{
                    width: "100%",
                    borderColor: "#E5E5E5",
                  }}
                >
                  <Users size={16} />
                  Draft Partnership Email
                </Button>
              </Link>
            </Flex>
          </Card>

          {/* Recent Activity */}
          <Card
            style={{
              flex: "1 1 calc(50% - 1.5rem)",
              minWidth: "300px",
              padding: "1.5rem",
            }}
          >
            <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "1rem", display: "block" }}>
              Recent Activity
            </Text>

            <Flex direction="column" gap="4">
              {recentActivity.map((activity) => (
                <Flex key={activity.id} align="start" gap="3">
                  <Box
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: activity.status === "confirmed" ? "#10B981" : "#B4D88B",
                      marginTop: "6px",
                    }}
                  />
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="medium" style={{ color: "#1A1A1A" }}>
                      {activity.action}
                    </Text>
                    <Text size="1" style={{ color: "#737373" }}>
                      {activity.creator} • {activity.time}
                    </Text>
                  </Flex>
                  <Badge
                    size="1"
                    color={activity.status === "confirmed" ? "green" : "yellow"}
                    style={{ textTransform: "capitalize" }}
                  >
                    {activity.status}
                  </Badge>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Flex>

      </Flex>
    </DashboardLayout>
  );
}
