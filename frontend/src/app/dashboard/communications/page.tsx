"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, TextArea, Dialog, Tabs, Avatar, Separator } from "@radix-ui/themes";
import { sage, lime, gray, sand } from "@radix-ui/colors";
import {
  Search,
  Send,
  MessageSquare,
  Plus,
  Star,
  Archive,
  Reply,
  MoreVertical,
  Paperclip,
  ArrowLeft,
  FileText,
  ExternalLink,
  Share2,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Message {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  toEmail: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  hasAttachment?: boolean;
  attachmentType?: "contract" | "image" | "document";
}

interface Conversation {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorEmail: string;
  creatorAvatar: string;
  followers: string;
  status: "pending" | "responded" | "partnered" | "declined";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isStarred: boolean;
  messages: Message[];
  relatedReel?: string;
  relatedProducts?: string[];
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    creatorName: "Sarah Chen",
    creatorHandle: "@teawithsarah",
    creatorEmail: "sarah@teawithsarah.com",
    creatorAvatar: "/cooking-channel-avatar.jpg",
    followers: "125K",
    status: "responded",
    lastMessage: "I'd love to feature your ceremonial matcha in my morning routine videos!",
    lastMessageTime: "2 hours ago",
    unreadCount: 2,
    isStarred: true,
    relatedReel: "My Morning Matcha Ritual (Life-Changing)",
    relatedProducts: ["MATCHA MATCHA Can", "MATCHA MATCHA Bamboo Whisk"],
    messages: [
      {
        id: "1-1",
        from: "Maatchaa",
        fromEmail: "partnerships@matchamatcha.ca",
        to: "Sarah Chen",
        toEmail: "sarah@teawithsarah.com",
        subject: "Partnership Opportunity - Premium Matcha Products",
        body: "Hi Sarah,\n\nWe came across your video 'My Morning Matcha Ritual (Life-Changing)' and were really impressed with your authentic approach to tea ceremony.\n\nWe'd love to partner with you to feature our ceremonial grade matcha and traditional tools in your content. We offer:\n\n• 15% commission on all sales through your affiliate link\n• Complimentary product samples (MATCHA MATCHA Can, Bamboo Whisk, Sifter)\n• Creative freedom in how you showcase the products\n\nWould you be interested in discussing this further?\n\nBest regards,\nThe Maatchaa Team",
        timestamp: "3 days ago",
        isRead: true,
      },
      {
        id: "1-2",
        from: "Sarah Chen",
        fromEmail: "sarah@teawithsarah.com",
        to: "Maatchaa",
        toEmail: "partnerships@matchamatcha.ca",
        subject: "Re: Partnership Opportunity - Premium Matcha Products",
        body: "Hi there!\n\nThank you so much for reaching out! I'm definitely interested. Your matcha looks incredible and would be perfect for my audience.\n\nCould you send me more details about:\n1. Product specifications and sourcing\n2. Timeline expectations\n3. Contract terms\n\nI'd love to feature authentic, high-quality matcha from Kyoto!\n\nBest,\nSarah",
        timestamp: "2 days ago",
        isRead: true,
      },
      {
        id: "1-3",
        from: "Maatchaa",
        fromEmail: "partnerships@matchamatcha.ca",
        to: "Sarah Chen",
        toEmail: "sarah@teawithsarah.com",
        subject: "Re: Partnership Opportunity - Premium Matcha Products",
        body: "Hi Sarah,\n\nGreat to hear you're interested! Here are the details:\n\n**Product Details:**\n- MATCHA MATCHA Can: Handcrafted ceremonial grade, stone-milled in Kyoto ($32)\n- MATCHA MATCHA Bamboo Whisk: Traditional 100-tine chasen ($18)\n- MATCHA MATCHA Sifter: Stainless steel mesh for smooth preparation ($16)\n\n**Timeline:**\n- We'd love to see content within the next 3-4 weeks\n- 90-day initial partnership term\n\n**Commission:**\n- 15% on all sales through your unique link\n- Monthly payouts (minimum $50 threshold)\n\nI've attached our standard partnership contract for your review. Let me know if you have any questions!\n\nBest,\nThe Maatchaa Team",
        timestamp: "2 days ago",
        isRead: true,
        hasAttachment: true,
        attachmentType: "contract",
      },
      {
        id: "1-4",
        from: "Sarah Chen",
        fromEmail: "sarah@teawithsarah.com",
        to: "Maatchaa",
        toEmail: "partnerships@matchamatcha.ca",
        subject: "Re: Partnership Opportunity - Premium Matcha Products",
        body: "I'd love to feature your ceremonial matcha in my morning routine videos! The sourcing from Kyoto is exactly what my audience appreciates. I'll review the contract and get back to you by tomorrow.\n\nCould you also send me the affiliate link so I have it ready?",
        timestamp: "2 hours ago",
        isRead: false,
      },
    ],
  },
  {
    id: "2",
    creatorName: "Alex Tanaka",
    creatorHandle: "@mindfulmixology",
    creatorEmail: "alex@mindfulmixology.com",
    creatorAvatar: "/fitness-channel-avatar.jpg",
    followers: "89K",
    status: "partnered",
    lastMessage: "Just posted the video! The matcha whisk works perfectly.",
    lastMessageTime: "1 day ago",
    unreadCount: 0,
    isStarred: false,
    relatedReel: "Why I Switched to Ceremonial Grade Matcha",
    relatedProducts: ["Horii Shichimeien Matcha Can", "Electric Matcha Whisk Gun"],
    messages: [
      {
        id: "2-1",
        from: "Maatchaa",
        fromEmail: "partnerships@matchamatcha.ca",
        to: "Alex Tanaka",
        toEmail: "alex@mindfulmixology.com",
        subject: "Partnership Opportunity - Premium Matcha Tools",
        body: "Hi Alex,\n\nLoved your 'Why I Switched to Ceremonial Grade Matcha' video! We'd love to partner with you to feature our Horii Shichimeien matcha and Electric Matcha Whisk Gun.\n\nInterested in discussing?\n\nBest,\nMaatchaa",
        timestamp: "2 weeks ago",
        isRead: true,
      },
      {
        id: "2-2",
        from: "Alex Tanaka",
        fromEmail: "alex@mindfulmixology.com",
        to: "Maatchaa",
        toEmail: "partnerships@matchamatcha.ca",
        subject: "Re: Partnership Opportunity - Premium Matcha Tools",
        body: "Just posted the video! The matcha whisk works perfectly. The response has been amazing so far. Looking forward to seeing the analytics!\n\nAlex",
        timestamp: "1 day ago",
        isRead: true,
      },
    ],
  },
  {
    id: "3",
    creatorName: "Emma Lifestyle",
    creatorHandle: "@emmalifestyle",
    creatorEmail: "contact@emmalifestyle.com",
    creatorAvatar: "/tech-channel-avatar.png",
    followers: "234K",
    status: "pending",
    lastMessage: "We'd love to partner with you to feature our Le Labo collection...",
    lastMessageTime: "3 days ago",
    unreadCount: 0,
    isStarred: false,
    relatedReel: "Bougie Morning Routine Essentials",
    relatedProducts: ["Bougie Candle by Le Labo", "Hand Lotion by Le Labo"],
    messages: [
      {
        id: "3-1",
        from: "Maatchaa",
        fromEmail: "partnerships@matchamatcha.ca",
        to: "Emma Lifestyle",
        toEmail: "contact@emmalifestyle.com",
        subject: "Partnership Opportunity - Le Labo Collection",
        body: "Hi Emma,\n\nWe'd love to partner with you to feature our curated Le Labo collection (Bougie Candle, Hand Lotion, Hand Soap) in your luxury lifestyle content.\n\nLet us know if you're interested!\n\nBest,\nMaatchaa",
        timestamp: "3 days ago",
        isRead: true,
      },
    ],
  },
];

export default function CommunicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Business email from Shopify settings (would be fetched from backend)
  const businessEmail = "partnerships@matchamatcha.ca";
  const businessName = "Maatchaa";

  const filteredConversations = mockConversations.filter((conversation) => {
    const matchesSearch =
      conversation.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.creatorHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.creatorEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || conversation.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const neutral = (
      <Badge size="1" variant="soft" color="gray">
        {status === "responded" ? "Responded" : status === "partnered" ? "Partnered" : "Unknown"}
      </Badge>
    );

    switch (status) {
      case "responded":
        return neutral;
      case "partnered":
        return neutral;
      case "pending":
        return (
          <Badge size="1" variant="soft" color="yellow">
            Pending
          </Badge>
        );
      case "declined":
        return (
          <Badge size="1" variant="soft" color="red">
            Declined
          </Badge>
        );
      default:
        return neutral;
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversation) return;

    // Would send email via backend here
    console.log("Sending reply:", {
      to: selectedConversation.creatorEmail,
      from: businessEmail,
      body: replyText,
    });

    setReplyText("");
    alert("Message sent successfully!");
  };

  return (
    <DashboardLayout>
      <Flex direction="column" gap="4" style={{ height: "calc(100vh - 100px)" }}>
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: "sage.sage12" }}>
              Communications
            </Text>
            <Text size="2" style={{ color: "sage.sage11", marginTop: "0.25rem", display: "block" }}>
              All conversations from {businessEmail}
            </Text>
          </Box>

          <Dialog.Root open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <Dialog.Trigger>
              <Button style={{ background: "lime.lime9", color: "#000" }}>
                <Plus size={16} />
                New Message
              </Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: "600px" }}>
              <Dialog.Title>Compose New Message</Dialog.Title>
              <Dialog.Description size="2" mb="4">
                Send a message to a creator
              </Dialog.Description>

              <Flex direction="column" gap="3">
                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>From:</Text>
                  <TextField.Root value={businessEmail} readOnly style={{ background: "sage.sage3" }} />
                </Box>
                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>To:</Text>
                  <TextField.Root placeholder="creator@email.com" />
                </Box>
                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>Subject:</Text>
                  <TextField.Root placeholder="Partnership Opportunity" />
                </Box>
                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>Message:</Text>
                  <TextArea placeholder="Hi there..." rows={10} />
                </Box>

                <Flex gap="2" justify="end" mt="2">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Dialog.Close>
                  <Button style={{ background: "lime.lime9", color: "#000" }}>
                    <Send size={16} />
                    Send Message
                  </Button>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>


        {/* Split Pane Layout */}
        <Flex gap="4" style={{ flex: 1, overflow: "hidden" }}>
          {/* Left Sidebar - Conversation List */}
          <Card
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Filters */}
            <Tabs.Root value={selectedStatus} onValueChange={setSelectedStatus}>
              <Tabs.List size="1">
                <Tabs.Trigger value="all">All</Tabs.Trigger>
                <Tabs.Trigger value="pending">Pending</Tabs.Trigger>
                <Tabs.Trigger value="responded">Replied</Tabs.Trigger>
                <Tabs.Trigger value="partnered">Active</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            {/* Search */}
            <Box style={{ position: "relative", margin: "1rem 0" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: sand.sand11,
                }}
              />
              <TextField.Root
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "32px" }}
                size="2"
              />
            </Box>

            {/* Conversation List */}
            <Flex direction="column" gap="1" style={{ flex: 1, overflowY: "auto" }}>
              {filteredConversations.map((conversation) => (
                <Box
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                  }}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    background: selectedConversation?.id === conversation.id ? sand.sand3 : "transparent",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <Flex align="start" gap="2">
                    <Avatar
                      size="2"
                      src={conversation.creatorAvatar}
                      fallback={conversation.creatorName.charAt(0)}
                      radius="full"
                      color="gray"
                    />
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Flex align="center" justify="between" mb="1">
                        <Text size="2" weight="medium" style={{
                          color: conversation.unreadCount > 0 ? "#000" : "sage.sage12",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {conversation.creatorName}
                        </Text>
                        {conversation.isStarred && <Star size={12} fill="#F59E0B" color="#F59E0B" />}
                      </Flex>
                      <Text size="1" style={{ color: "sage.sage11", display: "block", marginBottom: "0.25rem" }}>
                        {conversation.creatorHandle}
                      </Text>
                      <Text
                        size="1"
                        style={{
                          color: "sage.sage11",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                        }}
                      >
                        {conversation.lastMessage}
                      </Text>
                      <Flex align="center" justify="between" mt="1">
                        <Text size="1" style={{ color: "sage.sage11" }}>
                          {conversation.lastMessageTime}
                        </Text>
                        {conversation.unreadCount > 0 && (
                          <Badge color="gray" size="1">{conversation.unreadCount}</Badge>
                        )}
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Flex>
          </Card>

          {/* Right Panel - Conversation Thread */}
          {selectedConversation ? (
            <Card
              style={{
                flex: 1,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Thread Header */}
              <Box p="4" style={{ borderBottom: `1px solid ${sand.sand4}` }}>
                <Flex align="center" justify="between">
                  <Flex align="center" gap="3">
                    <Avatar
                      size="3"
                      src={selectedConversation.creatorAvatar}
                      fallback={selectedConversation.creatorName.charAt(0)}
                      radius="full"
                      color="gray"
                    />
                    <Box>
                      <Text size="3" weight="medium" style={{ display: "block" }}>
                        {selectedConversation.creatorName}
                      </Text>
                      <Text size="1" style={{ color: "sage.sage11" }}>
                        {selectedConversation.creatorEmail} • {selectedConversation.followers} followers
                      </Text>
                    </Box>
                  </Flex>
                  <Flex gap="2">
                    {getStatusBadge(selectedConversation.status)}
                    <Button variant="ghost" size="2" style={{ color: sand.sand11 }}>
                      <Star size={16} fill={selectedConversation.isStarred ? "#F59E0B" : "none"} color={selectedConversation.isStarred ? "#F59E0B" : sand.sand11} strokeWidth={1.5} />
                    </Button>
                    <Button variant="ghost" size="2" style={{ color: sand.sand11 }}>
                      <Archive size={16} strokeWidth={1.5} />
                    </Button>
                    <Button variant="ghost" size="2" style={{ color: sand.sand11 }}>
                      <MoreVertical size={16} />
                    </Button>
                  </Flex>
                </Flex>

                {/* Context Info */}
                {selectedConversation.relatedReel && (
                  <Box mt="3" p="2" style={{ background: sand.sand2, borderRadius: "8px", border: `1px solid ${sand.sand4}` }}>
                    <Flex align="center" justify="between">
                      <Flex direction="column" gap="1" style={{ flex: 1 }}>
                        <Flex align="center" gap="2">
                          <MessageSquare size={14} color={sand.sand11} />
                          <Text size="1" style={{ color: "sage.sage11" }}>
                            Related to reel: <strong>{selectedConversation.relatedReel}</strong>
                          </Text>
                        </Flex>
                        {selectedConversation.relatedProducts && (
                          <Flex gap="1">
                            {selectedConversation.relatedProducts.map(product => (
                              <Badge key={product} size="1" variant="soft" color="blue">{product}</Badge>
                            ))}
                          </Flex>
                        )}
                      </Flex>
                      <Button size="1" variant="solid" color="lime">
                        <Share2 size={14} />
                        View Reel
                      </Button>
                    </Flex>
                  </Box>
                )}
              </Box>

              {/* Messages Thread */}
              <Box style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: sand.sand2 }}>
                <Flex direction="column" gap="0">
                  {selectedConversation.messages.map((message, index) => {
                    const isFromBusiness = message.from === businessName;

                    return (
                      <Box
                        key={message.id}
                        style={{
                          background: "#FFFEFB",
                          borderBottom: `1px solid ${sand.sand4}`,
                          padding: "1.5rem",
                        }}
                      >
                        {/* Email Header - Like Gmail */}
                        <Flex direction="column" gap="2" mb="3">
                          {/* Subject Line (first email only) */}
                          {index === 0 && (
                            <Text size="4" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
                              {message.subject}
                            </Text>
                          )}

                          {/* From/To Header */}
                          <Flex align="start" justify="between">
                            <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                              <Avatar
                                size="2"
                                src={isFromBusiness ? "/placeholder-logo.svg" : selectedConversation.creatorAvatar}
                                fallback={message.from.charAt(0)}
                                radius="full"
                                color="gray"
                              />
                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                                  <Text size="2" weight="medium" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {message.from}
                                  </Text>
                                </Flex>
                                <Text size="1" style={{ color: "sage.sage11", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  to {message.to}
                                </Text>
                              </Box>
                            </Flex>
                            <Text size="1" style={{ color: "sage.sage11", whiteSpace: "nowrap", marginLeft: "1rem" }}>
                              {message.timestamp}
                            </Text>
                          </Flex>
                        </Flex>

                        {/* Email Body - Plain text, no bubble */}
                        <Box
                          style={{
                            paddingLeft: "3rem", // Indent from avatar
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                          }}
                        >
                          <Text size="2" style={{ color: "sage.sage12" }}>
                            {message.body}
                          </Text>

                          {message.hasAttachment && (
                            <Flex
                              align="center"
                              gap="2"
                              mt="3"
                              p="2"
                              style={{
                                background: sand.sand2,
                                borderRadius: "6px",
                                border: `1px solid ${sand.sand4}`,
                                width: "fit-content"
                              }}
                            >
                              <FileText size={16} color={sand.sand11} />
                              <Text size="1" style={{ color: "sage.sage11" }}>
                                {message.attachmentType === "contract" ? "Partnership_Contract.pdf" : "Attachment"}
                              </Text>
                              <Button size="1" variant="ghost" style={{ color: sand.sand11 }}>
                                <ExternalLink size={12} />
                              </Button>
                            </Flex>
                          )}
                        </Box>

                        {/* Reply/Forward Actions (on hover) */}
                        {index === selectedConversation.messages.length - 1 && (
                          <Flex gap="2" mt="3" style={{ paddingLeft: "3rem" }}>
                            <Button size="1" variant="soft" color="gray">
                              <Reply size={14} />
                              Reply
                            </Button>
                            <Button size="1" variant="soft" color="gray">
                              <ArrowLeft size={14} />
                              Forward
                            </Button>
                          </Flex>
                        )}
                      </Box>
                    );
                  })}
                </Flex>
              </Box>

              {/* Reply Box - Email Composer Style */}
              <Box style={{ borderTop: `1px solid ${sand.sand4}`, background: "#FFFFFF" }}>
                <Box p="4">
                  <Flex direction="column" gap="3">
                    {/* Email Body */}
                    <textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={6}
                      style={{
                        width: "100%",
                        resize: "vertical",
                        fontFamily: "var(--font-satoshi), system-ui, sans-serif",
                        fontSize: "14px",
                        border: "1px solid #D4D7C7",
                        borderRadius: "8px",
                        padding: "1rem",
                        background: "#FFFFFF",
                        color: "#1F2611",
                      }}
                    />

                    {/* Actions */}
                    <Flex align="center" justify="between">
                      <Flex gap="2">
                        <Button variant="soft" size="2" color="gray">
                          <Paperclip size={16} />
                          Attach
                        </Button>
                        <Button variant="soft" size="2" color="gray">
                          <FileText size={16} />
                          Contract
                        </Button>
                      </Flex>
                      <Flex gap="2">
                        <Button variant="soft" size="2" color="gray" onClick={() => setReplyText("")}>
                          Discard
                        </Button>
                        <Button
                          variant="solid"
                          size="2"
                          color="lime"
                          onClick={handleSendReply}
                          disabled={!replyText.trim()}
                        >
                          <Send size={16} />
                          Send Email
                        </Button>
                      </Flex>
                    </Flex>
                  </Flex>
                </Box>
              </Box>
            </Card>
          ) : (
            <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box style={{ textAlign: "center", padding: "3rem" }}>
                <MessageSquare size={48} color={sand.sand11} style={{ margin: "0 auto 1rem" }} />
                <Text size="4" weight="medium" style={{ display: "block", color: sand.sand12, marginBottom: "0.5rem" }}>
                  No conversation selected
                </Text>
                <Text size="2" style={{ color: sand.sand11 }}>
                  Select a conversation from the list to view messages
                </Text>
              </Box>
            </Card>
          )}
        </Flex>
      </Flex>
    </DashboardLayout>
  );
}
