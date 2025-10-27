"use client";

import { useState, useEffect } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, Select } from "@radix-ui/themes";
import { Search, ExternalLink, Eye, Loader2 } from "lucide-react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  shopifyUrl: string;
  status: "Active" | "Inactive" | "Out of Stock";
  matchCount: number;
  lastMatched: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState("https://matchamatcha.ca");

  useEffect(() => {
    fetchShopifyProducts();
  }, []);

  const fetchShopifyProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${shopifyStoreUrl}/products.json`);
      const data = await response.json();

      const transformedProducts: Product[] = data.products.map((product: ShopifyProduct) => ({
        id: product.id.toString(),
        name: product.title,
        description: product.body_html.replace(/<[^>]*>/g, "").substring(0, 150) + "...",
        price: parseFloat(product.variants[0]?.price || "0"),
        category: product.product_type || "Uncategorized",
        imageUrl: product.images[0]?.src || "/placeholder.svg",
        shopifyUrl: `${shopifyStoreUrl}/products/${product.handle}`,
        status: "Active" as const,
        matchCount: Math.floor(Math.random() * 20),
        lastMatched: `${Math.floor(Math.random() * 24)} hours ago`,
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching Shopify products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Inactive":
        return "gray";
      case "Out of Stock":
        return "red";
      default:
        return "gray";
    }
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  if (loading) {
    return (
      <DashboardLayout>
        <Flex align="center" justify="center" style={{ minHeight: "400px" }}>
          <Loader2 size={32} className="animate-spin" color="#B4D88B" />
        </Flex>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex align="center" justify="between">
          <Box>
            <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
              Product List
            </Text>
            <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
              Products from your Shopify store
            </Text>
          </Box>
          <Flex align="center" gap="2">
            <TextField.Root
              placeholder="Store URL"
              value={shopifyStoreUrl}
              onChange={(e) => setShopifyStoreUrl(e.target.value)}
              style={{ width: "200px" }}
            />
            <Button variant="outline" onClick={fetchShopifyProducts}>
              Sync Store
            </Button>
          </Flex>
        </Flex>

        {/* Product Stats */}
        <Flex gap="4" wrap="wrap">
          {[
            {
              label: "Total Products",
              value: products.length,
              subtext: `${products.filter((p) => p.status === "Active").length} active`,
            },
            {
              label: "Total Matches",
              value: products.reduce((sum, p) => sum + p.matchCount, 0),
              subtext: "Across all products",
            },
            {
              label: "Avg. Price",
              value:
                products.length > 0
                  ? `$${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}`
                  : "$0.00",
              subtext: "Per product",
            },
            {
              label: "Categories",
              value: categories.length - 1,
              subtext: "Product categories",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              style={{
                flex: "1 1 calc(25% - 1rem)",
                minWidth: "200px",
                padding: "1.25rem",
              }}
            >
              <Text size="2" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
                {stat.label}
              </Text>
              <Text size="6" weight="bold" style={{ display: "block", marginBottom: "0.25rem" }}>
                {stat.value}
              </Text>
              <Text size="1" style={{ color: "#737373" }}>
                {stat.subtext}
              </Text>
            </Card>
          ))}
        </Flex>

        {/* Products Table */}
        <Card
          style={{
            padding: "1.5rem",
          }}
        >
          {/* Search and Filter */}
          <Flex align="center" gap="3" mb="4">
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </Box>
            <Select.Root value={selectedCategory} onValueChange={setSelectedCategory}>
              <Select.Trigger style={{ width: "180px" }} />
              <Select.Content>
                {categories.map((category) => (
                  <Select.Item key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          {/* Product Grid */}
          <Flex direction="column" gap="3">
            {filteredProducts.map((product) => (
              <Flex
                key={product.id}
                align="center"
                gap="4"
                p="3"
                style={{
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}
              >
                  border: "1px solid #F5F5F5",
                <Box
                  style={{
                    position: "relative",
                    width: "60px",
                    height: "60px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </Box>

                {/* Product Info */}
                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                  <Text size="3" weight="medium">
                    {product.name}
                  </Text>
                  <Text size="1" style={{ color: "#737373", lineHeight: 1.4 }}>
                    {product.description}
                  </Text>
                </Flex>

                {/* Category */}
                <Badge variant="outline" style={{ flexShrink: 0 }}>
                  {product.category}
                </Badge>

                {/* Price */}
                <Text size="3" weight="bold" style={{ width: "80px", textAlign: "right" }}>
                  ${product.price}
                </Text>

                {/* Status */}
                <Badge color={getStatusColor(product.status)} style={{ width: "80px" }}>
                  {product.status}
                </Badge>

                {/* Matches */}
                <Flex align="center" gap="1" style={{ width: "60px" }}>
                  <Eye size={14} color="#737373" />
                  <Text size="2" weight="medium">
                    {product.matchCount}
                  </Text>
                </Flex>

                {/* Last Matched */}
                <Text size="1" style={{ color: "#737373", width: "100px" }}>
                  {product.lastMatched}
                </Text>

                {/* Action */}
                <Button variant="ghost" size="1" asChild>
                  <a href={product.shopifyUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                  </a>
                </Button>
              </Flex>
            ))}
          </Flex>
        </Card>
      </Flex>
    </DashboardLayout>
  );
}
