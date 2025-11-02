"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Text } from "@radix-ui/themes";
import {
  LayoutDashboard,
  Search,
  Users,
  Package,
  BarChart3,
  MessageSquare,
  Bot,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

const mainNavItems = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Discover Shorts", href: "/dashboard/reels", icon: Search },
  { name: "Partnerships", href: "/dashboard/partnerships", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Communications", href: "/dashboard/communications", icon: MessageSquare },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
];

const footerNavItems = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Help & Support", href: "/dashboard/help", icon: HelpCircle },
  { name: "Logout", href: "/logout", icon: LogOut },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <Box
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "280px",
        background: "#1A1A1A",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <Flex
        align="center"
        style={{
          height: "64px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "0 1.5rem",
        }}
      >
        <Link href="/dashboard/overview" style={{ textDecoration: "none" }}>
          <Text size="5" weight="medium" style={{ color: "#B4D88B" }}>
            Maatchaa
          </Text>
        </Link>
      </Flex>

      {/* Main Navigation */}
      <Flex direction="column" style={{ flex: 1, overflowY: "auto", padding: "1rem 0.75rem" }}>
        <Box style={{ marginBottom: "1rem", paddingLeft: "0.75rem" }}>
          <Text size="1" weight="medium" style={{ color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Main
          </Text>
        </Box>

        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                marginBottom: "0.25rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                background: isActive ? "#B4D88B" : "transparent",
                color: isActive ? "#000" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#FFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }
              }}
            >
              <Icon size={20} />
              <Text size="2" weight="medium">{item.name}</Text>
            </Link>
          );
        })}
      </Flex>

      {/* Footer Navigation */}
      <Box style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", padding: "0.75rem" }}>
        <Box style={{ marginBottom: "1rem", paddingLeft: "0.75rem" }}>
          <Text size="1" weight="medium" style={{ color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Account
          </Text>
        </Box>

        {footerNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.75rem",
                marginBottom: "0.25rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
                background: isActive ? "#B4D88B" : "transparent",
                color: isActive ? "#000" : "rgba(255, 255, 255, 0.7)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.color = "#FFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                }
              }}
            >
              <Icon size={20} />
              <Text size="2" weight="medium">{item.name}</Text>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
