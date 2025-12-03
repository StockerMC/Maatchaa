'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentUser, getApiUrl } from '@/lib/auth';
import { Card, Flex, Text, Box, Button, Badge, Separator } from "@radix-ui/themes";
import { sage, green, red, blue } from "@radix-ui/colors";
import { Store, Link2, Package, AlertCircle, CheckCircle2, Settings } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ShopInfo {
  name: string;
  domain: string;
  email: string;
  currency: string;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Get company_id from auth
  const user = getCurrentUser();
  const companyId = user?.companyId;

  useEffect(() => {
    // Check if user just completed OAuth
    const shopifyStatus = searchParams.get('shopify');
    const shop = searchParams.get('shop');
    const message = searchParams.get('message');

    if (shopifyStatus === 'connected' && shop) {
      setShowMessage({
        type: 'success',
        text: `Successfully connected to ${shop}! 🎉`
      });
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
      checkShopifyStatus();
    } else if (shopifyStatus === 'error') {
      setShowMessage({
        type: 'error',
        text: `Failed to connect: ${message || 'Unknown error'}`
      });
      window.history.replaceState({}, '', '/dashboard/settings');
    } else {
      checkShopifyStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const checkShopifyStatus = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/shopify/status?company_id=${companyId}`)
      );
      const data = await response.json();

      if (data.connected) {
        setShopifyConnected(true);
        setShopInfo(data.shop);
      }
    } catch (error) {
      console.error('Error checking Shopify status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectShopify = () => {
    const shopName = prompt(
      'Enter your Shopify store:\n\n' +
      'Examples:\n' +
      '• my-store\n' +
      '• my-store.myshopify.com\n' +
      '• https://admin.shopify.com/store/my-store\n\n' +
      'Your store:'
    );

    if (!shopName) return;

    // Redirect to Python backend OAuth endpoint
    const oauthUrl = getApiUrl(`/shopify/install?shop=${encodeURIComponent(shopName)}&company_id=${companyId}`);
    window.location.href = oauthUrl;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) {
      return;
    }

    try {
      await fetch(getApiUrl('/shopify/disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      setShopifyConnected(false);
      setShopInfo(null);
      setShowMessage({
        type: 'success',
        text: 'Shopify store disconnected successfully'
      });
    } catch (error) {
      setShowMessage({
        type: 'error',
        text: 'Failed to disconnect Shopify store'
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="2">
            <Text size="8" weight="bold">Settings</Text>
            <Text size="2" style={{ color: sage.sage11, display: "block" }}>
              Loading...
            </Text>
          </Flex>
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="2">
          <Text size="8" weight="bold">Settings</Text>
          <Text size="2" style={{ color: sage.sage11 }}>
            Manage your integrations and account preferences
          </Text>
        </Flex>

        {/* Success/Error Messages */}
        {showMessage && (
          <Card
            style={{
              background: showMessage.type === 'success' ? green.green3 : red.red3,
              border: `1px solid ${showMessage.type === 'success' ? green.green6 : red.red6}`,
            }}
          >
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                {showMessage.type === 'success' ? (
                  <CheckCircle2 size={20} color={green.green9} />
                ) : (
                  <AlertCircle size={20} color={red.red9} />
                )}
                <Text weight="medium" style={{ color: showMessage.type === 'success' ? green.green11 : red.red11 }}>
                  {showMessage.text}
                </Text>
              </Flex>
              <Button
                variant="ghost"
                size="1"
                onClick={() => setShowMessage(null)}
                style={{ alignSelf: "flex-start", color: showMessage.type === 'success' ? green.green11 : red.red11 }}
              >
                Dismiss
              </Button>
            </Flex>
          </Card>
        )}

        {/* Shopify Integration Section */}
        <Card style={{ background: "white" }}>
          <Flex direction="column" gap="4">
            {/* Card Header */}
            <Flex align="center" gap="3">
              <Box style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: sage.sage3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Store size={20} color={sage.sage11} />
              </Box>
              <Flex direction="column" gap="1">
                <Text size="5" weight="bold">Shopify Integration</Text>
                <Text size="2" style={{ color: sage.sage11 }}>
                  Connect your store to sync products and track sales
                </Text>
              </Flex>
            </Flex>

            <Separator size="4" style={{ background: sage.sage6 }} />

            {!shopifyConnected ? (
              <Flex direction="column" gap="4">
                <Text size="2" style={{ color: sage.sage11 }}>
                  Connect your Shopify store to automatically sync products and track creator sales.
                </Text>

                <Card style={{ background: blue.blue2, border: `1px solid ${blue.blue6}` }}>
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="medium" style={{ color: blue.blue11 }}>
                      What you&apos;ll get:
                    </Text>
                    <Flex direction="column" gap="1" style={{ paddingLeft: "1rem" }}>
                      <Flex align="center" gap="2">
                        <Box style={{ width: "4px", height: "4px", borderRadius: "50%", background: blue.blue9 }} />
                        <Text size="2" style={{ color: blue.blue11 }}>Automatic product syncing to our AI matching system</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Box style={{ width: "4px", height: "4px", borderRadius: "50%", background: blue.blue9 }} />
                        <Text size="2" style={{ color: blue.blue11 }}>Track orders from creator affiliate links</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Box style={{ width: "4px", height: "4px", borderRadius: "50%", background: blue.blue9 }} />
                        <Text size="2" style={{ color: blue.blue11 }}>Generate discount codes for creators</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <Box style={{ width: "4px", height: "4px", borderRadius: "50%", background: blue.blue9 }} />
                        <Text size="2" style={{ color: blue.blue11 }}>Revenue attribution and analytics</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>

                <Button
                  size="3"
                  onClick={handleConnectShopify}
                  style={{
                    background: green.green9,
                    color: "white",
                    cursor: "pointer",
                    alignSelf: "flex-start"
                  }}
                >
                  <Link2 size={16} />
                  Connect Shopify Store
                </Button>
              </Flex>
            ) : (
              <Flex direction="column" gap="4">
                {/* Connection Status */}
                <Flex align="center" gap="2">
                  <Box style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: green.green9
                  }} />
                  <Badge color="green" size="2">Connected</Badge>
                </Flex>

                {/* Shop Info */}
                <Card style={{ background: sage.sage2 }}>
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: sage.sage11 }}>Store Name:</Text>
                      <Text size="2" weight="medium">{shopInfo?.name || 'N/A'}</Text>
                    </Flex>
                    <Separator size="4" style={{ background: sage.sage6 }} />
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: sage.sage11 }}>Domain:</Text>
                      <Text size="2" weight="medium">{shopInfo?.domain || 'N/A'}</Text>
                    </Flex>
                    <Separator size="4" style={{ background: sage.sage6 }} />
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: sage.sage11 }}>Email:</Text>
                      <Text size="2" weight="medium">{shopInfo?.email || 'N/A'}</Text>
                    </Flex>
                    <Separator size="4" style={{ background: sage.sage6 }} />
                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: sage.sage11 }}>Currency:</Text>
                      <Text size="2" weight="medium">{shopInfo?.currency || 'N/A'}</Text>
                    </Flex>
                  </Flex>
                </Card>

                {/* Actions */}
                <Flex gap="3">
                  <Button
                    size="2"
                    onClick={() => window.location.href = '/dashboard/products'}
                    style={{ cursor: "pointer" }}
                  >
                    <Package size={16} />
                    View Products
                  </Button>

                  <Button
                    size="2"
                    variant="soft"
                    color="red"
                    onClick={handleDisconnect}
                    style={{ cursor: "pointer" }}
                  >
                    Disconnect Store
                  </Button>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Account Settings Section */}
        <Card style={{ background: "white" }}>
          <Flex direction="column" gap="4">
            <Flex align="center" gap="3">
              <Box style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: sage.sage3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Settings size={20} color={sage.sage11} />
              </Box>
              <Flex direction="column" gap="1">
                <Text size="5" weight="bold">Account Settings</Text>
                <Text size="2" style={{ color: sage.sage11 }}>
                  Manage your account preferences
                </Text>
              </Flex>
            </Flex>

            <Separator size="4" style={{ background: sage.sage6 }} />

            <Text size="2" style={{ color: sage.sage11 }}>
              Additional settings coming soon...
            </Text>
          </Flex>
        </Card>
      </Flex>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <Flex direction="column" gap="6">
          <Text size="8" weight="bold">Settings</Text>
          <Text size="2" style={{ color: sage.sage11 }}>Loading...</Text>
        </Flex>
      </DashboardLayout>
    }>
      <SettingsContent />
    </Suspense>
  );
}
