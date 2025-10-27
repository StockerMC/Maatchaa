"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Tabs, Badge, Button, Dialog, TextField, TextArea, Checkbox, Avatar } from "@radix-ui/themes";
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
  BarChart3,
  Info,
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
  commissionRate?: number; // e.g., 15 for 15%
  paymentTerms?: string; // e.g., "Net 30 days"
  contractDuration?: string; // e.g., "90 days"
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
    creatorName: "Sarah Chen",
    creatorHandle: "@teawithsarah",
    creatorAvatar: "/cooking-channel-avatar.jpg",
    videoTitle: "My Morning Matcha Ritual (Life-Changing)",
    videoThumbnail: "/youtube-shorts-cooking-video.jpg",
    videoUrl: "https://youtube.com/shorts/example1",
    status: "active",
    matchedProducts: ["MATCHA MATCHA Can", "MATCHA MATCHA Bamboo Whisk", "MATCHA MATCHA Sifter"],
    views: 1200000,
    likes: 45000,
    comments: 2300,
    initiatedDate: "45 days ago",
    contractSigned: true,
    affiliateLinkGenerated: true,
    affiliateLink: "https://matchamatcha.ca/ref/teawithsarah?pid=1",
    commissionRate: 15,
    paymentTerms: "Net 30 days",
    contractDuration: "90 days",
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
    creatorName: "Alex Tanaka",
    creatorHandle: "@mindfulmixology",
    creatorAvatar: "/fitness-channel-avatar.jpg",
    videoTitle: "Why I Switched to Ceremonial Grade Matcha",
    videoThumbnail: "/fitness-workout-video.png",
    videoUrl: "https://youtube.com/shorts/example2",
    status: "to_contact",
    matchedProducts: ["Horii Shichimeien Matcha Can", "MATCHA MATCHA Measuring Spoon"],
    views: 850000,
    likes: 32000,
    comments: 1800,
    initiatedDate: "5 hours ago",
    commissionRate: 18,
    paymentTerms: "Net 30 days",
    contractDuration: "90 days",
  },
  {
    id: "3",
    creatorName: "Emma Lifestyle",
    creatorHandle: "@emmalifestyle",
    creatorAvatar: "/tech-channel-avatar.png",
    videoTitle: "Bougie Morning Routine Essentials",
    videoThumbnail: "/tech-review-video.jpg",
    videoUrl: "https://youtube.com/shorts/example3",
    status: "in_discussion",
    matchedProducts: ["Bougie Candle by Le Labo", "Hand Lotion by Le Labo", "Hand Soap by Le Labo"],
    views: 650000,
    likes: 28000,
    comments: 1200,
    initiatedDate: "3 days ago",
    contractDrafted: true,
    contractSent: false,
    contractSigned: false,
    affiliateLinkGenerated: true,
    affiliateLink: "https://matchamatcha.ca/ref/emmalifestyle?pid=3",
    commissionRate: 20,
    paymentTerms: "Net 30 days",
    contractDuration: "90 days",
  },
  {
    id: "4",
    creatorName: "James Brewer",
    creatorHandle: "@coffeewjames",
    creatorAvatar: "/cooking-channel-avatar.jpg",
    videoTitle: "Pro Barista Tools You Actually Need",
    videoThumbnail: "/youtube-shorts-cooking-video.jpg",
    videoUrl: "https://youtube.com/shorts/example4",
    status: "contacted",
    matchedProducts: ["Pro Kettle by Stagg", "Precision Scale by acaia"],
    views: 420000,
    likes: 15000,
    comments: 800,
    initiatedDate: "2 days ago",
    commissionRate: 15,
    paymentTerms: "Net 30 days",
    contractDuration: "90 days",
  },
];

export default function PartnershipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showAffiliateDialog, setShowAffiliateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
    const productsLatex = partnership.matchedProducts.map(p => `  \\item ${p}`).join('\n');
    const latex = `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}

\\begin{document}

\\begin{center}
\\Large\\textbf{PARTNERSHIP AGREEMENT}
\\end{center}

\\vspace{1em}

This Partnership Agreement is entered into as of ${new Date().toLocaleDateString()} between:

\\vspace{0.5em}

\\textbf{MATCHAA} (Business) \\\\
and \\\\
\\textbf{${partnership.creatorName}} (Creator)

\\vspace{1em}

\\section*{1. SCOPE OF WORK}

Creator agrees to feature the following products in their content:

\\begin{itemize}
${productsLatex}
\\end{itemize}

\\section*{2. COMPENSATION}

\\begin{itemize}
  \\item Commission: 15\\% of sales generated through affiliate link
  \\item Payment Terms: Net 30 days
  \\item Minimum threshold: \\$50
\\end{itemize}

\\section*{3. CONTENT REQUIREMENTS}

\\begin{itemize}
  \\item Natural product integration in Creator content
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
Signatures:

Business: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_ Date: ${new Date().toLocaleDateString()}

Creator: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_ Date: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_

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
                        <Avatar
                          size="2"
                          src={partnership.creatorAvatar}
                          fallback={partnership.creatorName.charAt(0)}
                          radius="full"
                        />
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
                      <Flex
                        mt="2"
                        p="2"
                        align="center"
                        gap="3"
                        style={{
                          background: "#F9FAFB",
                          borderRadius: "6px",
                          border: "1px solid #F5F5F5",
                        }}
                      >
                        <Text size="1" weight="medium" style={{ color: "#737373", whiteSpace: "nowrap" }}>
                          Progress:
                        </Text>
                        <Flex align="center" gap="2">
                          <CheckCircle size={14} color={partnership.contractDrafted ? "#10B981" : "#D1D5DB"} />
                          <Text size="1" style={{ color: partnership.contractDrafted ? "#10B981" : "#737373" }}>
                            Contract
                          </Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <CheckCircle size={14} color={partnership.contractSent ? "#10B981" : "#D1D5DB"} />
                          <Text size="1" style={{ color: partnership.contractSent ? "#10B981" : "#737373" }}>
                            Sent
                          </Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <CheckCircle size={14} color={partnership.affiliateLinkGenerated ? "#10B981" : "#D1D5DB"} />
                          <Text size="1" style={{ color: partnership.affiliateLinkGenerated ? "#10B981" : "#737373" }}>
                            Link
                          </Text>
                        </Flex>
                      </Flex>
                    )}

                    {/* Active - Show Quick Status */}
                    {partnership.status === "active" && partnership.performanceMetrics && (
                      <Flex
                        mt="2"
                        p="2"
                        align="center"
                        justify="between"
                        gap="2"
                        style={{
                          background: "#F0FDF4",
                          borderRadius: "6px",
                          border: "1px solid #BBF7D0",
                        }}
                      >
                        <Flex align="center" gap="2">
                          <Text size="1" weight="medium" style={{ color: "#1A1A1A" }}>
                            Active
                          </Text>
                          <Text size="1" style={{ color: "#10B981" }}>
                            • {partnership.initiatedDate}
                          </Text>
                        </Flex>
                        <Button size="1" variant="soft" asChild>
                          <Link href="/dashboard/analytics">
                            <BarChart3 size={12} />
                            View
                          </Link>
                        </Button>
                      </Flex>
                    )}
                  </Flex>

                  {/* Actions */}
                  <Flex direction="column" gap="2" style={{ minWidth: "180px" }}>
                    {/* View Details button - always shown */}
                    <Button
                      size="2"
                      variant="outline"
                      onClick={() => {
                        setSelectedPartnership(partnership);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Info size={16} />
                      View Details
                    </Button>

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
                          <a href={partnership.videoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={16} />
                            View Video
                          </a>
                        </Button>
                        <Button size="2" variant="outline" asChild>
                          <Link href="/dashboard/communications">
                            <MessageSquare size={16} />
                            View Conversation
                          </Link>
                        </Button>
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
                            <Mail size={16} />
                            Send Email
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
                    <Text size="2" weight="bold" style={{ display: "block" }}>MATCHAA (&quot;Business&quot;)</Text>
                    <Text size="2" style={{ display: "block", marginBottom: "1rem" }}>and</Text>
                    <Text size="2" weight="bold" style={{ display: "block", marginBottom: "1rem" }}>
                      {selectedPartnership?.creatorName} (&quot;Creator&quot;)
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

      {/* Partnership Details Dialog */}
      <Dialog.Root open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <Dialog.Content style={{ maxWidth: "600px" }}>
          <Dialog.Title>Partnership Details</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Complete information for {selectedPartnership?.creatorName}
          </Dialog.Description>

          <Flex direction="column" gap="4">
            {/* Creator Info */}
            <Box>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                Creator Information
              </Text>
              <Box p="3" style={{ background: "#F9FAFB", borderRadius: "6px" }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Name:</Text>
                    <Text size="2" weight="medium">{selectedPartnership?.creatorName}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Handle:</Text>
                    <Text size="2" weight="medium">{selectedPartnership?.creatorHandle}</Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Video:</Text>
                    <Text size="2" weight="medium" style={{ maxWidth: "300px", textAlign: "right" }}>
                      {selectedPartnership?.videoTitle}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Box>

            {/* Products Promoted */}
            <Box>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                Products Promoted
              </Text>
              <Flex gap="2" wrap="wrap">
                {selectedPartnership?.matchedProducts.map((product) => (
                  <Badge key={product} size="2" variant="soft">
                    {product}
                  </Badge>
                ))}
              </Flex>
            </Box>

            {/* Contract & Payment Terms */}
            <Box>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                Contract & Payment Terms
              </Text>
              <Box p="3" style={{ background: "#F0FDF4", borderRadius: "6px", border: "1px solid #BBF7D0" }}>
                <Flex direction="column" gap="2">
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Commission Rate:</Text>
                    <Text size="2" weight="bold" style={{ color: "#10B981" }}>
                      {selectedPartnership?.commissionRate || 15}%
                    </Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Payment Terms:</Text>
                    <Text size="2" weight="medium">
                      {selectedPartnership?.paymentTerms || "Net 30 days"}
                    </Text>
                  </Flex>
                  <Flex justify="between">
                    <Text size="2" style={{ color: "#737373" }}>Contract Duration:</Text>
                    <Text size="2" weight="medium">
                      {selectedPartnership?.contractDuration || "90 days"}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Box>

            {/* Affiliate Link */}
            {selectedPartnership?.affiliateLink && (
              <Box>
                <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                  Affiliate Link
                </Text>
                <Box
                  p="2"
                  style={{
                    background: "#F5F5F5",
                    borderRadius: "6px",
                    border: "1px solid #E5E5E5",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedPartnership.affiliateLink}
                </Box>
                <Button
                  size="1"
                  variant="soft"
                  mt="2"
                  onClick={() => {
                    if (selectedPartnership?.affiliateLink) {
                      navigator.clipboard.writeText(selectedPartnership.affiliateLink);
                    }
                  }}
                >
                  <Copy size={14} />
                  Copy Link
                </Button>
              </Box>
            )}

            {/* Performance Metrics (if active) */}
            {selectedPartnership?.status === "active" && selectedPartnership?.performanceMetrics && (
              <Box>
                <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                  Performance Summary
                </Text>
                <Flex gap="3" wrap="wrap">
                  <Box style={{ flex: "1 1 100px" }}>
                    <Text size="1" style={{ color: "#737373", display: "block" }}>Clicks</Text>
                    <Text size="4" weight="bold">{selectedPartnership.performanceMetrics.clicks}</Text>
                  </Box>
                  <Box style={{ flex: "1 1 100px" }}>
                    <Text size="1" style={{ color: "#737373", display: "block" }}>Sales</Text>
                    <Text size="4" weight="bold">{selectedPartnership.performanceMetrics.sales}</Text>
                  </Box>
                  <Box style={{ flex: "1 1 100px" }}>
                    <Text size="1" style={{ color: "#737373", display: "block" }}>Revenue</Text>
                    <Text size="4" weight="bold" style={{ color: "#10B981" }}>
                      ${selectedPartnership.performanceMetrics.revenue.toFixed(2)}
                    </Text>
                  </Box>
                  <Box style={{ flex: "1 1 100px" }}>
                    <Text size="1" style={{ color: "#737373", display: "block" }}>Commission</Text>
                    <Text size="4" weight="bold" style={{ color: "#10B981" }}>
                      ${((selectedPartnership.performanceMetrics.revenue * (selectedPartnership.commissionRate || 15)) / 100).toFixed(2)}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}

            {/* Status Timeline */}
            <Box>
              <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem", color: "#1A1A1A" }}>
                Status
              </Text>
              <Box p="3" style={{ background: "#F9FAFB", borderRadius: "6px" }}>
                <Flex align="center" gap="2">
                  {getStatusBadge(selectedPartnership?.status || "to_contact")}
                  <Text size="2" style={{ color: "#737373" }}>
                    • {selectedPartnership?.initiatedDate}
                  </Text>
                </Flex>
              </Box>
            </Box>
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Close
              </Button>
            </Dialog.Close>
            <Button style={{ background: "#B4D88B", color: "#000" }} asChild>
              <Link href="/dashboard/analytics">
                <BarChart3 size={16} />
                View Analytics
              </Link>
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </DashboardLayout>
  );
}
