"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, Flex, Text, Box, Button, Badge, Separator, Avatar, TextField } from "@radix-ui/themes";
import { sage, green, red, blue, amber } from "@radix-ui/colors";
import {
  CheckCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
  Copy,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  ShoppingCart,
  Mail,
  Calendar,
  Package
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface Partnership {
  id: string;
  company_id: string;
  creator_name: string;
  creator_handle: string;
  creator_email: string;
  video_title: string;
  video_url: string;
  video_thumbnail: string;
  matched_products: Array<{ id: string; title: string; name: string; image: string; price: number }>;
  views: number;
  likes: number;
  comments: number;
  status: "to_contact" | "contacted" | "in_discussion" | "active" | "closed";
  commission_rate: number;
  payment_terms: string;
  affiliate_link: string;
  discount_code: string;
  clicks: number;
  sales: number;
  revenue: number;
  created_at: string;
  contacted_at: string;
  activated_at: string;
  contract_signed: boolean;
}

interface ShopInfo {
  shop_name: string;
  shop_owner: string;
  shop_domain: string;
  logo_url?: string;
}

export default function CreatorPartnershipPage() {
  const params = useParams();
  const partnershipId = params.id as string;

  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [signatureText, setSignatureText] = useState("");

  // Helper to decode HTML entities
  const decodeHtmlEntities = (text: string) => {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    }
    return text;
  };

  useEffect(() => {
    fetchPartnership();
  }, [partnershipId]);

  const fetchPartnership = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/partnerships/${partnershipId}`);

      if (!response.ok) {
        throw new Error("Partnership not found");
      }

      const data = await response.json();
      setPartnership(data);

      // Fetch shop info
      const shopResponse = await fetch(`${apiUrl}/shopify/shop-info?company_id=${data.company_id}`);
      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        setShopInfo(shopData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load partnership");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!creatorName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/partnerships/${partnershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_discussion",
          creator_name: creatorName,
        }),
      });

      if (!response.ok) throw new Error("Failed to accept partnership");

      toast.success("Partnership accepted! Please review the contract below.");
      await fetchPartnership();
    } catch (err) {
      toast.error("Failed to accept partnership");
    }
  };

  const handleDecline = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/partnerships/${partnershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (!response.ok) throw new Error("Failed to decline partnership");

      toast.success("Partnership declined");
      await fetchPartnership();
    } catch (err) {
      toast.error("Failed to decline partnership");
    }
  };

  const handleSignContract = async () => {
    if (!signatureText.trim()) {
      toast.error("Please enter your full name as signature");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Mark contract as signed
      const contractResponse = await fetch(`${apiUrl}/partnerships/${partnershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_signed: true,
          status: "in_discussion", // Stay in discussion until affiliate link is generated
        }),
      });

      if (!contractResponse.ok) throw new Error("Failed to sign contract");

      // Generate affiliate link
      const affiliateResponse = await fetch(`${apiUrl}/partnerships/${partnershipId}/generate-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commission_rate: partnership?.commission_rate || 10,
          create_discount: true,
          discount_amount: 10,
          discount_type: "percentage",
        }),
      });

      if (!affiliateResponse.ok) throw new Error("Failed to generate affiliate link");

      // Activate partnership
      await fetch(`${apiUrl}/partnerships/${partnershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      toast.success("Contract signed! Your affiliate link is ready.");
      await fetchPartnership();
    } catch (err) {
      toast.error("Failed to sign contract");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "100vh", background: sage.sage2 }}>
        <Text size="4" style={{ color: sage.sage11 }}>Loading partnership details...</Text>
      </Flex>
    );
  }

  if (error || !partnership) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ minHeight: "100vh", background: sage.sage2 }}>
        <Card style={{ padding: "2rem", maxWidth: "400px" }}>
          <Flex direction="column" gap="3" align="center">
            <XCircle size={48} color={red.red9} />
            <Text size="5" weight="bold">Partnership Not Found</Text>
            <Text size="2" style={{ color: sage.sage11, textAlign: "center" }}>
              {error || "This partnership link is invalid or has expired."}
            </Text>
          </Flex>
        </Card>
      </Flex>
    );
  }

  const getStatusBadge = () => {
    switch (partnership.status) {
      case "contacted":
        return <Badge color="blue">New Partnership Offer</Badge>;
      case "in_discussion":
        return <Badge color="amber">In Discussion</Badge>;
      case "active":
        return <Badge color="green">Active Partnership</Badge>;
      case "closed":
        return <Badge color="gray">Closed</Badge>;
      default:
        return <Badge color="gray">{partnership.status}</Badge>;
    }
  };

  return (
    <Flex direction="column" style={{ minHeight: "100vh", background: sage.sage2 }}>
      {/* Header */}
      <Box style={{ background: "white", borderBottom: `1px solid ${sage.sage6}`, padding: "1.5rem 2rem" }}>
        <Flex justify="between" align="center">
          <Flex align="center" gap="3">
            {shopInfo?.logo_url ? (
              <Avatar size="3" src={shopInfo.logo_url} fallback={shopInfo.shop_name.charAt(0)} />
            ) : (
              <Box style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: sage.sage3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text size="5" weight="bold">{shopInfo?.shop_name.charAt(0) || "S"}</Text>
              </Box>
            )}
            <Flex direction="column">
              <Text size="5" weight="bold">{shopInfo?.shop_name || "Brand"}</Text>
              <Text size="2" style={{ color: sage.sage11 }}>Partnership Portal</Text>
            </Flex>
          </Flex>
          {getStatusBadge()}
        </Flex>
      </Box>

      {/* Main Content */}
      <Box style={{ maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "2rem" }}>
        <Flex direction="column" gap="6">
          {/* Partnership Offer Header */}
          <Card>
            <Flex direction="column" gap="4">
              <Flex justify="between" align="start">
                <Flex direction="column" gap="2">
                  <Text size="7" weight="bold">Partnership Opportunity</Text>
                  <Text size="3" style={{ color: sage.sage11 }}>
                    {shopInfo?.shop_name} wants to partner with you!
                  </Text>
                </Flex>
                <Flex direction="column" gap="1" align="end">
                  <Text size="2" style={{ color: sage.sage11 }}>
                    <Calendar size={14} style={{ display: "inline", marginRight: "4px" }} />
                    Received {new Date(partnership.created_at).toLocaleDateString()}
                  </Text>
                </Flex>
              </Flex>

              <Separator size="4" />

              {/* Video & Products */}
              <Flex gap="6" wrap="wrap">
                {/* Video Thumbnail */}
                <Box style={{ flex: "1 1 450px", minWidth: "320px", maxWidth: "600px" }}>
                  <Box style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: sage.sage3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>
                    {partnership.video_thumbnail && (
                      <Image
                        src={partnership.video_thumbnail}
                        alt={partnership.video_title}
                        width={600}
                        height={338}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Box>
                  <Text size="3" weight="medium" style={{ marginTop: "0.75rem", display: "block" }}>
                    {decodeHtmlEntities(partnership.video_title)}
                  </Text>
                  <Flex gap="3" style={{ marginTop: "0.5rem" }}>
                    <Text size="2" style={{ color: sage.sage11 }}>
                      <Eye size={14} style={{ display: "inline" }} /> {partnership.views?.toLocaleString() || 0} views
                    </Text>
                  </Flex>
                </Box>

                {/* Matched Products */}
                <Box style={{ flex: "1 1 450px", minWidth: "320px" }}>
                  <Text size="3" weight="bold" style={{ marginBottom: "1rem", display: "block" }}>
                    <Package size={16} style={{ display: "inline", marginRight: "4px" }} />
                    Featured Products
                  </Text>
                  <Flex direction="column" gap="3">
                    {partnership.matched_products?.slice(0, 3).map((product, idx) => (
                      <Card key={idx} style={{ padding: "1rem", background: sage.sage2, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <Flex gap="3" align="center">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.title || product.name}
                              width={64}
                              height={64}
                              style={{ borderRadius: "6px", objectFit: "cover" }}
                            />
                          )}
                          <Flex direction="column" style={{ flex: 1 }}>
                            <Text size="3" weight="medium">{product.title || product.name}</Text>
                            <Text size="2" weight="bold" style={{ color: green.green11, marginTop: "0.25rem" }}>
                              ${product.price?.toFixed(2) || "0.00"}
                            </Text>
                          </Flex>
                        </Flex>
                      </Card>
                    ))}
                    {partnership.matched_products?.length > 3 && (
                      <Text size="1" style={{ color: sage.sage11 }}>
                        +{partnership.matched_products.length - 3} more products
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Card>

          {/* Partnership Terms */}
          <Card>
            <Flex direction="column" gap="4">
              <Text size="5" weight="bold">Partnership Terms</Text>
              <Separator size="4" />

              <Flex gap="8" wrap="wrap" style={{ justifyContent: "space-between" }}>
                <Box style={{
                  flex: "1 1 200px",
                  padding: "1.5rem",
                  background: green.green2,
                  borderRadius: "8px",
                  border: `2px solid ${green.green6}`
                }}>
                  <Text size="2" style={{ color: sage.sage11, display: "block", marginBottom: "0.5rem" }}>Commission Rate</Text>
                  <Text size="8" weight="bold" style={{ color: green.green11 }}>
                    {partnership.commission_rate || 10}%
                  </Text>
                </Box>

                <Box style={{
                  flex: "1 1 200px",
                  padding: "1.5rem",
                  background: blue.blue2,
                  borderRadius: "8px",
                  border: `2px solid ${blue.blue6}`
                }}>
                  <Text size="2" style={{ color: sage.sage11, display: "block", marginBottom: "0.5rem" }}>Payment Terms</Text>
                  <Text size="5" weight="bold" style={{ color: blue.blue11 }}>
                    {partnership.payment_terms || "Net 30 days"}
                  </Text>
                </Box>
              </Flex>

              <Box style={{
                padding: "1.5rem",
                background: sage.sage2,
                borderRadius: "8px",
                border: `1px solid ${sage.sage6}`
              }}>
                <Text size="3" weight="bold" style={{ color: sage.sage12, marginBottom: "1rem", display: "block" }}>
                  What You Get
                </Text>
                <Flex direction="column" gap="2">
                  <Text size="3">✓ Unique affiliate tracking link</Text>
                  <Text size="3">✓ Exclusive discount code for your audience</Text>
                  <Text size="3">✓ Free product samples</Text>
                  <Text size="3">✓ Real-time performance tracking</Text>
                </Flex>
              </Box>
            </Flex>
          </Card>

          {/* Action Based on Status */}
          {partnership.status === "contacted" && (
            <Card style={{ background: blue.blue2, border: `1px solid ${blue.blue6}` }}>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="2">
                  <Text size="5" weight="bold">Accept This Partnership?</Text>
                  <Text size="2" style={{ color: sage.sage11 }}>
                    Review the terms above. If you&apos;re interested, enter your name below to proceed.
                  </Text>
                </Flex>

                <TextField.Root
                  placeholder="Enter your full name"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  size="3"
                />

                <Flex gap="3">
                  <Button
                    size="3"
                    style={{ background: green.green9, color: "white", flex: 1, cursor: "pointer" }}
                    onClick={handleAccept}
                  >
                    <CheckCircle size={20} />
                    Accept Partnership
                  </Button>
                  <Button
                    size="3"
                    variant="outline"
                    color="red"
                    style={{ cursor: "pointer" }}
                    onClick={handleDecline}
                  >
                    <XCircle size={20} />
                    Decline
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}

          {/* Contract Already Signed - Waiting for Activation */}
          {partnership.status === "in_discussion" && partnership.contract_signed && (
            <Card style={{ background: amber.amber2, border: `2px solid ${amber.amber6}` }}>
              <Flex direction="column" gap="4">
                <Flex align="center" gap="2">
                  <FileText size={24} color={amber.amber9} />
                  <Text size="5" weight="bold">Contract Signed - Finalizing Partnership</Text>
                </Flex>

                <Text size="3" style={{ color: sage.sage11 }}>
                  Your contract has been signed! We&apos;re generating your affiliate link and activating your partnership.
                </Text>

                <Button
                  size="3"
                  style={{ background: green.green9, color: "white", cursor: "pointer" }}
                  onClick={async () => {
                    try {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

                      // Retry affiliate link generation
                      const affiliateResponse = await fetch(`${apiUrl}/partnerships/${partnershipId}/generate-affiliate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          commission_rate: partnership?.commission_rate || 10,
                          create_discount: true,
                          discount_amount: 10,
                          discount_type: "percentage",
                        }),
                      });

                      if (!affiliateResponse.ok) throw new Error("Failed to generate affiliate link");

                      // Activate partnership
                      await fetch(`${apiUrl}/partnerships/${partnershipId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "active" }),
                      });

                      toast.success("Partnership activated! Your affiliate link is ready.");
                      await fetchPartnership();
                    } catch (err) {
                      toast.error("Failed to activate partnership. Please contact support.");
                    }
                  }}
                >
                  Complete Activation
                </Button>
              </Flex>
            </Card>
          )}

          {/* Contract Signing */}
          {partnership.status === "in_discussion" && !partnership.contract_signed && (
            <Card>
              <Flex direction="column" gap="4">
                <Flex align="center" gap="2">
                  <FileText size={24} color={amber.amber9} />
                  <Text size="5" weight="bold">Partnership Agreement</Text>
                </Flex>

                <Card style={{
                  padding: "2rem",
                  background: "white",
                  maxHeight: "500px",
                  overflowY: "auto",
                  border: `2px solid ${sage.sage6}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                  <Flex direction="column" gap="4" style={{
                    fontFamily: "Georgia, serif",
                    lineHeight: "1.7"
                  }}>
                    <Text size="6" weight="bold" style={{ textAlign: "center", marginBottom: "1rem" }}>
                      CREATOR PARTNERSHIP AGREEMENT
                    </Text>

                    <Box>
                      <Text size="2" style={{ color: sage.sage11 }}>
                        This Partnership Agreement (&quot;Agreement&quot;) is entered into as of{" "}
                        <strong>{new Date().toLocaleDateString()}</strong> between:
                      </Text>
                    </Box>

                    <Box style={{
                      padding: "1rem",
                      background: sage.sage2,
                      borderLeft: `4px solid ${sage.sage8}`,
                      marginBottom: "0.5rem"
                    }}>
                      <Text size="2">
                        <strong style={{ fontSize: "1.1em" }}>{shopInfo?.shop_name?.toUpperCase()}</strong><br />
                        <span style={{ color: sage.sage11 }}>(&quot;Brand&quot; or &quot;Company&quot;)</span>
                      </Text>
                      <Text size="2" style={{ margin: "0.5rem 0", display: "block", textAlign: "center" }}>and</Text>
                      <Text size="2">
                        <strong style={{ fontSize: "1.1em" }}>{partnership.creator_name?.toUpperCase()}</strong><br />
                        <span style={{ color: sage.sage11 }}>(&quot;Creator&quot; or &quot;Influencer&quot;)</span>
                      </Text>
                    </Box>

                    <Separator size="4" />

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        1. PARTNERSHIP TERMS
                      </Text>
                      <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                        Creator agrees to promote Brand&apos;s products through authentic content creation across Creator&apos;s social media platforms and channels. Brand will provide Creator with a commission of{" "}
                        <strong style={{ color: green.green11 }}>{partnership.commission_rate || 10}%</strong> on all sales generated through Creator&apos;s unique affiliate link.
                      </Text>
                      <Text size="2">
                        The parties agree to work collaboratively to ensure content aligns with both Brand&apos;s messaging and Creator&apos;s authentic voice.
                      </Text>
                    </Box>

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        2. CONTENT REQUIREMENTS
                      </Text>
                      <Box style={{ paddingLeft: "1rem" }}>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>2.1 Quality Standards:</strong> Creator will create authentic, high-quality content featuring Brand&apos;s products in a manner consistent with Creator&apos;s established content style and quality standards.
                        </Text>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>2.2 Compliance:</strong> All content must comply with FTC disclosure guidelines and applicable advertising regulations. Creator must clearly disclose the partnership relationship.
                        </Text>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>2.3 Creative Control:</strong> Creator retains full creative control over content creation, style, and presentation, subject to Brand&apos;s reasonable approval rights.
                        </Text>
                        <Text size="2">
                          <strong>2.4 Usage Rights:</strong> Creator grants Brand a non-exclusive license to share and promote Creator&apos;s content across Brand&apos;s marketing channels with proper attribution.
                        </Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        3. COMPENSATION & PAYMENT
                      </Text>
                      <Box style={{ paddingLeft: "1rem" }}>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>3.1 Commission Structure:</strong> Creator will receive {partnership.commission_rate || 10}% commission on net sales (excluding taxes, shipping, and returns) generated through Creator&apos;s unique affiliate link.
                        </Text>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>3.2 Payment Terms:</strong> Commission payments will be made{" "}
                          <strong>{partnership.payment_terms || "Net 30 days"}</strong> after the end of each calendar month.
                        </Text>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>3.3 Minimum Threshold:</strong> Payments will only be issued when accumulated commissions reach a minimum threshold of $50. Amounts below this threshold will roll over to the following month.
                        </Text>
                        <Text size="2">
                          <strong>3.4 Reporting:</strong> Creator will have access to a real-time dashboard showing clicks, conversions, and earnings.
                        </Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        4. TERM AND TERMINATION
                      </Text>
                      <Box style={{ paddingLeft: "1rem" }}>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>4.1 Initial Term:</strong> This agreement is effective immediately upon signing and continues for an initial period of 90 days.
                        </Text>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>4.2 Renewal:</strong> The agreement will automatically renew for additional 90-day periods unless either party provides written notice of non-renewal at least 30 days before the end of the current term.
                        </Text>
                        <Text size="2">
                          <strong>4.3 Termination Rights:</strong> Either party may terminate this agreement with 30 days written notice. Creator will receive commission on all qualifying sales generated prior to the termination date.
                        </Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        5. REPRESENTATIONS AND WARRANTIES
                      </Text>
                      <Box style={{ paddingLeft: "1rem" }}>
                        <Text size="2" style={{ display: "block", marginBottom: "0.5rem" }}>
                          <strong>5.1 Creator Warranties:</strong> Creator represents that they have the right to enter into this agreement and create the contemplated content.
                        </Text>
                        <Text size="2">
                          <strong>5.2 Brand Warranties:</strong> Brand represents that it has the right to offer the products and that all product information provided is accurate.
                        </Text>
                      </Box>
                    </Box>

                    <Box>
                      <Text size="4" weight="bold" style={{ color: sage.sage12, marginBottom: "0.75rem", display: "block" }}>
                        6. CONFIDENTIALITY
                      </Text>
                      <Text size="2">
                        Both parties agree to maintain confidentiality of any proprietary or sensitive information shared during the partnership, including but not limited to sales data, commission rates, and business strategies.
                      </Text>
                    </Box>

                    <Separator size="4" />

                    <Box style={{
                      padding: "1rem",
                      background: sage.sage2,
                      borderRadius: "6px",
                      marginTop: "1rem"
                    }}>
                      <Text size="2" weight="bold" style={{ display: "block", marginBottom: "0.5rem" }}>
                        ACCEPTANCE
                      </Text>
                      <Text size="2" style={{ color: sage.sage11 }}>
                        By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms and conditions set forth in this Partnership Agreement.
                      </Text>
                    </Box>
                  </Flex>
                </Card>

                <Flex direction="column" gap="3">
                  <Text size="2" style={{ color: sage.sage11 }}>
                    By signing below, you agree to the terms of this partnership agreement.
                  </Text>

                  <TextField.Root
                    placeholder="Type your full name to sign"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    size="3"
                  />

                  <Button
                    size="3"
                    style={{ background: green.green9, color: "white", cursor: "pointer" }}
                    onClick={handleSignContract}
                  >
                    <FileText size={20} />
                    Sign Agreement & Activate Partnership
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}

          {/* Active Partnership - Affiliate Link & Stats */}
          {partnership.status === "active" && (
            <>
              <Card style={{ background: green.green2, border: `2px solid ${green.green6}` }}>
                <Flex direction="column" gap="4">
                  <Flex align="center" gap="2">
                    <CheckCircle size={24} color={green.green9} />
                    <Text size="5" weight="bold" style={{ color: green.green11 }}>
                      Partnership Active!
                    </Text>
                  </Flex>

                  <Flex direction="column" gap="3">
                    {/* Affiliate Link */}
                    <Box>
                      <Text size="2" weight="medium" style={{ marginBottom: "0.5rem", display: "block" }}>
                        Your Affiliate Link:
                      </Text>
                      <Flex gap="2">
                        <TextField.Root
                          value={partnership.affiliate_link || "Generating..."}
                          readOnly
                          size="3"
                          style={{ flex: 1 }}
                        />
                        <Button
                          variant="outline"
                          style={{ cursor: "pointer" }}
                          onClick={() => copyToClipboard(partnership.affiliate_link, "Affiliate link")}
                        >
                          <Copy size={16} />
                        </Button>
                      </Flex>
                    </Box>

                    {/* Discount Code */}
                    {partnership.discount_code && (
                      <Box>
                        <Text size="2" weight="medium" style={{ marginBottom: "0.5rem", display: "block" }}>
                          Exclusive Discount Code:
                        </Text>
                        <Flex gap="2">
                          <TextField.Root
                            value={partnership.discount_code}
                            readOnly
                            size="3"
                            style={{ flex: 1 }}
                          />
                          <Button
                            variant="outline"
                            style={{ cursor: "pointer" }}
                            onClick={() => copyToClipboard(partnership.discount_code, "Discount code")}
                          >
                            <Copy size={16} />
                          </Button>
                        </Flex>
                      </Box>
                    )}
                  </Flex>
                </Flex>
              </Card>

              {/* Performance Dashboard */}
              <Card>
                <Flex direction="column" gap="4">
                  <Text size="5" weight="bold">
                    <TrendingUp size={20} style={{ display: "inline", marginRight: "8px" }} />
                    Performance Dashboard
                  </Text>

                  <Flex gap="4" wrap="wrap">
                    <Card style={{ flex: "1 1 200px", padding: "1.5rem", background: blue.blue2 }}>
                      <Flex direction="column" gap="2">
                        <Flex align="center" gap="2" style={{ color: blue.blue11 }}>
                          <MousePointer size={16} />
                          <Text size="2">Clicks</Text>
                        </Flex>
                        <Text size="7" weight="bold">{partnership.clicks || 0}</Text>
                      </Flex>
                    </Card>

                    <Card style={{ flex: "1 1 200px", padding: "1.5rem", background: green.green2 }}>
                      <Flex direction="column" gap="2">
                        <Flex align="center" gap="2" style={{ color: green.green11 }}>
                          <ShoppingCart size={16} />
                          <Text size="2">Sales</Text>
                        </Flex>
                        <Text size="7" weight="bold">{partnership.sales || 0}</Text>
                      </Flex>
                    </Card>

                    <Card style={{ flex: "1 1 200px", padding: "1.5rem", background: amber.amber2 }}>
                      <Flex direction="column" gap="2">
                        <Flex align="center" gap="2" style={{ color: amber.amber11 }}>
                          <DollarSign size={16} />
                          <Text size="2">Revenue</Text>
                        </Flex>
                        <Text size="7" weight="bold">
                          ${(partnership.revenue || 0).toFixed(2)}
                        </Text>
                      </Flex>
                    </Card>

                    <Card style={{ flex: "1 1 200px", padding: "1.5rem", background: sage.sage3 }}>
                      <Flex direction="column" gap="2">
                        <Flex align="center" gap="2" style={{ color: sage.sage11 }}>
                          <DollarSign size={16} />
                          <Text size="2">Your Earnings</Text>
                        </Flex>
                        <Text size="7" weight="bold" style={{ color: green.green11 }}>
                          ${((partnership.revenue || 0) * (partnership.commission_rate || 10) / 100).toFixed(2)}
                        </Text>
                        <Text size="1" style={{ color: sage.sage11 }}>
                          {partnership.commission_rate}% commission
                        </Text>
                      </Flex>
                    </Card>
                  </Flex>

                  <Text size="2" style={{ color: sage.sage11 }}>
                    Stats update in real-time as your audience uses your affiliate link and discount code.
                  </Text>
                </Flex>
              </Card>
            </>
          )}

          {/* Closed Partnership */}
          {partnership.status === "closed" && (
            <Card style={{ background: sage.sage2 }}>
              <Flex direction="column" gap="3" align="center" style={{ padding: "2rem" }}>
                <XCircle size={48} color={sage.sage9} />
                <Text size="5" weight="bold">Partnership Closed</Text>
                <Text size="2" style={{ color: sage.sage11, textAlign: "center" }}>
                  This partnership is no longer active.
                </Text>
              </Flex>
            </Card>
          )}

          {/* Contact Support */}
          <Card style={{ background: sage.sage2 }}>
            <Flex align="center" gap="3">
              <Mail size={20} color={sage.sage11} />
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Questions?</Text>
                <Text size="2" style={{ color: sage.sage11 }}>
                  Contact {shopInfo?.shop_name} at{" "}
                  <a href={`mailto:${shopInfo?.shop_owner}`} style={{ color: blue.blue11 }}>
                    {shopInfo?.shop_owner || "support"}
                  </a>
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Box>
    </Flex>
  );
}
