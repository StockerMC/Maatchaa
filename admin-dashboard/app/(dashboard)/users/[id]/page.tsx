import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, UserCog, Wallet, History, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserTransactions } from "@/components/user-transactions"

export default function UserProfilePage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the user data based on the ID
  const user = users.find((u) => u.id === params.id) || users[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name} {user.surname}
          </h1>
          <p className="text-muted-foreground">User profile and account management</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <UserCog className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="wallet">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <History className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>View and update user profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname</Label>
                  <Input id="surname" defaultValue={user.surname} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue={user.phone} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type</Label>
                  <Select defaultValue={user.idType}>
                    <SelectTrigger id="idType">
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID">ID</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Asylum Seeker">Asylum Seeker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Account Status</Label>
                  <Select defaultValue={user.status}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>Manage user wallet and balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">R {user.balance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Last updated: Today at 12:34 PM</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Wallet Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.walletStatus}</div>
                    <p className="text-xs text-muted-foreground">Created: {user.walletCreated}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topup">Top Up Wallet</Label>
                <div className="flex gap-2">
                  <Input id="topup" type="number" placeholder="Amount in ZAR" />
                  <Button>Add Funds</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Freeze Wallet
              </Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View all transactions for this user</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTransactions userId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage user security and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetPassword">Reset Password</Label>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full">
                    Send Reset Link
                  </Button>
                  <Button className="w-full">Generate Temporary Password</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Two-Factor Authentication</Label>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="font-medium">2FA Status</div>
                    <div className="text-sm text-muted-foreground">
                      {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <Button variant={user.twoFactorEnabled ? "destructive" : "outline"}>
                    {user.twoFactorEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const users = [
  {
    id: "1",
    name: "Thabo",
    surname: "Mbeki",
    email: "thabo.mbeki@example.com",
    idType: "ID",
    phone: "+27 71 234 5678",
    status: "Active",
    balance: 1250.75,
    walletStatus: "Active",
    walletCreated: "2023-05-12",
    twoFactorEnabled: false,
  },
  {
    id: "2",
    name: "Nomzamo",
    surname: "Mbatha",
    email: "nomzamo.mbatha@example.com",
    idType: "Passport",
    phone: "+27 82 345 6789",
    status: "Active",
    balance: 3450.5,
    walletStatus: "Active",
    walletCreated: "2023-06-18",
    twoFactorEnabled: true,
  },
  {
    id: "3",
    name: "Siya",
    surname: "Kolisi",
    email: "siya.kolisi@example.com",
    idType: "ID",
    phone: "+27 63 456 7890",
    status: "Active",
    balance: 5678.25,
    walletStatus: "Active",
    walletCreated: "2023-04-30",
    twoFactorEnabled: false,
  },
  {
    id: "4",
    name: "Bonang",
    surname: "Matheba",
    email: "bonang.matheba@example.com",
    idType: "ID",
    phone: "+27 74 567 8901",
    status: "Pending",
    balance: 0.0,
    walletStatus: "Pending",
    walletCreated: "2023-08-05",
    twoFactorEnabled: false,
  },
  {
    id: "5",
    name: "Trevor",
    surname: "Noah",
    email: "trevor.noah@example.com",
    idType: "Passport",
    phone: "+27 85 678 9012",
    status: "Active",
    balance: 12500.0,
    walletStatus: "Active",
    walletCreated: "2023-02-14",
    twoFactorEnabled: true,
  },
]
