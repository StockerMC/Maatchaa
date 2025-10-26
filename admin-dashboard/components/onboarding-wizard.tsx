"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Store, Target, Palette, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    id: "business",
    title: "Business Info",
    description: "Tell us about your business",
    icon: <Store className="w-5 h-5" />,
  },
  {
    id: "shopify",
    title: "Connect Shopify",
    description: "Link your product catalog",
    icon: <Store className="w-5 h-5" />,
  },
  {
    id: "targeting",
    title: "Set Preferences",
    description: "Define your target audience",
    icon: <Target className="w-5 h-5" />,
  },
  {
    id: "branding",
    title: "Brand Assets",
    description: "Upload your brand materials",
    icon: <Palette className="w-5 h-5" />,
  },
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const handleNext = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep))
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Welcome to MATCHAA</h1>
            <p className="text-muted-foreground">Let's get your business set up for creator partnerships</p>
          </div>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        <Progress value={progress} className="w-full" />

        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : completedSteps.has(index)
                    ? "bg-green-100 text-green-800"
                    : index < currentStep
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              }`}
              disabled={index > currentStep && !completedSteps.has(index)}
            >
              {completedSteps.has(index) ? <CheckCircle className="w-4 h-4" /> : step.icon}
              <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && <BusinessInfoStep />}
          {currentStep === 1 && <ShopifyConnectStep />}
          {currentStep === 2 && <TargetingStep />}
          {currentStep === 3 && <BrandingStep />}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <Button onClick={handleNext}>
          {currentStep === steps.length - 1 ? "Complete Setup" : "Next"}
          {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}

function BusinessInfoStep() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input id="businessName" placeholder="Your Business Name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name *</Label>
          <Input id="contactName" placeholder="John Doe" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Business Email *</Label>
          <Input id="email" type="email" placeholder="contact@yourbusiness.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fashion">Fashion & Apparel</SelectItem>
              <SelectItem value="beauty">Beauty & Cosmetics</SelectItem>
              <SelectItem value="home">Home & Garden</SelectItem>
              <SelectItem value="tech">Technology</SelectItem>
              <SelectItem value="fitness">Health & Fitness</SelectItem>
              <SelectItem value="food">Food & Beverage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          placeholder="Tell creators about your business and what makes your products special..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  )
}

function ShopifyConnectStep() {
  const [isConnected, setIsConnected] = useState(false)
  const [shopifyUrl, setShopifyUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (!shopifyUrl) return

    setLoading(true)
    try {
      const storeUrl = shopifyUrl.includes("http") ? shopifyUrl : `https://${shopifyUrl}`
      const response = await fetch(`${storeUrl}/products.json`)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Connected to Shopify store:", data.products.length, "products found")
        setIsConnected(true)
      } else {
        alert("Could not connect to Shopify store. Please check the URL.")
      }
    } catch (error) {
      console.error("[v0] Error connecting to Shopify:", error)
      alert("Error connecting to Shopify store. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isConnected ? (
        <>
          <div className="text-center space-y-4">
            <Store className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Connect Your Shopify Store</h3>
              <p className="text-muted-foreground">We'll automatically sync your products and enable AI matching</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopifyUrl">Shopify Store URL</Label>
            <Input
              id="shopifyUrl"
              placeholder="your-store.myshopify.com or https://your-store.com"
              value={shopifyUrl}
              onChange={(e) => setShopifyUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter your Shopify store URL (e.g., matchamatcha.ca or your-store.myshopify.com)
            </p>
          </div>

          <Button onClick={handleConnect} className="w-full" disabled={loading || !shopifyUrl}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Store className="w-4 h-4 mr-2" />
                Connect Shopify Store
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Store Connected!</h3>
            <p className="text-muted-foreground">Successfully connected to {shopifyUrl}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TargetingStep() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Target Keywords</Label>
        <Textarea
          placeholder="Enter keywords related to your products (e.g., kitchen, cooking, gadgets, home)"
          className="min-h-[80px]"
        />
        <p className="text-sm text-muted-foreground">
          These keywords help our AI find relevant reels for your products
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Minimum Views</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select minimum views" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10k">10,000+ views</SelectItem>
              <SelectItem value="50k">50,000+ views</SelectItem>
              <SelectItem value="100k">100,000+ views</SelectItem>
              <SelectItem value="500k">500,000+ views</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Creator Tier</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select creator tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="micro">Micro (1K-100K followers)</SelectItem>
              <SelectItem value="macro">Macro (100K-1M followers)</SelectItem>
              <SelectItem value="mega">Mega (1M+ followers)</SelectItem>
              <SelectItem value="all">All tiers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Budget Range (Monthly)</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select your budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="500">$500 - $1,000</SelectItem>
            <SelectItem value="1000">$1,000 - $2,500</SelectItem>
            <SelectItem value="2500">$2,500 - $5,000</SelectItem>
            <SelectItem value="5000">$5,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function BrandingStep() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <Palette className="w-12 h-12 mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold">Brand Assets (Optional)</h3>
        <p className="text-muted-foreground">
          Upload your brand materials to help creators represent your brand accurately
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Brand Logo</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
              Choose File
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Brand Guidelines</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">Upload brand guidelines (PDF)</p>
            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
              Choose File
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Brand Colors</Label>
        <div className="flex gap-2">
          <Input placeholder="#000000" className="w-24" />
          <Input placeholder="#FFFFFF" className="w-24" />
          <Input placeholder="#FF0000" className="w-24" />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>You're all set!</strong> Your MATCHAA account is ready. You can always update these settings later in
          your profile.
        </p>
      </div>
    </div>
  )
}
