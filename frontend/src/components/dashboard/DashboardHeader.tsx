"use client";

import { useState } from "react";
import { Flex, Box, Text, Avatar, IconButton, Card } from "@radix-ui/themes";
import { Bell, Search } from "lucide-react";

// Sample notifications
const sampleNotifications = [
  {
    id: 1,
    title: "New Creator Match",
    message: "@cookingwithsarah matched with your Kitchen Scale",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    title: "Partnership Accepted",
    message: "@fitlifemike accepted your partnership offer",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    title: "Product Sync Complete",
    message: "47 products successfully synced from Shopify",
    time: "1 day ago",
    unread: false,
  },
];

export default function DashboardHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = sampleNotifications.filter(n => n.unread).length;

  return (
    <Flex
      align="center"
      justify="between"
      style={{
        height: "64px",
        background: "white",
        borderBottom: "1px solid #E5E5E5",
        padding: "0 2rem",
        position: "relative",
      }}
    >
      {/* Search (placeholder for now) */}
      <Flex align="center" gap="3">
        <Search size={20} color="#737373" />
        <Text size="2" style={{ color: "#737373" }}>
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
            <Bell size={20} />
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
                background: "#EF4444",
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
                maxHeight: "400px",
                overflowY: "auto",
                padding: "0",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                border: "1px solid #E5E5E5",
              }}
            >
              <Box style={{ padding: "1rem", borderBottom: "1px solid #E5E5E5" }}>
                <Text size="4" weight="bold" style={{ color: "#1A1A1A" }}>
                  Notifications
                </Text>
              </Box>

              <Flex direction="column">
                {sampleNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #E5E5E5",
                      background: notification.unread ? "#F9FAFB" : "white",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notification.unread ? "#F9FAFB" : "white";
                    }}
                  >
                    <Flex direction="column" gap="1">
                      <Flex align="center" justify="between">
                        <Text size="2" weight="medium" style={{ color: "#1A1A1A" }}>
                          {notification.title}
                        </Text>
                        {notification.unread && (
                          <Box
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#3B82F6",
                            }}
                          />
                        )}
                      </Flex>
                      <Text size="1" style={{ color: "#737373" }}>
                        {notification.message}
                      </Text>
                      <Text size="1" style={{ color: "#A3A3A3", marginTop: "0.25rem" }}>
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
                  borderTop: "1px solid #E5E5E5",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
                <Text size="2" weight="medium" style={{ color: "#3B82F6" }}>
                  View All Notifications
                </Text>
              </Box>
            </Card>
          )}
        </Box>

        {/* User Avatar */}
        <Avatar
          size="2"
          src="/placeholder-user.jpg"
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
