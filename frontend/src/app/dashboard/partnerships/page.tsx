"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Tabs, Badge, Button, Dialog, TextField, TextArea, Checkbox } from "@radix-ui/themes";
import {
  Users,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  FileText,
  Link as LinkIcon,
  Search,
  ExternalLink,
  TrendingUp,
  Send,
  Copy,
  Download,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Partnership {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  videoTitle: string;
  videoThumbnail: string;
  videoUrl: string;
  status: "to_contact" | "contacted" | "in_discussion" | "active" | "closed";
  matchedProducts: string[];
  views: number;
  likes: number;
  comments: number;
  initiatedDate: string;
  responseDate?: string;
  contractDrafted?: boolean;
  contractSent?: boolean;
  contractSigned?: boolean;
  affiliateLinkGenerated?: boolean;
  affiliateLink?: string;
  performanceMetrics?: {
    clicks: number;
    sales: number;
    revenue: number;
    postsCompleted: number;
    postsRequired: number;
  };
}

const mockPartnerships: Partnership[] = [
  {
    id: "1",
    creatorName: "Sarah Johnson",
    creatorHandle: "@cookingwithsarah",
    creatorAvatar: "/cooking-channel-avatar.jpg",
    videoTitle: "5 Kitchen Gadgets That Changed My Life",
    videoThumbnail: "/youtube-shorts-cooking-video.jpg",
    videoUrl: "https://youtube.com/shorts/example1",
    status: "active",
    matchedProducts: ["Smart Kitchen Scale", "Silicone Spatula Set"],
    views: 1200000,
    likes: 45000,
    comments: 2300,
    initiatedDate: "45 days ago",
    contractSigned: true,
    affiliateLinkGenerated: true,
    affiliateLink: "https://matchamatcha.ca/ref/cookingwithsarah?pid=1",
    performanceMetrics: {
      clicks: 342,
      sales: 28,
      revenue: 1247.50,
      postsCompleted: 3,
      postsRequired: 5,
    },
  },
  {
    id: "2",
    creatorName: "Mike Chen",
    creatorHandle: "@fitlifemike",
    creatorAvatar: "/fitness-channel-avatar.jpg",
    videoTitle: "Morning Workout Routine",
    videoThumbnail: "/fitness-workout-video.png",
    videoUrl: "https://youtube.com/shorts/example2",
    status: "to_contact",
    matchedProducts: ["Yoga Mat", "Resistance Bands"],
    views: 850000,
    likes: 32000,
    comments: 1800,
    initiatedDate: "5 hours ago",
  },
  {
    id: "3",
    creatorName: "Alex Rivera",
    creatorHandle: "@techreviewalex",
    creatorAvatar: "/tech-channel-avatar.png",
    videoTitle: "This Phone Case is INSANE!",
    videoThumbnail: "/tech-review-video.jpg",
    videoUrl: "https://youtube.com/shorts/example3",
    status: "in_discussion",
    matchedProducts: ["Phone Case"],
    views: 650000,
    likes: 28000,
    comments: 1200,
    initiatedDate: "3 days ago",
    contractDrafted: true,
    contractSent: false,
    contractSigned: false,
    affiliateLinkGenerated: true,
  },
  {
    id: "4",
    creatorName: "Emma Davis",
    creatorHandle: "@homedecoremma",
    creatorAvatar: "/home-channel-avatar.jpg",
    videoTitle: "Budget-Friendly Home Upgrades",
    videoThumbnail: "/home-decor-video.jpg",
    videoUrl: "https://youtube.com/shorts/example4",
    status: "contacted",
    matchedProducts: ["LED Strip Lights"],
    views: 420000,
    likes: 15000,
    comments: 800,
    initiatedDate: "2 days ago",
  },
];

export default function PartnershipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showAffiliateDialog, setShowAffiliateDialog] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [contractLatex, setContractLatex] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");

  const filteredPartnerships = mockPartnerships.filter((partnership) => {
    const matchesSearch =
      partnership.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnership.creatorHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partnership.videoTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === "all" || partnership.status === selectedTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockPartnerships.length,
    toContact: mockPartnerships.filter((p) => p.status === "to_contact").length,
    contacted: mockPartnerships.filter((p) => p.status === "contacted").length,
    inDiscussion: mockPartnerships.filter((p) => p.status === "in_discussion").length,
    active: mockPartnerships.filter((p) => p.status === "active").length,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: Partnership["status"]) => {
    switch (status) {
      case "to_contact":
        return (
          <Badge color="blue">
            <Mail size={12} />
            To Contact
          </Badge>
        );
      case "contacted":
        return (
          <Badge color="yellow">
            <Clock size={12} />
            Contacted
          </Badge>
        );
      case "in_discussion":
        return (
          <Badge color="orange">
            <FileText size={12} />
            In Discussion
          </Badge>
        );
      case "active":
        return (
          <Badge color="green">
            <CheckCircle size={12} />
            Active
          </Badge>
        );
      case "closed":
        return (
          <Badge color="gray">
            <XCircle size={12} />
            Closed
          </Badge>
        );
    }
  };

  const handleDraftEmail = (partnership: Partnership) => {
    setSelectedPartnership(partnership);

    const email = `Hi ${partnership.creatorName},

We loved your video "${partnership.videoTitle}" and think it would be a perfect fit for our products!

We'd love to partner with you to feature our ${partnership.matchedProducts.join(", ")} in your content.

What we offer:
• 15% commission on all sales through your affiliate link
• Free product samples
• Flexible content requirements

Interested? Let's discuss the details!

Best,
The Maatchaa Team`;

    setGeneratedEmail(email);
    setShowEmailDialog(true);
  };

  const handleDraftContract = (partnership: Partnership) => {
    setSelectedPartnership(partnership);

    // LaTeX contract template
    const latex = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}

\\begin{document}

\\begin{center}
\\Large\\textbf{PARTNERSHIP AGREEMENT}
\\end{center}

\\vspace{1em}

This Partnership Agreement (``Agreement'') is entered into as of ${new Date().toLocaleDateString()} between:

\\vspace{0.5em}

\\textbf{MATCHAA} (``Business'') \\\\
and \\\\
\\textbf{${partnership.creatorName}} (``Creator'')

\\vspace{1em}

\\section*{1. SCOPE OF WORK}

Creator agrees to feature the following products in their content:

\\begin{itemize}
${partnership.matchedProducts.map(p => `  \\item ${p}`).join('\n')}
\\end{itemize}

\\section*{2. COMPENSATION}

\\begin{itemize}
  \\item Commission: 15\\% of sales generated through affiliate link
  \\item Payment Terms: Net 30 days
  \\item Minimum threshold: \\$50
\\end{itemize}

\\section*{3. CONTENT REQUIREMENTS}

\\begin{itemize}
  \\item Natural product integration in Creator's content
  \\item Disclosure of sponsored content per FTC guidelines
  \\item Minimum 5 content pieces featuring products during term
  \\item Creator retains creative control over content style
\\end{itemize}

\\section*{4. AFFILIATE TRACKING}

\\begin{itemize}
  \\item Unique affiliate link provided: \\texttt{${partnership.affiliateLink || 'To be generated'}}
  \\item Creator must use this link for all product references
  \\item Sales tracked automatically through link
\\end{itemize}

\\section*{5. TERM}

This agreement is effective for 90 days from the date of signing and may be renewed by mutual agreement.

\\section*{6. TERMINATION}

Either party may terminate with 14 days written notice. Creator will receive commission on sales generated prior to termination date.

\\vspace{2em}

By signing below, both parties agree to the terms outlined above.

\\vspace{2em}

\\noindent
\\begin{tabular}{@{}p{2.5in}@{}p{2.5in}@{}}
\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_ & \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_ \\\\
Business Signature & Creator Signature \\\\[1em]
Date: ${new Date().toLocaleDateString()} & Date: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_
\\end{tabular}

\\end{document}`;

    setContractLatex(latex);
    setShowContractDialog(true);
  };

  const handleGenerateAffiliateLink = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
    const link = `https://matchamatcha.ca/ref/${partnership.creatorHandle.replace("@", "")}?pid=${partnership.id}`;
    setAffiliateLink(link);
    setShowAffiliateDialog(true);
  };

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Box>
          <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
            Partnerships
          </Text>
          <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
            Manage creator collaborations through the entire lifecycle
          </Text>
        </Box>

        {/* Stats Cards with colored subtext */}
        <Flex gap="4" wrap="wrap">
          {[
            { title: "Total Matches", value: stats.total, subtext: "+3 this week", color: "#10B981" },
            { title: "To Contact", value: stats.toContact, subtext: "Need outreach", color: "#737373" },
            { title: "In Discussion", value: stats.inDiscussion, subtext: "Negotiating terms", color: "#F59E0B" },
            { title: "Active Partnerships", value: stats.active, subtext: "+1 new", color: "#10B981" },
          ].map((stat) => (
            <Card
              key={stat.title}
              style={{
                flex: "1 1 calc(25% - 1rem)",
                minWidth: "220px",
                padding: "1.25rem",
              }}
            >
              <Flex direction="column" gap="2">
                <Text size="2" style={{ color: "#737373" }}>
                  {stat.title}
                </Text>
                <Text size="7" weight="bold" style={{ color: "#000" }}>
                  {stat.value}
                </Text>
                <Text size="1" style={{ color: stat.color }}>
                  {stat.subtext}
                </Text>
              </Flex>
            </Card>
          ))}
        </Flex>

        {/* Partnerships List */}
        <Card
          style={{
            padding: "1.5rem",
          }}
        >
          {/* Search and Tabs */}
          <Flex direction="column" gap="4" mb="4">
            <Flex align="center" justify="between">
              <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>
                All Matches
              </Text>
              <Box style={{ position: "relative", width: "240px" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#737373",
                    pointerEvents: "none",
                  }}
                />
                <TextField.Root
                  placeholder="Search partnerships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: "36px",
                  }}
                />
              </Box>
            </Flex>

            <Tabs.Root value={selectedTab} onValueChange={setSelectedTab}>
              <Tabs.List>
                <Tabs.Trigger value="all">All ({stats.total})</Tabs.Trigger>
                <Tabs.Trigger value="to_contact">To Contact ({stats.toContact})</Tabs.Trigger>
                <Tabs.Trigger value="contacted">Contacted ({stats.contacted})</Tabs.Trigger>
                <Tabs.Trigger value="in_discussion">In Discussion ({stats.inDiscussion})</Tabs.Trigger>
                <Tabs.Trigger value="active">Active ({stats.active})</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Flex>

          {/* Partnership Cards */}
          <Flex direction="column" gap="3">
            {filteredPartnerships.map((partnership) => (
              <Card
                key={partnership.id}
                p="4"
                style={{
                  border: "1px solid #F5F5F5",
                  borderRadius: "8px",
                }}
              >
                <Flex gap="4" align="start">
                  {/* Creator Info */}
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="2">
                        <Text size="3" weight="bold" style={{ color: "#1A1A1A" }}>
                          {partnership.creatorName}
                        </Text>
                        <Text size="2" style={{ color: "#737373" }}>
                          {partnership.creatorHandle}
                        </Text>
                      </Flex>
                      {getStatusBadge(partnership.status)}
                    </Flex>

                    <Text size="2" style={{ color: "#1A1A1A" }}>
                      {partnership.videoTitle}
                    </Text>

                    <Flex gap="4" align="center">
                      <Flex align="center" gap="1">
                        <Eye size={14} color="#737373" />
                        <Text size="1" style={{ color: "#737373" }}>
                          {formatNumber(partnership.views)}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <Heart size={14} color="#737373" />
                        <Text size="1" style={{ color: "#737373" }}>
                          {formatNumber(partnership.likes)}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="1">
                        <MessageCircle size={14} color="#737373" />
                        <Text size="1" style={{ color: "#737373" }}>
                          {formatNumber(partnership.comments)}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex gap="1" wrap="wrap">
                      {partnership.matchedProducts.map((product) => (
                        <Badge key={product} variant="soft" size="1">
                          {product}
                        </Badge>
                      ))}
                    </Flex>

                    {/* In Discussion - Show Checklist */}
                    {partnership.status === "in_discussion" && (
                      <Box
                        mt="2"
                        style={{
                          background: "#F9FAFB",
                          padding: "0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #F5F5F5",
                        }}
                      >
                        <Text size="2" weight="medium" mb="2" style={{ display: "block", color: "#1A1A1A" }}>
                          Progress Checklist
                        </Text>
                        <Flex direction="column" gap="1">
                          <Flex align="center" gap="2">
                            <CheckCircle size={14} color={partnership.contractDrafted ? "#10B981" : "#D1D5DB"} />
                            <Text size="1" style={{ color: partnership.contractDrafted ? "#10B981" : "#737373" }}>
                              Contract drafted
                            </Text>
                          </Flex>
                          <Flex align="center" gap="2">
                            <CheckCircle size={14} color={partnership.contractSent ? "#10B981" : "#D1D5DB"} />
                            <Text size="1" style={{ color: partnership.contractSent ? "#10B981" : "#737373" }}>
                              Contract sent to creator
                            </Text>
                          </Flex>
                          <Flex align="center" gap="2">
                            <CheckCircle size={14} color={partnership.affiliateLinkGenerated ? "#10B981" : "#D1D5DB"} />
                            <Text size="1" style={{ color: partnership.affiliateLinkGenerated ? "#10B981" : "#737373" }}>
                              Affiliate link generated
                            </Text>
                          </Flex>
                          <Flex align="center" gap="2">
                            <CheckCircle size={14} color={partnership.contractSigned ? "#10B981" : "#D1D5DB"} />
                            <Text size="1" style={{ color: partnership.contractSigned ? "#10B981" : "#737373" }}>
                              Contract signed by creator
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    )}

                    {/* Active - Show Performance */}
                    {partnership.status === "active" && partnership.performanceMetrics && (
                      <Box
                        mt="2"
                        p="3"
                        style={{
                          background: "#F0FDF4",
                          borderRadius: "6px",
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <Flex align="center" justify="between" mb="2">
                          <Text size="2" weight="medium" style={{ color: "#1A1A1A" }}>
                            Performance
                          </Text>
                          <Text size="1" style={{ color: "#10B981" }}>
                            Running for {partnership.initiatedDate}
                          </Text>
                        </Flex>
                        <Flex gap="4">
                          <Box>
                            <Text size="1" style={{ color: "#737373", display: "block" }}>Clicks</Text>
                            <Text size="3" weight="bold" style={{ color: "#000" }}>{partnership.performanceMetrics.clicks}</Text>
                          </Box>
                          <Box>
                            <Text size="1" style={{ color: "#737373", display: "block" }}>Sales</Text>
                            <Text size="3" weight="bold" style={{ color: "#000" }}>{partnership.performanceMetrics.sales}</Text>
                          </Box>
                          <Box>
                            <Text size="1" style={{ color: "#737373", display: "block" }}>Revenue</Text>
                            <Text size="3" weight="bold" style={{ color: "#10B981" }}>
                              ${partnership.performanceMetrics.revenue.toFixed(2)}
                            </Text>
                          </Box>
                          <Box>
                            <Text size="1" style={{ color: "#737373", display: "block" }}>Posts</Text>
                            <Text size="3" weight="bold" style={{ color: "#000" }}>
                              {partnership.performanceMetrics.postsCompleted}/{partnership.performanceMetrics.postsRequired}
                            </Text>
                          </Box>
                        </Flex>
                      </Box>
                    )}
                  </Flex>

                  {/* Actions */}
                  <Flex direction="column" gap="2" style={{ minWidth: "180px" }}>
                    {partnership.status === "to_contact" && (
                      <>
                        <Button
                          size="2"
                          onClick={() => handleDraftEmail(partnership)}
                          style={{
                            background: "#B4D88B",
                            color: "#000",
                            fontWeight: 600,
                          }}
                        >
                          <Mail size={16} />
                          Draft Email
                        </Button>
                        <Button size="2" variant="outline" asChild>
                          <a href={partnership.videoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} />
                            View Video
                          </a>
                        </Button>
                      </>
                    )}

                    {partnership.status === "contacted" && (
                      <>
                        <Button size="2" variant="outline" asChild>
                          <Link href="/dashboard/communications">
                            <MessageSquare size={16} />
                            View Conversation
                          </Link>
                        </Button>
                        <Text size="1" style={{ color: "#737373", textAlign: "center" }}>
                          Sent {partnership.initiatedDate}
                        </Text>
                      </>
                    )}

                    {partnership.status === "in_discussion" && (
                      <>
                        <Button
                          size="2"
                          onClick={() => handleDraftContract(partnership)}
                          style={{
                            background: "#B4D88B",
                            color: "#000",
                            fontWeight: 600,
                          }}
                        >
                          <FileText size={16} />
                          Draft Contract
                        </Button>
                        <Button size="2" variant="outline" onClick={() => handleGenerateAffiliateLink(partnership)}>
                          <LinkIcon size={16} />
                          Generate Link
                        </Button>
                        <Button size="2" variant="outline" asChild>
                          <Link href="/dashboard/communications">
                            <MessageSquare size={16} />
                            Message Creator
                          </Link>
                        </Button>
                      </>
                    )}

                    {partnership.status === "active" && (
                      <>
                        <Button
                          size="2"
                          onClick={() => handleGenerateAffiliateLink(partnership)}
                          style={{
                            background: "#B4D88B",
                            color: "#000",
                            fontWeight: 600,
                          }}
                        >
                          <Copy size={16} />
                          Copy Affiliate Link
                        </Button>
                        <Button size="2" variant="outline" onClick={() => handleDraftContract(partnership)}>
                          <FileText size={16} />
                          View Contract
                        </Button>
                        <Button size="2" variant="outline" asChild>
                          <Link href="/dashboard/communications">
                            <MessageSquare size={16} />
                            Message Creator
                          </Link>
                        </Button>
                      </>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Card>
      </Flex>

      {/* Email Draft Dialog */}
      <Dialog.Root open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <Dialog.Content style={{ maxWidth: "600px" }}>
          <Dialog.Title>Draft Partnership Email</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Reach out to {selectedPartnership?.creatorName} to propose a partnership
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <Box>
              <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>
                To:
              </Text>
              <TextField.Root
                value={selectedPartnership?.creatorHandle || ""}
                readOnly
                style={{ background: "#F5F5F5" }}
              />
            </Box>

            <Box>
              <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Subject:
              </Text>
              <TextField.Root
                defaultValue="Partnership Opportunity with Maatchaa"
                style={{ background: "#F5F5F5" }}
              />
            </Box>

            <Box>
              <Text size="2" weight="medium" mb="1" style={{ display: "block" }}>
                Message:
              </Text>
              <TextArea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                rows={12}
                style={{ fontFamily: "monospace", fontSize: "13px" }}
              />
            </Box>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button style={{ background: "#B4D88B", color: "#000" }}>
                  <Send size={16} />
                  Send Email
                </Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Contract Dialog with LaTeX Preview */}
      <Dialog.Root open={showContractDialog} onOpenChange={setShowContractDialog}>
        <Dialog.Content style={{ maxWidth: "800px", maxHeight: "80vh" }}>
          <Dialog.Title>Partnership Contract</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {selectedPartnership?.status === "in_discussion"
              ? "Review and edit the contract before sending to creator"
              : "View partnership contract"}
          </Dialog.Description>

          <Tabs.Root defaultValue="preview">
            <Tabs.List>
              <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
              <Tabs.Trigger value="latex">LaTeX Source</Tabs.Trigger>
            </Tabs.List>

            <Box pt="3">
              <Tabs.Content value="preview">
                <Box
                  p="4"
                  style={{
                    background: "white",
                    border: "2px solid #E5E5E5",
                    borderRadius: "8px",
                    maxHeight: "500px",
                    overflowY: "auto",
                  }}
                >
                  <Text size="2" style={{ color: "#737373", marginBottom: "1rem", display: "block" }}>
                    Note: LaTeX rendering would happen here. For now, showing formatted preview.
                  </Text>
                  <Box style={{ fontFamily: "serif", lineHeight: 1.6 }}>
                    <Text size="6" weight="bold" style={{ display: "block", textAlign: "center", marginBottom: "1rem" }}>
                      PARTNERSHIP AGREEMENT
                    </Text>
                    <Text size="2" style={{ display: "block", marginBottom: "1rem" }}>
                      This Partnership Agreement is entered into as of {new Date().toLocaleDateString()} between:
                    </Text>
                    <Text size="2" weight="bold" style={{ display: "block" }}>MATCHAA ("Business")</Text>
                    <Text size="2" style={{ display: "block", marginBottom: "1rem" }}>and</Text>
                    <Text size="2" weight="bold" style={{ display: "block", marginBottom: "1rem" }}>
                      {selectedPartnership?.creatorName} ("Creator")
                    </Text>

                    <Text size="3" weight="bold" style={{ display: "block", marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                      1. SCOPE OF WORK
                    </Text>
                    <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                      Creator agrees to feature the following products:
                    </Text>
                    {selectedPartnership?.matchedProducts.map((product) => (
                      <Text key={product} size="2" style={{ display: "block", marginLeft: "1rem" }}>
                        • {product}
                      </Text>
                    ))}

                    <Text size="3" weight="bold" style={{ display: "block", marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                      2. COMPENSATION
                    </Text>
                    <Text size="2" style={{ display: "block", marginLeft: "1rem" }}>
                      • Commission: 15% of sales<br />
                      • Payment Terms: Net 30 days<br />
                      • Minimum threshold: $50
                    </Text>

                    <Text size="1" style={{ display: "block", marginTop: "3rem", color: "#737373" }}>
                      [Full contract continues...]
                    </Text>
                  </Box>
                </Box>
              </Tabs.Content>

              <Tabs.Content value="latex">
                <TextArea
                  value={contractLatex}
                  onChange={(e) => setContractLatex(e.target.value)}
                  rows={20}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    background: "#1E1E1E",
                    color: "#D4D4D4",
                  }}
                />
              </Tabs.Content>
            </Box>
          </Tabs.Root>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
            {selectedPartnership?.status === "in_discussion" && (
              <>
                <Button variant="outline">
                  <Download size={16} />
                  Download PDF
                </Button>
                <Button style={{ background: "#B4D88B", color: "#000" }}>
                  <Send size={16} />
                  Send to Creator
                </Button>
              </>
            )}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Affiliate Link Dialog */}
      <Dialog.Root open={showAffiliateDialog} onOpenChange={setShowAffiliateDialog}>
        <Dialog.Content style={{ maxWidth: "500px" }}>
          <Dialog.Title>Affiliate Link</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            {selectedPartnership?.affiliateLinkGenerated
              ? `Affiliate link for ${selectedPartnership?.creatorName}`
              : `Generate affiliate link for ${selectedPartnership?.creatorName}`}
          </Dialog.Description>

          <Box
            p="3"
            style={{
              background: "#F5F5F5",
              borderRadius: "8px",
              border: "1px solid #E5E5E5",
              fontFamily: "monospace",
              fontSize: "14px",
              wordBreak: "break-all",
            }}
          >
            {affiliateLink}
          </Box>

          <Box mt="3" p="3" style={{ background: "#FEF3C7", borderRadius: "6px", border: "1px solid #FDE68A" }}>
            <Text size="1" style={{ color: "#92400E" }}>
              💡 This link tracks all clicks and conversions. Share it with the creator to include in their content.
            </Text>
          </Box>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(affiliateLink);
              }}
              style={{ background: "#B4D88B", color: "#000" }}
            >
              <Copy size={16} />
              Copy Link
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </DashboardLayout>
  );
}
