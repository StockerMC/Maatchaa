"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, Select, Dialog } from "@radix-ui/themes";
import { sage, lime } from "@radix-ui/colors";
import { Search, ExternalLink, Eye, Loader2, X, Package } from "lucide-react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const POSITIVE_COLOR = "#5c9a31";
const NEGATIVE_COLOR = "#f81f1f";

interface ShopifyVariant {
  id: number;
  title: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image: {
    id: number;
    src: string;
    alt: string | null;
    width: number;
    height: number;
  } | null;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string | null;
  position: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

interface ShopifyImage {
  id: number;
  created_at: string;
  position: number;
  updated_at: string;
  product_id: number;
  variant_ids: number[];
  src: string;
  width: number;
  height: number;
  alt?: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: Array<{
    name: string;
    position: number;
    values: string[];
  }>;
}

interface Product {
  id: string;
  shopifyId: number;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  vendor: string;
  imageUrl: string;
  images: ShopifyImage[];
  shopifyUrl: string;
  status: "Active" | "Inactive" | "Out of Stock";
  matchCount: number;
  lastMatched: string;
  variants: ShopifyVariant[];
  tags: string[];
  options: Array<{
    name: string;
    position: number;
    values: string[];
  }>;
  handle: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState("https://matchamatcha.ca");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchShopifyProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${shopifyStoreUrl}/products.json`);
      const data = await response.json();

      const transformedProducts: Product[] = data.products.map((product: ShopifyProduct) => {
        // Determine product status based on variant availability
        const hasAvailableVariants = product.variants.some((v) => v.available);
        const status = hasAvailableVariants ? "Active" : "Out of Stock";

        // Get pricing info
        const minPrice = Math.min(...product.variants.map((v) => parseFloat(v.price)));
        const compareAtPrice = product.variants[0]?.compare_at_price
          ? parseFloat(product.variants[0].compare_at_price)
          : null;

        // Clean HTML from description
        const cleanDescription = product.body_html
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();

        return {
          id: product.id.toString(),
          shopifyId: product.id,
          name: product.title,
          description: cleanDescription.substring(0, 150) + (cleanDescription.length > 150 ? "..." : ""),
          price: minPrice,
          compareAtPrice,
          category: product.product_type || "Uncategorized",
          vendor: product.vendor,
          imageUrl: product.images[0]?.src || "/placeholder.svg",
          images: product.images,
          shopifyUrl: `${shopifyStoreUrl}/products/${product.handle}`,
          status,
          matchCount: Math.floor(Math.random() * 20), // TODO: Replace with actual match data from backend
          lastMatched: `${Math.floor(Math.random() * 24)} hours ago`, // TODO: Replace with actual data
          variants: product.variants,
          tags: product.tags,
          options: product.options,
          handle: product.handle,
        };
      });

      setProducts(transformedProducts);

      // TODO: Optionally save to backend for persistence
      // await saveProductsToBackend(transformedProducts);
    } catch (error) {
      console.error("Error fetching Shopify products:", error);
    } finally {
      setLoading(false);
    }
  }, [shopifyStoreUrl]);

  useEffect(() => {
    fetchShopifyProducts();
  }, [fetchShopifyProducts]);

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
          <Loader2 size={32} className="animate-spin" color={lime.lime9} />
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
            <Text size="8" weight="bold" style={{ color: sage.sage12 }}>
              Product List
            </Text>
            <Text size="3" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
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
            <Button variant="solid" onClick={fetchShopifyProducts} color="lime">
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
              changeNumber: `${products.filter((p) => p.status === "Active").length}`,
              changeDesc: "active",
            },
            {
              label: "Avg. Price",
              value:
                products.length > 0
                  ? `$${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)}`
                  : "$0.00",
              changeNumber: "",
              changeDesc: "across all products",
            },
            {
              label: "Unmatched Products",
              value: products.filter((p) => p.matchCount === 0).length,
              changeNumber: products.filter((p) => p.matchCount > 0 && p.matchCount < 5).length.toString(),
              changeDesc: "matching",
            },
            {
              label: "Total Matches",
              value: products.reduce((sum, p) => sum + p.matchCount, 0),
              changeNumber: products.length > 0
                ? (products.reduce((sum, p) => sum + p.matchCount, 0) / products.length).toFixed(1)
                : "0",
              changeDesc: "matches per product",
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
                <Text size="2" style={{ color: "sage.sage11", fontWeight: 500 }}>
                  {stat.label}
                </Text>
                <Text size="7" weight="medium" style={{ color: "#000" }}>
                  {stat.value}
                </Text>
                <Flex align="center" gap="1">
                  {stat.changeNumber && (
                    <Text size="1" style={{ color: POSITIVE_COLOR, fontWeight: 600 }}>
                      {stat.changeNumber}
                    </Text>
                  )}
                  <Text size="1" style={{ color: "#000", fontWeight: 400 }}>
                    {stat.changeDesc}
                  </Text>
                </Flex>
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
            {filteredProducts.map((product, index) => (
              <Flex
                key={product.id}
                align="center"
                gap="4"
                p="3"
                style={{
                  border: "1px solid {sage.sage6}",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: index % 2 === 0 ? "white" : "#FAFAF9",
                }}
                onClick={() => setSelectedProduct(product)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${lime.lime9}`;
                  e.currentTarget.style.background = index % 2 === 0 ? "#F5F5F4" : "#F0F0EF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = sage.sage6;
                  e.currentTarget.style.background = index % 2 === 0 ? "white" : "#FAFAF9";
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
                  <Flex align="center" gap="2">
                    <Text size="3" weight="medium">
                      {product.name}
                    </Text>
                    {product.variants.length > 1 && (
                      <Badge size="1" variant="soft" color="blue">
                        {product.variants.length} variants
                      </Badge>
                    )}
                  </Flex>
                  <Text size="1" style={{ color: sage.sage11, lineHeight: 1.4, fontWeight: 400 }}>
                    {product.vendor} • {product.description}
                  </Text>
                  {product.options.length > 0 && (
                    <Text size="1" style={{ color: sage.sage10 }}>
                      Options: {product.options.map((opt) => opt.name).join(", ")}
                    </Text>
                  )}
                </Flex>

                {/* Category */}
                <Badge variant="soft" style={{ flexShrink: 0 }}>
                  {product.category}
                </Badge>

                {/* Price */}
                <Flex direction="column" align="end" style={{ width: "100px" }}>
                  <Text size="3" weight="medium">
                    ${product.price.toFixed(2)}
                  </Text>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <Text size="1" style={{ color: sage.sage10, textDecoration: "line-through" }}>
                      ${product.compareAtPrice.toFixed(2)}
                    </Text>
                  )}
                </Flex>

                {/* Status */}
                <Box style={{ width: "80px", display: "flex", justifyContent: "center" }}>
                  <Badge color={product.status === "Active" ? "purple" : getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                </Box>

                {/* Matches */}
                <Flex align="center" gap="1" style={{ width: "60px" }}>
                  <Eye size={14} color={sage.sage11} />
                  <Text size="2" weight="medium">
                    {product.matchCount}
                  </Text>
                </Flex>

                {/* Last Matched */}
                <Text size="1" style={{ color: sage.sage11, width: "100px" }}>
                  {product.lastMatched}
                </Text>

                {/* Actions */}
                <Flex gap="2" align="center">
                  <Button
                    variant="soft"
                    size="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                  >
                    <Package size={14} />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="1"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "32px",
                      height: "32px",
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <a href={product.shopifyUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Card>

        {/* Product Details Modal */}
        <Dialog.Root open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <Dialog.Content style={{ maxWidth: 900, maxHeight: "90vh", overflow: "auto" }}>
            {selectedProduct && (
              <Flex direction="column" gap="4">
                <Flex align="center" justify="between">
                  <Dialog.Title size="6">{selectedProduct.name}</Dialog.Title>
                  <Dialog.Close>
                    <Button variant="ghost" size="1">
                      <X size={20} />
                    </Button>
                  </Dialog.Close>
                </Flex>

                <Flex gap="6">
                  {/* Images Section */}
                  <Box style={{ flex: "0 0 400px" }}>
                    <Box
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "400px",
                        borderRadius: "12px",
                        overflow: "hidden",
                        marginBottom: "1rem",
                      }}
                    >
                      <Image
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                    {selectedProduct.images.length > 1 && (
                      <Flex gap="2" wrap="wrap">
                        {selectedProduct.images.slice(0, 4).map((img) => (
                          <Box
                            key={img.id}
                            style={{
                              position: "relative",
                              width: "90px",
                              height: "90px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "1px solid {sage.sage6}",
                            }}
                          >
                            <Image
                              src={img.src}
                              alt={img.alt || selectedProduct.name}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </Box>
                        ))}
                      </Flex>
                    )}
                  </Box>

                  {/* Product Details */}
                  <Flex direction="column" gap="4" style={{ flex: 1 }}>
                    <Box>
                      <Flex align="center" gap="2" mb="2">
                        <Badge color={getStatusColor(selectedProduct.status)}>
                          {selectedProduct.status}
                        </Badge>
                        <Badge variant="soft">{selectedProduct.category}</Badge>
                      </Flex>
                      <Text size="2" style={{ color: sage.sage11 }}>
                        by {selectedProduct.vendor}
                      </Text>
                    </Box>

                    {/* Pricing */}
                    <Box>
                      <Flex align="baseline" gap="2">
                        <Text size="7" weight="medium">
                          ${selectedProduct.price.toFixed(2)}
                        </Text>
                        {selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price && (
                          <Text size="4" style={{ color: sage.sage10, textDecoration: "line-through" }}>
                            ${selectedProduct.compareAtPrice.toFixed(2)}
                          </Text>
                        )}
                      </Flex>
                      {selectedProduct.variants.length > 1 && (
                        <Text size="1" style={{ color: sage.sage11 }}>
                          Starting price
                        </Text>
                      )}
                    </Box>

                    {/* Description */}
                    <Box>
                      <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                        Description
                      </Text>
                      <Text size="2" style={{ color: sage.sage11, lineHeight: 1.6 }}>
                        {selectedProduct.description}
                      </Text>
                    </Box>

                    {/* Options */}
                    {selectedProduct.options.length > 0 && (
                      <Box>
                        <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                          Available Options
                        </Text>
                        <Flex direction="column" gap="2">
                          {selectedProduct.options.map((option) => (
                            <Box key={option.name}>
                              <Text size="1" weight="medium" style={{ color: sage.sage11 }}>
                                {option.name}:
                              </Text>
                              <Flex gap="1" wrap="wrap" mt="1">
                                {option.values.map((value) => (
                                  <Badge key={value} variant="soft" size="1">
                                    {value}
                                  </Badge>
                                ))}
                              </Flex>
                            </Box>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* Variants */}
                    <Box>
                      <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                        Variants ({selectedProduct.variants.length})
                      </Text>
                      <Flex direction="column" gap="2" style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {selectedProduct.variants.map((variant) => (
                          <Flex
                            key={variant.id}
                            align="center"
                            justify="between"
                            p="2"
                            style={{
                              border: "1px solid {sage.sage6}",
                              borderRadius: "6px",
                              background: variant.available ? "white" : sage.sage2,
                            }}
                          >
                            <Flex direction="column" gap="1">
                              <Text size="2">{variant.title}</Text>
                              <Text size="1" style={{ color: sage.sage11 }}>
                                SKU: {variant.sku}
                              </Text>
                            </Flex>
                            <Flex align="center" gap="2">
                              <Text size="2" weight="medium">
                                ${parseFloat(variant.price).toFixed(2)}
                              </Text>
                              <Badge color={variant.available ? "green" : "red"} size="1">
                                {variant.available ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </Flex>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>

                    {/* Tags */}
                    {selectedProduct.tags.length > 0 && (
                      <Box>
                        <Text size="2" weight="medium" mb="2" style={{ display: "block" }}>
                          Tags
                        </Text>
                        <Flex gap="1" wrap="wrap">
                          {selectedProduct.tags.slice(0, 10).map((tag) => (
                            <Badge key={tag} variant="soft" size="1">
                              {tag}
                            </Badge>
                          ))}
                          {selectedProduct.tags.length > 10 && (
                            <Badge variant="soft" size="1">
                              +{selectedProduct.tags.length - 10} more
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                    )}

                    {/* Actions */}
                    <Flex gap="2" mt="2">
                      <Button asChild style={{ flex: 1 }}>
                        <a href={selectedProduct.shopifyUrl} target="_blank" rel="noopener noreferrer">
                          View in Shopify
                          <ExternalLink size={16} style={{ marginLeft: "0.5rem" }} />
                        </a>
                      </Button>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            )}
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </DashboardLayout>
  );
}
