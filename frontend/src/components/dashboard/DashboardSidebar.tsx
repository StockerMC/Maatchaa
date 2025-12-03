"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Text, Separator } from "@radix-ui/themes";
import { sand } from "@radix-ui/colors";
import {
  DashboardIcon,
  MagnifyingGlassIcon,
  Link2Icon,
  CubeIcon,
  BarChartIcon,
  ChatBubbleIcon,
  MixIcon,
  GearIcon,
  QuestionMarkCircledIcon,
  ExitIcon
} from "@radix-ui/react-icons";
import SquigglyUnderlineTextLogo from '../SquigglyUnderlineTextLogo';

const mainNavItems = [
  { name: "Overview", href: "/dashboard/overview", icon: DashboardIcon },
  { name: "Discover Shorts", href: "/dashboard/reels", icon: MagnifyingGlassIcon },
  { name: "Partnerships", href: "/dashboard/partnerships", icon: Link2Icon },
  { name: "Products", href: "/dashboard/products", icon: CubeIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChartIcon },
  { name: "Communications", href: "/dashboard/communications", icon: ChatBubbleIcon },
  { name: "Agents", href: "/dashboard/agents", icon: MixIcon },
];

const footerNavItems = [
  { name: "Settings", href: "/dashboard/settings", icon: GearIcon },
  { name: "Help & Support", href: "/dashboard/help", icon: QuestionMarkCircledIcon },
  { name: "Logout", href: "/logout", icon: ExitIcon },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function DashboardSidebar({ isOpen = true, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Box
      style={{
        position: "fixed",
        left: isOpen ? 0 : "-280px",
        top: 0,
        bottom: 0,
        width: "280px",
        background: sand.sand2,
        borderRight: `1px solid ${sand.sand6}`,
        display: "flex",
        flexDirection: "column",
        transition: "left 0.3s ease",
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <Flex
        align="center"
        style={{
          height: "64px",
          borderBottom: `1px solid ${sand.sand6}`,
          padding: "0 1.5rem",
        }}
      >
        <Link href="/dashboard/overview" style={{ textDecoration: "none" }}>
          <SquigglyUnderlineTextLogo>
            Maatchaa
          </SquigglyUnderlineTextLogo>
        </Link>
      </Flex>

      {/* Main Navigation */}
      <Flex direction="column" style={{ flex: 1, overflowY: "auto", padding: "1rem 0.75rem" }}>
        <Box style={{ marginBottom: "0.75rem", paddingLeft: "0.75rem" }}>
          <Text size="1" weight="medium" style={{ color: sand.sand11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                borderRadius: "12px",
                textDecoration: "none",
                background: "transparent",
                color: sand.sand11,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = sand.sand3;
                e.currentTarget.style.color = sand.sand12;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = sand.sand11;
              }}
            >
              <Icon width={20} height={20} />
              <Text size="2" weight="regular">{item.name}</Text>
            </Link>
          );
        })}
      </Flex>

      {/* Footer Navigation */}
      <Box style={{ borderTop: `1px solid ${sand.sand6}`, padding: "0.75rem" }}>
        <Box style={{ marginBottom: "0.75rem", paddingLeft: "0.75rem" }}>
          <Text size="1" weight="medium" style={{ color: sand.sand11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                borderRadius: "12px",
                textDecoration: "none",
                background: "transparent",
                color: sand.sand11,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = sand.sand3;
                e.currentTarget.style.color = sand.sand12;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = sand.sand11;
              }}
            >
              <Icon width={20} height={20} />
              <Text size="2" weight="regular">{item.name}</Text>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
