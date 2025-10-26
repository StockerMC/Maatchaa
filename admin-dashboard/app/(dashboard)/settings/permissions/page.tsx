import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function PermissionsSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Permissions Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>Manage user roles and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>User Permissions</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="manage-users" />
                  <Label htmlFor="manage-users">Manage Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="manage-transactions" />
                  <Label htmlFor="manage-transactions">Manage Transactions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="view-analytics" />
                  <Label htmlFor="view-analytics">View Analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="manage-settings" />
                  <Label htmlFor="manage-settings">Manage Settings</Label>
                </div>
              </div>
            </div>
            <Button type="submit">Update Permissions</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
