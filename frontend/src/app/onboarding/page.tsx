"use client";

import { useState } from "react";
import { Card, Flex, Text, Box, Badge, Button, TextField, TextArea, Select, Progress } from "@radix-ui/themes";
import { sage, lime } from "@radix-ui/colors";
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { MeshGradient } from "@mesh-gradient/react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    id: "business",
    title: "Business Info",
    description: "Tell us about your business",
  },
  {
    id: "shopify",
    title: "Connect Shopify",
    description: "Link your product catalog",
  },
  {
    id: "targeting",
    title: "Set Preferences",
    description: "Define your target audience",
  },
  {
    id: "branding",
    title: "Brand Assets",
    description: "Upload your brand materials",
  },
];

function BusinessInfoStep() {
  return (
    <Flex direction="column" gap="4">
      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Business Name *
          </Text>
          <TextField.Root placeholder="Your Business Name" size="3" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Contact Name *
          </Text>
          <TextField.Root placeholder="John Doe" size="3" />
        </Box>
      </Flex>

      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Business Email *
          </Text>
          <TextField.Root type="email" placeholder="contact@yourbusiness.com" size="3" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Industry *
          </Text>
          <Select.Root>
             <Select.Trigger placeholder="Select your industry" style={{ width: "100%", height: "40px" }} />
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
        <Text size="2" weight="medium" mb="2" as="label">
          Business Description
        </Text>
        <TextArea
          placeholder="Tell creators about your business and what makes your products special..."
          rows={4}
          size="3"
        />
      </Box>
    </Flex>
  );
}

function ShopifyConnectStep() {
  const [isConnected, setIsConnected] = useState(false);
  const [shopName, setShopName] = useState("");

  const handleConnectShopify = () => {
    if (!shopName) return;
    const shop = shopName.includes(".myshopify.com") ? shopName : `${shopName}.myshopify.com`;
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true);
    }, 1500);
  };

  return (
    <Flex direction="column" gap="4">
      {!isConnected ? (
        <>
          <Box>
            <Text size="2" weight="medium" mb="2" as="label">
              Shopify Store Name *
            </Text>
            <Flex gap="2" align="center">
              <TextField.Root
                placeholder="your-store"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                style={{ flex: 1 }}
                size="3"
              />
              <Text size="2" style={{ color: sage.sage11 }}>
                .myshopify.com
              </Text>
            </Flex>
            <Text size="1" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
              Enter your Shopify store name (without .myshopify.com)
            </Text>
          </Box>

          <Button
            onClick={handleConnectShopify}
            disabled={!shopName}
            variant="solid"
            color="lime"
            size="3"
            style={{ width: "60%", margin: "0 auto" }}
          >
            Install Maatchaa on Shopify
          </Button>
        </>
      ) : (
        <Flex direction="column" gap="3" align="center" style={{ padding: "2rem 0" }}>
          <CheckCircle size={48} color={lime.lime9} />
          <Text size="4" weight="bold" style={{ color: lime.lime11 }}>
            Store Connected Successfully!
          </Text>
          <Text size="2" style={{ color: sage.sage11 }}>
            {shopName}.myshopify.com
          </Text>
        </Flex>
      )}
    </Flex>
  );
}

function TargetingStep() {
  return (
    <Flex direction="column" gap="4">
      <Box>
        <Text size="2" weight="medium" mb="2" as="label">
          Target Keywords
        </Text>
        <TextArea
          placeholder="Enter keywords related to your products (e.g., kitchen, cooking, gadgets, home)"
          rows={3}
          size="3"
        />
        <Text size="1" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
          These keywords help our AI find relevant reels for your products
        </Text>
      </Box>

      <Flex gap="4">
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Minimum Views
          </Text>
          <Select.Root>
            <Select.Trigger placeholder="Select minimum views" style={{ width: "100%", height: "40px" }} />
            <Select.Content>
              <Select.Item value="10k">10,000+ views</Select.Item>
              <Select.Item value="50k">50,000+ views</Select.Item>
              <Select.Item value="100k">100,000+ views</Select.Item>
              <Select.Item value="500k">500,000+ views</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium" mb="2" as="label">
            Creator Tier
          </Text>
          <Select.Root>
            <Select.Trigger placeholder="Select creator tier" style={{ width: "100%", height: "40px" }} />
            <Select.Content>
              <Select.Item value="micro">Micro (1K-100K followers)</Select.Item>
              <Select.Item value="macro">Macro (100K-1M followers)</Select.Item>
              <Select.Item value="mega">Mega (1M+ followers)</Select.Item>
              <Select.Item value="all">All tiers</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      <Box style={{ width: "60%", margin: "0 auto" }}>
        <Text size="2" weight="medium" mb="2" as="label">
          Budget Range (Monthly)
        </Text>
        <Select.Root>
          <Select.Trigger placeholder="Select your budget" style={{ width: "100%", height: "40px" }} />
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
      <Box>
        <Text size="2" weight="medium" mb="2" as="label">
          Brand Logo
        </Text>
        <Box
          style={{
            border: `2px dashed ${sage.sage6}`,
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <Text size="2" style={{ color: sage.sage11, display: "block", marginBottom: "0.5rem" }}>
            Drop your logo here or click to upload
          </Text>
          <Button variant="soft" size="2">
            Choose File
          </Button>
        </Box>
      </Box>

      <Card style={{ background: sage.sage2 }}>
        <Text size="2" style={{ color: sage.sage12 }}>
          <strong>You&apos;re all set!</strong> Your Maatchaa account is ready. You can always update these settings later in your profile.
        </Text>
      </Card>
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
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", zIndex: 50, overflow: "hidden" }}>
      {/* Background Gradient */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: -1 }}>
        <MeshGradient
          className="w-full h-full opacity-80"
          options={{
            colors: ['#d2d3ff', '#7ff1c5', '#24fbfb', '#60a5fa'],
            isStatic: true,
            seed: 456,
            appearance: 'default'
          }}
        />
      </div>

      <Box style={{ width: "100%", maxWidth: "650px", maxHeight: "90vh", padding: "2rem", background: "white", borderRadius: "16px", overflowY: "auto" }}>
        <Flex direction="column" gap="4">
          {/* Header */}
          <Flex direction="column" gap="4">
            <Flex align="center" justify="between">
              <Box>
                <Text size="8" weight="bold" as="h1">
                  Welcome to Maatchaa
                </Text>
                <Text size="3" style={{ color: sage.sage11, marginTop: "0.5rem", display: "block" }}>
                  Let&apos;s get your business set up for creator partnerships
                </Text>
              </Box>
              <Badge size="2" color="gray">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </Flex>

            <Progress value={progress} color="lime" style={{ border: "none" }} />

            {/* Step Navigation */}
            <Flex align="center" gap="2" style={{ overflowX: "auto" }}>
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = completedSteps.has(index);
                const isClickable = index <= currentStep || completedSteps.has(index);

                return (
                  <Button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    variant={isActive ? "solid" : isCompleted ? "soft" : "outline"}
                    color={isActive || isCompleted ? "lime" : "gray"}
                    size="2"
                    style={{
                      flex: "1 1 0",
                      minWidth: "140px",
                      justifyContent: "center",
                    }}
                  >
                    {step.title}
                  </Button>
                );
              })}
            </Flex>
          </Flex>

          {/* Step Content */}
          <Card style={{ minHeight: "420px" }}>
            <Flex direction="column" gap="4">
              <Box mb="2">
                <Text size="5" weight="bold" as="h2">
                  {steps[currentStep].title}
                </Text>
              </Box>

              <Box>
                {currentStep === 0 && <BusinessInfoStep />}
                {currentStep === 1 && <ShopifyConnectStep />}
                {currentStep === 2 && <TargetingStep />}
                {currentStep === 3 && <BrandingStep />}
              </Box>
            </Flex>
          </Card>

          {/* Navigation Buttons */}
          <Flex align="center" justify="between">
            <Button variant="soft" color="gray" onClick={handlePrevious} disabled={currentStep === 0} size="3">
              <ArrowLeft size={16} />
              Previous
            </Button>

            <Button onClick={handleNext} variant="solid" color="lime" size="3">
              {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
              {currentStep < steps.length - 1 && <ArrowRight size={16} />}
            </Button>
          </Flex>
        </Flex>
      </Box>
    </div>
  );
}
