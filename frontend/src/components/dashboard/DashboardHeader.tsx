"use client";

import { useState } from "react";
import { Flex, Box, Text, Avatar, IconButton, Card, Badge } from "@radix-ui/themes";
import { sage, red, blue } from "@radix-ui/colors";
import { Bell, Search, Menu } from "lucide-react";

// Sample notifications
const sampleNotifications = [
  {
    id: 1,
    title: "New Creator Match",
    message: "@teawithsarah matched with MATCHA MATCHA Can",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    title: "Partnership Accepted",
    message: "@mindfulmixology accepted your Horii Shichimeien Matcha offer",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    title: "Product Sync Complete",
    message: "16 products successfully synced from Shopify",
    time: "1 day ago",
    unread: false,
  },
];

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = sampleNotifications.filter(n => n.unread).length;

  return (
    <Flex
      align="center"
      justify="between"
      style={{
        height: "64px",
        background: "white",
        borderBottom: `1px solid ${sage.sage6}`,
        padding: "0 2rem",
        position: "fixed",
        top: 0,
        left: "280px",
        right: 0,
        zIndex: 100,
      }}
    >
      {/* Menu and Search */}
      <Flex align="center" gap="3">
        {onMenuClick && (
          <IconButton
            variant="ghost"
            onClick={onMenuClick}
            style={{ cursor: "pointer" }}
          >
            <Menu size={20} color={sage.sage11} />
          </IconButton>
        )}
        <Search size={20} color={sage.sage11} />
        <Text size="2" style={{ color: sage.sage11 }}>
          Search...
        </Text>
      </Flex>

      {/* Right side - Notifications + Profile */}
      <Flex align="center" gap="4">
        {/* Notifications */}
        <Box style={{ position: "relative" }}>
          <IconButton
            variant="ghost"
            size="2"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <Bell size={20} color="#000" />
          </IconButton>

          {/* Notification Badge */}
          {unreadCount > 0 && (
            <Box
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                minWidth: "18px",
                height: "18px",
                background: red.red9,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                color: "white",
                pointerEvents: "none",
                border: "2px solid white",
              }}
            >
              {unreadCount}
            </Box>
          )}

          {/* Notification Dropdown */}
          {showNotifications && (
            <Card
              style={{
                position: "absolute",
                top: "calc(100% + 12px)",
                right: "-8px",
                width: "360px",
                maxHeight: "500px",
                display: "flex",
                flexDirection: "column",
                padding: "0",
                zIndex: 1000,
                overflow: "hidden",
              }}
            >
              <Box style={{ padding: "1rem", borderBottom: `1px solid ${sage.sage6}` }}>
                <Text size="4" weight="bold" style={{ color: sage.sage12 }}>
                  Notifications
                </Text>
              </Box>

              <Flex direction="column" style={{ overflowY: "auto", flex: 1 }}>
                {sampleNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    style={{
                      padding: "1rem",
                      borderBottom: `1px solid ${sage.sage6}`,
                      background: notification.unread ? sage.sage2 : "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = sage.sage3;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.unread ? sage.sage2 : "white";
                    }}
                  >
                    <Flex direction="column" gap="1">
                      <Flex align="center" justify="between">
                        <Text size="2" weight="medium" style={{ color: sage.sage12 }}>
                          {notification.title}
                        </Text>
                        {notification.unread && (
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: blue.blue9,
                            }}
                          />
                        )}
                      </Flex>
                      <Text size="1" style={{ color: sage.sage11 }}>
                        {notification.message}
                      </Text>
                      <Text size="1" style={{ color: sage.sage10, marginTop: "0.25rem" }}>
                        {notification.time}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Flex>

              <Box
                style={{
                  padding: "0.75rem",
                  textAlign: "center",
                  borderTop: `1px solid ${sage.sage6}`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = sage.sage2;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
                <Text size="2" weight="medium" style={{ color: blue.blue9 }}>
                  View All Notifications
                </Text>
              </Box>
            </Card>
          )}
        </Box>

        {/* User Avatar */}
        <Avatar
          size="2"
          src="/images/img.png"
          fallback="U"
          radius="full"
        />
      </Flex>

      {/* Backdrop to close notifications */}
      {showNotifications && (
        <Box
          onClick={() => setShowNotifications(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </Flex>
  );
}
