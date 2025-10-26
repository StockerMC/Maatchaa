"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ExternalLink, Store, CheckCircle, AlertCircle, Upload } from "lucide-react"

export default function ProfileSettingsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [shopifyUrl, setShopifyUrl] = useState("")
  const [syncEnabled, setSyncEnabled] = useState(true)

  const handleShopifyConnect = () => {
    // In a real app, this would initiate Shopify OAuth flow
    setIsConnected(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Business Profile</h1>
        <p className="text-muted-foreground">Manage your business information and Shopify integration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Business Information</CardTitle>
          <CardDescription>Basic details about your business for creator partnerships</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" placeholder="Your Business Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" placeholder="John Doe" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Business Email</Label>
                <Input id="email" type="email" placeholder="contact@yourbusiness.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 (555) 123-4567" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://yourbusiness.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                placeholder="Tell creators about your business and products..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit">Save Business Info</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Store className="w-5 h-5" />
            Shopify Integration
          </CardTitle>
          <CardDescription>
            Connect your Shopify store to automatically sync products and enable AI matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 border border-[var(--lime-7)] bg-[var(--lime-3)] rounded-lg">
                <AlertCircle className="w-4 h-4 text-[var(--lime-11)]" />
                <span className="text-sm text-[var(--lime-11)]">Shopify store not connected</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopifyStore">Shopify Store URL</Label>
                <Input
                  id="shopifyStore"
                  placeholder="your-store.myshopify.com"
                  value={shopifyUrl}
                  onChange={(e) => setShopifyUrl(e.target.value)}
                />
              </div>

              <Button onClick={handleShopifyConnect} className="w-full">
                <Store className="w-4 h-4 mr-2" />
                Connect Shopify Store
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>By connecting your Shopify store, you'll be able to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Automatically sync your product catalog</li>
                  <li>Enable AI-powered product matching with reels</li>
                  <li>Track performance and conversions</li>
                  <li>Manage inventory and pricing</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 border border-green-200 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">Shopify store connected successfully</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Store URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value="your-store.myshopify.com" disabled />
                    <Button variant="outline" size="icon" asChild>
                      <a href="https://your-store.myshopify.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Connection Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    <span className="text-sm text-muted-foreground">Last sync: 2 hours ago</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-sync Products</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync new products and updates from Shopify
                    </p>
                  </div>
                  <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-muted-foreground">Products Synced</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">89%</div>
                    <div className="text-sm text-muted-foreground">Match Rate</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Sync Now</Button>
                  <Button variant="outline">Disconnect Store</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Targeting Preferences</CardTitle>
          <CardDescription>Set your preferences for creator and reel matching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <SelectItem value="1m">1,000,000+ views</SelectItem>
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

          <Button>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Brand Assets</CardTitle>
          <CardDescription>Upload your brand assets for creator partnerships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop your logo here or click to upload</p>
                <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                  Choose File
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Brand Guidelines</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
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
              <Button variant="outline" size="sm">
                Add Color
              </Button>
            </div>
          </div>

          <Button>Save Brand Assets</Button>
        </CardContent>
      </Card>
    </div>
  )
}
