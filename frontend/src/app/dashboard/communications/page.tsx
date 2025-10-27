"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, TextArea, Dialog, Tabs } from "@radix-ui/themes";
import { Search, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Plus, Eye } from "lucide-react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: string;
  engagement: string;
  status: "pending" | "responded" | "partnered" | "declined";
  lastContact: string;
  reelTitle: string;
  productMatched: string;
}

const mockCreators: Creator[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    handle: "@CookingHacks",
    avatar: "/cooking-channel-avatar.jpg",
    followers: "125K",
    engagement: "4.2%",
    status: "responded",
    lastContact: "2 hours ago",
    reelTitle: "Amazing Kitchen Gadgets You Need!",
    productMatched: "Smart Kitchen Scale",
  },
  {
    id: "2",
    name: "Mike Fitness",
    handle: "@FitLife",
    avatar: "/fitness-channel-avatar.jpg",
    followers: "89K",
    engagement: "5.1%",
    status: "partnered",
    lastContact: "1 day ago",
    reelTitle: "5 Minute Morning Workout",
    productMatched: "Yoga Mat",
  },
  {
    id: "3",
    name: "Tech Reviewer",
    handle: "@TechReviews",
    avatar: "/tech-channel-avatar.png",
    followers: "234K",
    engagement: "3.8%",
    status: "pending",
    lastContact: "3 days ago",
    reelTitle: "This Phone Case is INSANE!",
    productMatched: "Phone Case",
  },
];

export default function CommunicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const filteredCreators = mockCreators.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || creator.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "responded":
        return <CheckCircle size={14} color="#10B981" />;
      case "partnered":
        return <CheckCircle size={14} color="#3B82F6" />;
      case "pending":
        return <Clock size={14} color="#F59E0B" />;
      case "declined":
        return <AlertCircle size={14} color="#EF4444" />;
      default:
        return <MessageSquare size={14} color="#737373" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "responded":
        return "green";
      case "partnered":
        return "blue";
      case "pending":
        return "yellow";
      case "declined":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
              Creator Communications
            </Text>
            <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
              Manage your outreach and partnerships with content creators
            </Text>
          </Box>

          <Dialog.Root open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <Dialog.Trigger>
              <Button style={{ background: "#B4D88B", color: "#000" }}>
                <Plus size={16} />
                New Message
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "500px" }}>
              <Dialog.Title>Compose Message</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Send a direct message to a creator
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
                    Creator Handle
                  </Text>
                  <TextField.Root placeholder="@CreatorHandle" />
                </Box>
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
                    Subject
                  </Text>
                  <TextField.Root placeholder="Partnership Opportunity" />
                </Box>
                <Box>
                  <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
                    Message
                  </Text>
                  <TextArea
                    placeholder="Hi there! I'd love to discuss..."
                    rows={6}
                  />
                </Box>

                <Flex gap="2" justify="end">
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button style={{ background: "#B4D88B", color: "#000" }}>
                    <Send size={14} />
                    Send Message
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {/* Stats Cards */}
        <Flex gap="4" wrap="wrap">
          {[
            { label: "Total Outreach", value: "84", subtext: "+12 this week", icon: Send },
            { label: "Response Rate", value: "73.8%", subtext: "+5.2% from last month", icon: MessageSquare },
            { label: "Active Partnerships", value: "29", subtext: "+7 new this month", icon: CheckCircle },
            { label: "Pending Responses", value: "12", subtext: "Awaiting reply", icon: Clock },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                style={{
                  flex: "1 1 calc(25% - 1rem)",
                  minWidth: "200px",
                  padding: "1.25rem",
                }}
              >
                <Flex align="center" justify="between" mb="2">
                  <Text size="2" style={{ color: "#737373" }}>
                    {stat.label}
                  </Text>
                  <Icon size={16} color="#737373" />
                </Flex>
                <Text size="6" weight="bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                  {stat.value}
                </Text>
                <Text size="1" style={{ color: "#737373" }}>
                  {stat.subtext}
                </Text>
              </Card>
            );
          })}
        </Flex>

        {/* Communications List */}
        <Tabs.Root value={selectedStatus} onValueChange={setSelectedStatus}>
          <Flex align="center" gap="4" mb="4">
            <Tabs.List>
              <Tabs.Trigger value="all">All</Tabs.Trigger>
              <Tabs.Trigger value="pending">Pending</Tabs.Trigger>
              <Tabs.Trigger value="responded">Responded</Tabs.Trigger>
              <Tabs.Trigger value="partnered">Partnered</Tabs.Trigger>
              <Tabs.Trigger value="declined">Declined</Tabs.Trigger>
            </Tabs.List>

            <Box style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#737373",
                }}
              />
              <TextField.Root
                placeholder="Search creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </Box>
          </Flex>

          <Card
            style={{
              padding: "1.5rem",
            }}
          >
            <Text size="5" weight="bold" style={{ color: "#1A1A1A", marginBottom: "1rem", display: "block" }}>
              Creator Communications
            </Text>
            <Text size="2" style={{ color: "#737373", marginBottom: "1.5rem", display: "block" }}>
              All your creator outreach and partnership communications
            </Text>

            <Flex direction="column" gap="3">
              {filteredCreators.map((creator) => (
                <Flex
                  key={creator.id}
                  align="center"
                  justify="between"
                  p="4"
                  style={{
                    border: "1px solid #F5F5F5",
                    borderRadius: "8px",
                  }}
                >
                  <Flex align="center" gap="4">
                    <Box
                      style={{
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={creator.avatar || "/placeholder.svg"}
                        alt={creator.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text size="3" weight="medium">
                          {creator.name}
                        </Text>
                        <Text size="2" style={{ color: "#737373" }}>
                          {creator.handle}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="4">
                        <Text size="1" style={{ color: "#737373" }}>
                          {creator.followers} followers
                        </Text>
                        <Text size="1" style={{ color: "#737373" }}>
                          {creator.engagement} engagement
                        </Text>
                        <Text size="1" style={{ color: "#737373" }}>
                          Last contact: {creator.lastContact}
                        </Text>
                      </Flex>
                      <Text size="2">
                        <span style={{ fontWeight: 500 }}>Reel:</span> {creator.reelTitle}
                      </Text>
                      <Text size="2">
                        <span style={{ fontWeight: 500 }}>Product:</span> {creator.productMatched}
                      </Text>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Badge color={getStatusColor(creator.status)}>
                      {getStatusIcon(creator.status)}
                      <span style={{ textTransform: "capitalize", marginLeft: "4px" }}>
                        {creator.status}
                      </span>
                    </Badge>
                    <Button variant="ghost" size="1">
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="1">
                      <MessageSquare size="14" />
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </Card>
        </Tabs.Root>
      </Flex>
    </DashboardLayout>
  );
}
