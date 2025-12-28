"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, Select, Dialog } from "@radix-ui/themes";
import { sage, lime } from "@radix-ui/colors";
import { Search, ExternalLink, Eye, Loader2, X, Package, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { getCurrentUser, getApiUrl } from "@/lib/auth";

interface Product {
  id: string;
  company_id: string;
  shop_domain: string;
  title: string;
  description: string;
  image: string;
  price: number;
  pinecone_id: string;
  synced_at: string;
  updated_at: string;
  match_count?: number;
}

function ProductsPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for OAuth success on mount
  useEffect(() => {
    const shopifyConnected = searchParams.get("shopify");
    if (shopifyConnected === "connected") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Get company_id from auth
      const user = getCurrentUser();
      const companyId = user.companyId;

      const response = await fetch(
        `/api/products?company_id=${companyId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResync = async () => {
    try {
      setSyncing(true);

      // Get company_id from auth
      const user = getCurrentUser();
      const companyId = user.companyId;

      // TODO: Get actual shop_domain from database or session
      const shopDomain = "matchamatcha.ca";

      const response = await fetch(
        getApiUrl("/products/resync"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: companyId, shop_domain: shopDomain }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resync products");
      }

      // Refetch products after successful resync
      await fetchProducts();
    } catch (error) {
      console.error("Error resyncing products:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Loader2 size={32} className="animate-spin" color={lime.lime9} />
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Success Banner */}
        {showSuccess && (
          <Card
            style={{
              padding: "1rem",
              background: `linear-gradient(135deg, ${lime.lime3} 0%, ${lime.lime4} 100%)`,
              border: `1px solid ${lime.lime7}`,
            }}
          >
            <Flex align="center" gap="3">
              <CheckCircle2 size={24} color={lime.lime11} />
              <Box>
                <Text size="3" weight="medium" style={{ color: lime.lime12 }}>
                  Shopify Store Connected Successfully!
                </Text>
                <Text size="2" style={{ color: lime.lime11, marginTop: "0.25rem", display: "block" }}>
                  Your products have been synced and the background worker is now discovering relevant creators.
                </Text>
              </Box>
            </Flex>
          </Card>
        )}

        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: sage.sage12 }}>
              Product Catalog
            </Text>
            <Text size="3" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
              Synced from your Shopify store • Auto-matching with creators
            </Text>
          </Box>
          <Button
            variant="solid"
            onClick={handleResync}
            color="lime"
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Syncing...
              </>
            ) : (
              "Resync Products"
            )}
          </Button>
        </Flex>

        {/* Product Stats */}
        <Flex gap="4" wrap="wrap">
          {[
            {
              label: "Total Products",
              value: products.length,
              desc: "synced from Shopify",
            },
            {
              label: "Avg. Price",
              value:
                products.length > 0
                  ? `$${(products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toFixed(2)}`
                  : "$0.00",
              desc: "across all products",
            },
            {
              label: "Products with Matches",
              value: products.filter((p) => (p.match_count || 0) > 0).length,
              desc: `${products.filter((p) => (p.match_count || 0) === 0).length} pending discovery`,
            },
            {
              label: "Total Creator Matches",
              value: products.reduce((sum, p) => sum + (p.match_count || 0), 0),
              desc:
                products.length > 0
                  ? `${(products.reduce((sum, p) => sum + (p.match_count || 0), 0) / products.length).toFixed(1)} avg per product`
                  : "0 avg per product",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              style={{
                flex: "1 1 calc(25% - 1rem)",
                minWidth: "240px",
                padding: "1.5rem",
              }}
            >
              <Flex direction="column" gap="3">
                <Text size="2" style={{ color: sage.sage11, fontWeight: 500 }}>
                  {stat.label}
                </Text>
                <Text size="7" weight="medium" style={{ color: "#000" }}>
                  {stat.value}
                </Text>
                <Text size="1" style={{ color: sage.sage10, fontWeight: 400 }}>
                  {stat.desc}
                </Text>
              </Flex>
            </Card>
          ))}
        </Flex>

        {/* Products Table */}
        <Card
          style={{
            padding: "1.5rem",
          }}
        >
          {/* Search */}
          <Flex align="center" gap="3" mb="4">
            <Box style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: sage.sage11,
                }}
              />
              <TextField.Root
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </Box>
            <Badge variant="soft" size="2">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            </Badge>
          </Flex>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="3"
              style={{ padding: "4rem 2rem", textAlign: "center" }}
            >
              <Package size={48} color={sage.sage9} />
              <Text size="4" weight="medium" style={{ color: sage.sage11 }}>
                {searchTerm ? "No products found" : "No products synced yet"}
              </Text>
              <Text size="2" style={{ color: sage.sage10 }}>
                {searchTerm
                  ? "Try adjusting your search"
                  : "Connect your Shopify store to start discovering creators"}
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              {filteredProducts.map((product, index) => (
                <Flex
                  key={product.id}
                  align="center"
                  gap="4"
                  p="3"
                  style={{
                    border: `1px solid ${sage.sage6}`,
                    borderRadius: "8px",
                    transition: "all 0.2s",
                    background: index % 2 === 0 ? "white" : "#FAFAF9",
                  }}
                >
                  <Box
                    style={{
                      position: "relative",
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: sage.sage3,
                    }}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Flex align="center" justify="center" style={{ width: "100%", height: "100%" }}>
                        <Package size={24} color={sage.sage9} />
                      </Flex>
                    )}
                  </Box>

                  {/* Product Info */}
                  <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                    <Text size="3" weight="medium" style={{ color: sage.sage12 }}>
                      {product.title}
                    </Text>
                    {product.description && (
                      <Text
                        size="2"
                        style={{
                          color: sage.sage11,
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.description.substring(0, 100)}
                        {product.description.length > 100 ? "..." : ""}
                      </Text>
                    )}
                    <Text size="1" style={{ color: sage.sage10 }}>
                      {product.shop_domain}
                    </Text>
                  </Flex>

                  {/* Price */}
                  <Flex direction="column" align="end" style={{ width: "100px" }}>
                    <Text size="3" weight="medium" style={{ color: sage.sage12 }}>
                      ${product.price ? product.price.toFixed(2) : "0.00"}
                    </Text>
                  </Flex>

                  {/* Match Count */}
                  <Flex direction="column" align="center" style={{ width: "80px" }}>
                    <Flex align="center" gap="1">
                      <Sparkles size={14} color={product.match_count && product.match_count > 0 ? lime.lime10 : sage.sage9} />
                      <Text size="3" weight="medium">
                        {product.match_count || 0}
                      </Text>
                    </Flex>
                    <Text size="1" style={{ color: sage.sage10 }}>
                      {product.match_count === 1 ? "match" : "matches"}
                    </Text>
                  </Flex>

                  {/* Actions */}
                  <Flex gap="2" align="center">
                    <Button
                      variant="solid"
                      size="2"
                      color="lime"
                      onClick={() => router.push(`/dashboard/reels?product_id=${product.id}`)}
                    >
                      <Sparkles size={14} />
                      Find Creators
                    </Button>
                    <Button
                      variant="ghost"
                      size="2"
                      asChild
                      style={{
                        width: "36px",
                        height: "36px",
                        padding: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <a href={`https://${product.shop_domain}/products/${product.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} />
                      </a>
                    </Button>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          )}
        </Card>

      </Flex>
    </DashboardLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <Flex direction="column" gap="6">
          <Text size="8" weight="bold">Products</Text>
          <Text size="2" style={{ color: sage.sage11 }}>Loading...</Text>
        </Flex>
      </DashboardLayout>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
