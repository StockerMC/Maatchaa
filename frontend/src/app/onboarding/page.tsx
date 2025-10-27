"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, TextArea, Select } from "@radix-ui/themes";
import { CheckCircle, Store, Target, Palette, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Progress } from "@radix-ui/themes";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: "business",
    title: "Business Info",
    description: "Tell us about your business",
    icon: <Store size={20} />,
  },
  {
    id: "shopify",
    title: "Connect Shopify",
    description: "Link your product catalog",
    icon: <Store size={20} />,
  },
  {
    id: "targeting",
    title: "Set Preferences",
    description: "Define your target audience",
    icon: <Target size={20} />,
  },
  {
    id: "branding",
    title: "Brand Assets",
    description: "Upload your brand materials",
    icon: <Palette size={20} />,
  },
];

function BusinessInfoStep() {
  return (
    <Flex direction="column" gap="4">
      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Business Name *
          </Text>
          <TextField.Root placeholder="Your Business Name" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Contact Name *
          </Text>
          <TextField.Root placeholder="John Doe" />
        </Box>
      </Flex>

      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Business Email *
          </Text>
          <TextField.Root type="email" placeholder="contact@yourbusiness.com" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Industry *
          </Text>
          <Select.Root>
            <Select.Trigger placeholder="Select your industry" />
            <Select.Content>
              <Select.Item value="fashion">Fashion & Apparel</Select.Item>
              <Select.Item value="beauty">Beauty & Cosmetics</Select.Item>
              <Select.Item value="home">Home & Garden</Select.Item>
              <Select.Item value="tech">Technology</Select.Item>
              <Select.Item value="fitness">Health & Fitness</Select.Item>
              <Select.Item value="food">Food & Beverage</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      <Box>
        <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
          Business Description
        </Text>
        <TextArea
          placeholder="Tell creators about your business and what makes your products special..."
          rows={4}
        />
      </Box>
    </Flex>
  );
}

function ShopifyConnectStep() {
  const [isConnected, setIsConnected] = useState(false);
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!shopifyUrl) return;

    setLoading(true);
    try {
      const storeUrl = shopifyUrl.includes("http") ? shopifyUrl : `https://${shopifyUrl}`;
      const response = await fetch(`${storeUrl}/products.json`);

      if (response.ok) {
        const data = await response.json();
        console.log("Connected to Shopify store:", data.products.length, "products found");
        setIsConnected(true);
      } else {
        alert("Could not connect to Shopify store. Please check the URL.");
      }
    } catch (error) {
      console.error("Error connecting to Shopify:", error);
      alert("Error connecting to Shopify store. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="3">
      {!isConnected ? (
        <>
          <Box style={{ textAlign: "center", padding: "1rem 0" }}>
            <Store size={48} color="#737373" style={{ margin: "0 auto 0.5rem" }} />
            <Text size="3" weight="bold" style={{ display: "block", marginBottom: "0.25rem" }}>
              Connect Your Shopify Store
            </Text>
            <Text size="1" style={{ color: "#737373" }}>
              We&apos;ll sync your products automatically
            </Text>
          </Box>

          <Box>
            <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
              Store URL
            </Text>
            <TextField.Root
              placeholder="your-store.myshopify.com"
              value={shopifyUrl}
              onChange={(e) => setShopifyUrl(e.target.value)}
            />
          </Box>

          <Button
            onClick={handleConnect}
            disabled={loading || !shopifyUrl}
            style={{ width: "100%", background: "#B4D88B", color: "#000" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Store size={16} />
                Connect Shopify Store
              </>
            )}
          </Button>
        </>
      ) : (
        <Box style={{ textAlign: "center", padding: "1rem 0" }}>
          <CheckCircle size={48} color="#10B981" style={{ margin: "0 auto 0.5rem" }} />
          <Text size="3" weight="bold" style={{ display: "block", marginBottom: "0.25rem", color: "#10B981" }}>
            Store Connected!
          </Text>
          <Text size="1" style={{ color: "#737373" }}>
            Connected to {shopifyUrl}
          </Text>
        </Box>
      )}
    </Flex>
  );
}

function TargetingStep() {
  return (
    <Flex direction="column" gap="4">
      <Box>
        <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
          Target Keywords
        </Text>
        <TextArea
          placeholder="Enter keywords related to your products (e.g., kitchen, cooking, gadgets, home)"
          rows={3}
        />
        <Text size="1" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
          These keywords help our AI find relevant reels for your products
        </Text>
      </Box>

      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Minimum Views
          </Text>
          <Select.Root>
            <Select.Trigger placeholder="Select minimum views" />
            <Select.Content>
              <Select.Item value="10k">10,000+ views</Select.Item>
              <Select.Item value="50k">50,000+ views</Select.Item>
              <Select.Item value="100k">100,000+ views</Select.Item>
              <Select.Item value="500k">500,000+ views</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Creator Tier
          </Text>
          <Select.Root>
            <Select.Trigger placeholder="Select creator tier" />
            <Select.Content>
              <Select.Item value="micro">Micro (1K-100K followers)</Select.Item>
              <Select.Item value="macro">Macro (100K-1M followers)</Select.Item>
              <Select.Item value="mega">Mega (1M+ followers)</Select.Item>
              <Select.Item value="all">All tiers</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      <Box>
        <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
          Budget Range (Monthly)
        </Text>
        <Select.Root>
          <Select.Trigger placeholder="Select your budget" />
          <Select.Content>
            <Select.Item value="500">$500 - $1,000</Select.Item>
            <Select.Item value="1000">$1,000 - $2,500</Select.Item>
            <Select.Item value="2500">$2,500 - $5,000</Select.Item>
            <Select.Item value="5000">$5,000+</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>
    </Flex>
  );
}

function BrandingStep() {
  return (
    <Flex direction="column" gap="4">
      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Brand Logo
          </Text>
          <Box
            style={{
              border: "2px dashed #E5E5E5",
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <Text size="2" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
              Drop your logo here or click to upload
            </Text>
            <Button variant="outline" size="2">
              Choose File
            </Button>
          </Box>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" style={{ display: "block", marginBottom: "0.5rem" }}>
            Brand Guidelines
          </Text>
          <Box
            style={{
              border: "2px dashed #E5E5E5",
              borderRadius: "8px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <Text size="2" style={{ color: "#737373", display: "block", marginBottom: "0.5rem" }}>
              Upload brand guidelines (PDF)
            </Text>
            <Button variant="outline" size="2">
              Choose File
            </Button>
          </Box>
        </Box>
      </Flex>

      <Box
        p="4"
        style={{
          background: "#F5F5F5",
          borderRadius: "8px",
        }}
      >
        <Text size="2" style={{ color: "#737373" }}>
          <strong>You&apos;re all set!</strong> Your MATCHAA account is ready. You can always update these settings later in
          your profile.
        </Text>
      </Box>
    </Flex>
  );
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - redirect to dashboard
      window.location.href = "/dashboard/overview";
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50 }}>
      <Card style={{ width: "100%", maxWidth: "650px", maxHeight: "90vh", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflowY: "auto" }}>
        <Flex direction="column" gap="4">
          {/* Progress Header */}
          <Flex direction="column" gap="4">
            <Flex align="center" justify="between">
              <Box>
                <Text size="8" weight="bold" style={{ color: "#1A1A1A" }}>
                  Welcome to Maatchaa
                </Text>
                <Text size="3" style={{ color: "#737373", marginTop: "0.5rem", display: "block" }}>
                  Let&apos;s get your business set up for creator partnerships
                </Text>
              </Box>
              <Badge size="2">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </Flex>

            <Progress value={progress} />

            {/* Step Navigation */}
            <Flex align="center" justify="between">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = completedSteps.has(index);
                const isClickable = index <= currentStep || completedSteps.has(index);

                return (
                  <Button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    variant={isActive ? "solid" : "outline"}
                    size="2"
                    style={{
                      background: isActive ? "#B4D88B" : isCompleted ? "#10B98115" : "transparent",
                      color: isActive ? "#000" : isCompleted ? "#10B981" : "#737373",
                      borderColor: isActive ? "#B4D88B" : "#E5E5E5",
                    }}
                  >
                    {isCompleted ? <CheckCircle size={16} /> : step.icon}
                    <span style={{ display: "none", "@media (minWidth: 640px)": { display: "inline" } }}>
                      {step.title}
                    </span>
                  </Button>
                );
              })}
            </Flex>
          </Flex>

          {/* Step Content */}
          <Card
            style={{
              padding: "2rem",
            }}
          >
            <Flex direction="column" gap="4">
              <Box>
                <Flex align="center" gap="2" mb="2">
                  {steps[currentStep].icon}
                  <Text size="5" weight="bold" style={{ color: "#1A1A1A" }}>
                    {steps[currentStep].title}
                  </Text>
                </Flex>
                <Text size="2" style={{ color: "#737373" }}>
                  {steps[currentStep].description}
                </Text>
              </Box>

              <Box pt="2">
                {currentStep === 0 && <BusinessInfoStep />}
                {currentStep === 1 && <ShopifyConnectStep />}
                {currentStep === 2 && <TargetingStep />}
                {currentStep === 3 && <BrandingStep />}
              </Box>
            </Flex>
          </Card>

          {/* Navigation Buttons */}
          <Flex align="center" justify="between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft size={16} />
              Previous
            </Button>

            <Button onClick={handleNext} style={{ background: "#B4D88B", color: "#000" }}>
              {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
              {currentStep < steps.length - 1 && <ArrowRight size={16} />}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </div>
  );
}
