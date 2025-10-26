"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, MessageSquare, Bell, Send, Clock, CheckCircle } from "lucide-react"

export default function CommunicationSettingsPage() {
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(true)
  const [followUpEnabled, setFollowUpEnabled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Communication Settings</h1>
        <p className="text-muted-foreground">Manage how you communicate with creators and partnership outreach</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>Your contact details for creator communications and partnerships</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Primary Email Address</Label>
                <Input id="email" type="email" placeholder="partnerships@yourbusiness.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="altEmail">Alternative Email (Optional)</Label>
              <Input id="altEmail" type="email" placeholder="backup@yourbusiness.com" />
            </div>
            <Button type="submit">Update Contact Info</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Send className="w-5 h-5" />
            Email Automation
          </CardTitle>
          <CardDescription>Configure automatic outreach to creators when reels are approved</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-send Partnership Emails</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send partnership invitations when you approve a reel
              </p>
            </div>
            <Switch checked={autoEmailEnabled} onCheckedChange={setAutoEmailEnabled} />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Follow-up Reminders</Label>
                <p className="text-sm text-muted-foreground">Send follow-up emails if creators don't respond</p>
              </div>
              <Switch checked={followUpEnabled} onCheckedChange={setFollowUpEnabled} />
            </div>

            {followUpEnabled && (
              <div className="ml-6 space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>First Follow-up</Label>
                    <Select defaultValue="3days">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1day">1 day</SelectItem>
                        <SelectItem value="3days">3 days</SelectItem>
                        <SelectItem value="1week">1 week</SelectItem>
                        <SelectItem value="2weeks">2 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Second Follow-up</Label>
                    <Select defaultValue="1week">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3days">3 days</SelectItem>
                        <SelectItem value="1week">1 week</SelectItem>
                        <SelectItem value="2weeks">2 weeks</SelectItem>
                        <SelectItem value="1month">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Email Templates
          </CardTitle>
          <CardDescription>Customize your outreach messages to creators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject Line</Label>
            <Input
              id="subject"
              placeholder="Partnership Opportunity with [Business Name]"
              defaultValue="Partnership Opportunity with [Business Name]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Textarea
              id="template"
              className="min-h-[200px]"
              placeholder="Hi [Creator Name]..."
              defaultValue={`Hi [Creator Name],

I hope this message finds you well! I came across your recent reel about [Reel Topic] and was impressed by your content and engagement.

I'm reaching out from [Business Name] because I think there could be a great partnership opportunity between us. Your content style aligns perfectly with our brand values, and I'd love to discuss how we can work together.

Our product [Product Name] would be a perfect fit for your audience, and I'd be happy to send you a sample to try out.

Would you be interested in exploring a partnership? I'd love to hear your thoughts and discuss the details.

Best regards,
[Your Name]
[Business Name]
[Contact Information]`}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Preview Email</Button>
            <Button>Save Template</Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Available variables:</strong> [Creator Name], [Business Name], [Product Name], [Reel Topic], [Your
              Name], [Contact Information]
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified about creator responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when creators respond to your outreach</p>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">New creator responses</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Partnership agreements</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Content delivery updates</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Weekly summary reports</span>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Communication Activity
          </CardTitle>
          <CardDescription>Your latest outreach and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email sent to @CookingHacks</p>
                  <p className="text-xs text-muted-foreground">Kitchen Scale partnership - 2 hours ago</p>
                </div>
              </div>
              <Badge variant="outline">Sent</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Response from @FitLife</p>
                  <p className="text-xs text-muted-foreground">Yoga Mat partnership - 4 hours ago</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Responded</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--lime-3)] rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[var(--lime-11)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Follow-up to @TechReviews</p>
                  <p className="text-xs text-muted-foreground">Phone Case partnership - 1 day ago</p>
                </div>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full mt-4 bg-transparent">
            View All Communications
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
