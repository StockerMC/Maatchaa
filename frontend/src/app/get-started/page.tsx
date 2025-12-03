"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Button, TextField } from "@radix-ui/themes";
import { sage, lime, red } from "@radix-ui/colors";
import { Store, ArrowRight, Info } from "lucide-react";

export default function GetStartedPage() {
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!shopName.trim()) {
      setError("Please enter your Shopify store name");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Clean the shop name
      let cleanShopName = shopName.trim();
      
      // Extract store name from various formats
      if (cleanShopName.includes("admin.shopify.com/store/")) {
        cleanShopName = cleanShopName.split("admin.shopify.com/store/")[1].split(/[/?]/)[0];
      } else if (cleanShopName.includes(".myshopify.com")) {
        cleanShopName = cleanShopName.split(".myshopify.com")[0].replace(/^https?:\/\//, "");
      }

      // Generate a proper UUID v4 for temporary company ID
      const tempCompanyId = crypto.randomUUID();
      
      // Call backend to get redirect URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/shopify/install?shop=${encodeURIComponent(cleanShopName)}&company_id=${tempCompanyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to Shopify");
      }
      
      const data = await response.json();
      
      // Redirect using JavaScript to avoid ampersand escaping
      window.location.href = data.redirect_url;
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Failed to connect. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      width: "100%", 
      background: sage.sage2, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "2rem 1rem"
    }}>
      <Box style={{ 
        width: "100%", 
        maxWidth: "600px"
      }}>
        <Flex direction="column" gap="6" align="center">
          {/* Logo/Brand */}
          <Flex direction="column" align="center" gap="3">
            <Box style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: lime.lime3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${lime.lime6}`
            }}>
              <Store size={32} color={lime.lime11} />
            </Box>
            <Text size="8" weight="bold" style={{ color: sage.sage12 }}>
              Welcome to Maatchaa
            </Text>
            <Text size="4" style={{ color: sage.sage11, textAlign: "center" }}>
              Connect your Shopify store to start finding the perfect creators for your brand
            </Text>
          </Flex>

          {/* Main Card */}
          <Card style={{ 
            width: "100%", 
            padding: "2.5rem",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: `1px solid ${sage.sage6}`
          }}>
            <Flex direction="column" gap="5">
              <Flex direction="column" gap="2">
                <Text size="6" weight="bold" style={{ color: sage.sage12 }}>
                  Connect Your Shopify Store
                </Text>
                <Text size="3" style={{ color: sage.sage11 }}>
                  Enter your Shopify store name to get started
                </Text>
              </Flex>

              <Flex direction="column" gap="3">
                <Box>
                  <Text size="2" weight="medium" style={{ marginBottom: "0.5rem", display: "block", color: sage.sage12 }}>
                    Store Name
                  </Text>
                  <TextField.Root
                    placeholder="my-store or my-store.myshopify.com"
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      setError("");
                    }}
                    size="3"
                    style={{ width: "100%" }}
                  />
                  {error && (
                    <Text size="2" style={{ color: red.red9, marginTop: "0.5rem", display: "block" }}>
                      {error}
                    </Text>
                  )}
                </Box>

                <Card style={{ background: sage.sage2, padding: "1rem", border: `1px solid ${sage.sage6}` }}>
                  <Flex gap="3" align="start">
                    <Info size={18} color={sage.sage11} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <Flex direction="column" gap="2">
                      <Text size="2" style={{ color: sage.sage11 }}>
                        You can enter your store in any of these formats:
                      </Text>
                      <Flex direction="column" gap="1" style={{ paddingLeft: "0.5rem" }}>
                        <Text size="2" style={{ color: sage.sage11 }}>• my-store</Text>
                        <Text size="2" style={{ color: sage.sage11 }}>• my-store.myshopify.com</Text>
                        <Text size="2" style={{ color: sage.sage11 }}>• https://admin.shopify.com/store/my-store</Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>

                <Button
                  onClick={handleConnect}
                  disabled={isLoading || !shopName.trim()}
                  variant="solid"
                  color="lime"
                  size="3"
                  style={{ 
                    width: "100%", 
                    cursor: "pointer",
                    marginTop: "1rem",
                    height: "48px"
                  }}
                >
                  {isLoading ? (
                    "Connecting..."
                  ) : (
                    <Flex align="center" gap="2">
                      Continue to Shopify
                      <ArrowRight size={20} />
                    </Flex>
                  )}
                </Button>
              </Flex>
            </Flex>
          </Card>

          {/* Security Note */}
          <Flex align="center" gap="2" style={{ maxWidth: "500px" }}>
            <Text size="1" style={{ color: sage.sage11, textAlign: "center" }}>
              🔒 Secure connection via Shopify OAuth. We&apos;ll only access the data needed to match you with creators.
            </Text>
          </Flex>
        </Flex>
      </Box>
    </div>
  );
}
