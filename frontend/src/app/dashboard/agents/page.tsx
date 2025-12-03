"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, Dialog, Avatar, Select } from "@radix-ui/themes";
import { sage, sand } from "@radix-ui/colors";
import {
  Bot,
  Send,
  Mail,
  FileText,
  Calendar,
  Search as SearchIcon,
  TrendingUp,
  Plus
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface AgentAction {
  id: string;
  type: "email" | "contract" | "research" | "schedule" | "analysis";
  description: string;
  timestamp: string;
  status: "completed" | "in_progress" | "pending";
  details?: string;
}

interface AgentMessage {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: string;
  action?: AgentAction;
}

interface Agent {
  id: string;
  name: string;
  purpose: "general" | "outreach" | "contracts" | "campaign" | "analytics";
  avatar: string;
  status: "active" | "idle" | "working";
  lastActive: string;
  messages: AgentMessage[];
  taskCount: number;
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Sarah",
    purpose: "outreach",
    avatar: "S",
    status: "working",
    lastActive: "2 min ago",
    taskCount: 12,
    messages: [
      {
        id: "1-1",
        role: "user",
        content: "Find 5 creators who match our ceremonial matcha products and send personalized outreach emails",
        timestamp: "10:30 AM",
      },
      {
        id: "1-2",
        role: "agent",
        content: "I'll help you with that! Let me search for relevant creators and draft personalized outreach emails.",
        timestamp: "10:31 AM",
      },
      {
        id: "1-3",
        role: "agent",
        content: "",
        timestamp: "10:32 AM",
        action: {
          id: "a1",
          type: "research",
          description: "Researched 5 creators matching ceremonial matcha niche",
          timestamp: "10:32 AM",
          status: "completed",
          details: "@teawithsarah (125K), @mindfulmixology (89K), @matcharituals (67K), @zenandtea (45K), @morningvibes (102K)",
        },
      },
      {
        id: "1-4",
        role: "agent",
        content: "",
        timestamp: "10:35 AM",
        action: {
          id: "a2",
          type: "email",
          description: "Sent personalized outreach to @teawithsarah",
          timestamp: "10:35 AM",
          status: "completed",
          details: "Subject: Partnership Opportunity - Premium Ceremonial Matcha\n\nHi Sarah, loved your 'Morning Matcha Ritual' video...",
        },
      },
      {
        id: "1-5",
        role: "agent",
        content: "",
        timestamp: "10:37 AM",
        action: {
          id: "a3",
          type: "email",
          description: "Sent personalized outreach to @mindfulmixology",
          timestamp: "10:37 AM",
          status: "completed",
        },
      },
      {
        id: "1-6",
        role: "agent",
        content: "",
        timestamp: "10:40 AM",
        action: {
          id: "a4",
          type: "email",
          description: "Drafting outreach for @matcharituals",
          timestamp: "10:40 AM",
          status: "in_progress",
        },
      },
      {
        id: "1-7",
        role: "agent",
        content: "I've sent 2 emails so far and I'm working on the remaining 3. Would you like me to continue or would you like to review the drafts first?",
        timestamp: "10:41 AM",
      },
    ],
  },
  {
    id: "2",
    name: "Marcus",
    purpose: "campaign",
    avatar: "M",
    status: "active",
    lastActive: "1 hour ago",
    taskCount: 8,
    messages: [
      {
        id: "2-1",
        role: "user",
        content: "Create a campaign brief for our holiday product line targeting lifestyle creators",
        timestamp: "Yesterday",
      },
      {
        id: "2-2",
        role: "agent",
        content: "I've created a comprehensive campaign brief! Here's what I put together:",
        timestamp: "Yesterday",
      },
      {
        id: "2-3",
        role: "agent",
        content: "",
        timestamp: "Yesterday",
        action: {
          id: "a5",
          type: "contract",
          description: "Generated holiday campaign brief",
          timestamp: "Yesterday",
          status: "completed",
          details: "Campaign: Holiday Essentials 2024\nTarget: Lifestyle creators (50K-200K)\nProducts: Le Labo collection, Premium matcha sets\nCommission: 18% (holiday special)\nDeliverables: 2 Shorts, 1 Story highlight",
        },
      },
      {
        id: "2-4",
        role: "agent",
        content: "",
        timestamp: "Yesterday",
        action: {
          id: "a6",
          type: "email",
          description: "Sent campaign brief to 8 lifestyle creators",
          timestamp: "Yesterday",
          status: "completed",
          details: "Sent to: @emmalifestyle, @luxeliving, @morningrituals, @aestheticvibes, @dailyessentials, @cozyseason, @simplelife, @minimalmoments\n\nSubject: Holiday Campaign Opportunity - Premium Product Collection\n\nIncluded campaign brief, product details, and commission structure (18% holiday rate).",
        },
      },
    ],
  },
  {
    id: "3",
    name: "Emma",
    purpose: "general",
    avatar: "E",
    status: "idle",
    lastActive: "2 days ago",
    taskCount: 3,
    messages: [
      {
        id: "3-1",
        role: "user",
        content: "Hey Emma! What can you help me with?",
        timestamp: "2 days ago",
      },
      {
        id: "3-2",
        role: "agent",
        content: "Hi! I'm a general purpose agent and can help with various tasks like research, data analysis, answering questions about your partnerships, and more. What would you like to work on?",
        timestamp: "2 days ago",
      },
    ],
  },
  {
    id: "4",
    name: "Alex",
    purpose: "analytics",
    avatar: "A",
    status: "active",
    lastActive: "10 min ago",
    taskCount: 15,
    messages: [
      {
        id: "4-1",
        role: "user",
        content: "Which creators are performing best this month?",
        timestamp: "30 min ago",
      },
      {
        id: "4-2",
        role: "agent",
        content: "Let me analyze the performance data for this month.",
        timestamp: "30 min ago",
      },
      {
        id: "4-3",
        role: "agent",
        content: "",
        timestamp: "29 min ago",
        action: {
          id: "a7",
          type: "analysis",
          description: "Analyzed creator performance for November 2025",
          timestamp: "29 min ago",
          status: "completed",
        },
      },
      {
        id: "4-4",
        role: "agent",
        content: "Based on the data, here are your top 3 performing creators this month:\n\n1. **@teawithsarah** - 47 conversions, $1,890 in sales (15% commission = $283.50)\n2. **@mindfulmixology** - 32 conversions, $1,280 in sales (15% = $192)\n3. **@morningvibes** - 28 conversions, $896 in sales (15% = $134.40)\n\nYour matcha products are seeing the highest conversion rates, with an average of 8.2% click-to-purchase rate across all active partnerships.",
        timestamp: "29 min ago",
      },
      {
        id: "4-5",
        role: "user",
        content: "What about the holiday campaign we sent out yesterday? Any early indicators?",
        timestamp: "10 min ago",
      },
      {
        id: "4-6",
        role: "agent",
        content: "",
        timestamp: "10 min ago",
        action: {
          id: "a8",
          type: "analysis",
          description: "Reviewed holiday campaign early metrics",
          timestamp: "10 min ago",
          status: "completed",
        },
      },
      {
        id: "4-7",
        role: "agent",
        content: "Great question! Here's what I'm seeing so far:\n\n**Email Performance (8 creators contacted yesterday):**\n- 5 emails opened (62.5% open rate)\n- 2 responses received (@luxeliving, @cozyseason)\n- Average time to open: 3.2 hours\n\n**Interest Level:**\n- @luxeliving: Interested, asking about product samples\n- @cozyseason: Very interested, ready to sign contract\n\nIt's still early, but the 62.5% open rate is above your average of 48%, likely due to the holiday timing and higher commission offer (18% vs usual 15%).",
        timestamp: "10 min ago",
      },
    ],
  },
];

const purposeLabels = {
  general: "General",
  outreach: "Creator Outreach",
  contracts: "Contract Generation",
  campaign: "Campaign Management",
  analytics: "Performance Analytics",
};

const purposeColors: Record<string, "lime"> = {
  general: "lime",
  outreach: "lime",
  contracts: "lime",
  campaign: "lime",
  analytics: "lime",
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(mockAgents[0]);
  const [newAgentOpen, setNewAgentOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPurpose, setNewAgentPurpose] = useState<Agent["purpose"]>("general");
  const [messageInput, setMessageInput] = useState("");

  const getStatusBadge = (status: Agent["status"]) => {
    switch (status) {
      case "working":
        return (
          <Badge size="1" variant="soft" color="blue">
            Working
          </Badge>
        );
      case "active":
        return (
          <Badge size="1" variant="soft" color="purple">
            Active
          </Badge>
        );
      case "idle":
        return (
          <Badge size="1" variant="soft" color="amber">
            Idle
          </Badge>
        );
    }
  };

  const getActionIcon = (type: AgentAction["type"]) => {
    switch (type) {
      case "email":
        return <Mail size={14} />;
      case "contract":
        return <FileText size={14} />;
      case "research":
        return <SearchIcon size={14} />;
      case "schedule":
        return <Calendar size={14} />;
      case "analysis":
        return <TrendingUp size={14} />;
    }
  };

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return;

    // Would create agent via backend here
    console.log("Creating agent:", { name: newAgentName, purpose: newAgentPurpose });

    setNewAgentName("");
    setNewAgentPurpose("general");
    setNewAgentOpen(false);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedAgent) return;

    // Would send message to agent via backend here
    console.log("Sending message to agent:", { agentId: selectedAgent.id, message: messageInput });

    setMessageInput("");
  };

  return (
    <DashboardLayout>
        <Flex direction="column" gap="4" style={{ height: "calc(100vh - 100px)" }}>
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: sage.sage12 }}>
              AI Agents
            </Text>
            <Text size="2" style={{ color: sage.sage11, marginTop: "0.25rem", display: "block" }}>
              Your AI workforce for managing partnerships and campaigns
            </Text>
          </Box>

          <Dialog.Root open={newAgentOpen} onOpenChange={setNewAgentOpen}>
            <Dialog.Trigger>
              <Button variant="solid" color="lime">
                <Plus size={16} />
                New Agent
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "450px" }}>
              <Dialog.Title>Create New Agent</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Set up a new AI agent to help with your tasks
              </Dialog.Description>

              <Flex direction="column" gap="4">
                <Box>
                  <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>Agent Name</Text>
                  <TextField.Root
                    placeholder="e.g., Sarah, Marcus, Emma"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    size="3"
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>Purpose</Text>
                  <Select.Root value={newAgentPurpose} onValueChange={(value) => setNewAgentPurpose(value as Agent["purpose"])}>
                    <Select.Trigger style={{ width: "100%" }} />
                    <Select.Content>
                      <Select.Item value="general">General - Multi-purpose assistant</Select.Item>
                      <Select.Item value="outreach">Creator Outreach - Find and contact creators</Select.Item>
                      <Select.Item value="contracts">Contract Generation - Create partnership agreements</Select.Item>
                      <Select.Item value="campaign">Campaign Management - Plan and execute campaigns</Select.Item>
                      <Select.Item value="analytics">Performance Analytics - Track and analyze results</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Flex gap="2" justify="end" mt="2">
                  <Dialog.Close>
                    <Button variant="soft" color="lime">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleCreateAgent}
                    disabled={!newAgentName.trim()}
                    variant="solid"
                    color="lime"
                  >
                    Create Agent
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {/* Split Pane Layout */}
        <Flex gap="4" style={{ flex: 1, overflow: "hidden" }}>
          {/* Left Sidebar - Agent List */}
          <Card
            style={{
              width: "100%",
              maxWidth: "320px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Text size="2" weight="medium" mb="3" style={{ color: sage.sage11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Your Agents ({mockAgents.length})
            </Text>

            {/* Agent List */}
            <Flex direction="column" gap="2" style={{ flex: 1, overflowY: "auto" }}>
              {mockAgents.map((agent) => (
                <Box
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  style={{
                    padding: "1rem",
                    borderRadius: "10px",
                    background: selectedAgent?.id === agent.id ? sand.sand2 : "transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Flex align="start" gap="3">
                    <Avatar
                      size="2"
                      radius="full"
                      color="gray"
                      fallback={agent.name.charAt(0)}
                    />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" justify="between" mb="1">
                        <Text size="3" weight="medium" style={{ color: sage.sage12 }}>
                          {agent.name}
                        </Text>
                        {getStatusBadge(agent.status)}
                      </Flex>
                      <Badge color={purposeColors[agent.purpose]} size="1" mb="2">
                        {purposeLabels[agent.purpose]}
                      </Badge>
                      <Flex align="center" justify="between" mt="2">
                        <Text size="1" style={{ color: sage.sage11 }}>
                          {agent.taskCount} tasks completed
                        </Text>
                        <Text size="1" style={{ color: sage.sage11 }}>
                          {agent.lastActive}
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Flex>
          </Card>

          {/* Right Panel - Chat Interface */}
          {selectedAgent ? (
            <Card
              style={{
                flex: 1,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Chat Header */}
              <Box p="4" style={{ borderBottom: `1px solid ${sand.sand4}` }}>
                <Flex align="center" justify="between">
                  <Flex align="center" gap="3">
                    <Avatar
                      size="2"
                      radius="full"
                      color="gray"
                      fallback={selectedAgent.name.charAt(0)}
                    />
                    <Box>
                      <Text size="4" weight="medium" style={{ display: "block" }}>
                        {selectedAgent.name}
                      </Text>
                      <Flex align="center" gap="2">
                        <Badge color={purposeColors[selectedAgent.purpose]} size="1">
                          {purposeLabels[selectedAgent.purpose]}
                        </Badge>
                        <Text size="1" style={{ color: sage.sage11 }}>
                          • {selectedAgent.taskCount} tasks completed
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                  {getStatusBadge(selectedAgent.status)}
                </Flex>
              </Box>

              {/* Chat Messages */}
              <Box style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: sand.sand2 }}>
                <Flex direction="column" gap="3">
                  {selectedAgent.messages.map((message) => (
                    <Box key={message.id}>
                      {message.action ? (
                        // Action Display
                        <Box
                          style={{
                            padding: "1rem",
                            borderRadius: "10px",
                            background: "#FFFEFB",
                            border: `1px solid ${sand.sand6}`,
                          }}
                        >
                          <Flex align="start" gap="2">
                            <Box
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "#F0EDE5",
                                color: "#4A4637",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {getActionIcon(message.action.type)}
                            </Box>
                            <Box style={{ flex: 1 }}>
                              <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>
                                {message.action.description}
                              </Text>
                              <Text size="1" style={{ color: sand.sand11 }}>
                                {message.action.timestamp}
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      ) : (
                        // Regular Message
                        <Flex
                          justify={message.role === "user" ? "end" : "start"}
                          gap="2"
                        >
                          {message.role === "agent" && (
                            <Avatar
                              size="1"
                              radius="full"
                              color="gray"
                              fallback={selectedAgent.name.charAt(0)}
                              style={{ flexShrink: 0 }}
                            />
                          )}
                          <Box
                            style={{
                              maxWidth: "70%",
                              padding: "0.75rem 1rem",
                              borderRadius: "14px",
                              background: message.role === "user" ? sand.sand3 : sand.sand1,
                              color: "#1A1C11",
                              border: `1px solid ${sand.sand4}`,
                            }}
                          >
                            <Text size="2">{message.content}</Text>
                            <Text
                              size="1"
                              style={{
                                display: "block",
                                marginTop: "0.25rem",
                                opacity: 0.6,
                              }}
                            >
                              {message.timestamp}
                            </Text>
                          </Box>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </Flex>
              </Box>

              {/* Message Input */}
              <Box style={{ borderTop: `1px solid ${sand.sand4}`, background: sand.sand1, padding: "1rem" }}>
                <Flex gap="2">
                  <TextField.Root
                    placeholder="Message agent..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    size="3"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    variant="solid"
                    color="lime"
                    size="3"
                  >
                    <Send size={16} />
                  </Button>
                </Flex>
              </Box>
            </Card>
          ) : (
            <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: sand.sand1 }}>
              <Box style={{ textAlign: "center", padding: "3rem" }}>
                <Bot size={48} color={sand.sand11} style={{ margin: "0 auto 1rem" }} />
                <Text size="4" weight="medium" style={{ display: "block", color: sand.sand12, marginBottom: "0.5rem" }}>
                  No agent selected
                </Text>
                <Text size="2" style={{ color: sand.sand11 }}>
                  Select an agent from the list to start chatting
                </Text>
              </Box>
            </Card>
          )}
        </Flex>
      </Flex>
    </DashboardLayout>
  );
}
