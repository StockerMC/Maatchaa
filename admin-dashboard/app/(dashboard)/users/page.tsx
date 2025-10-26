import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserCog } from "lucide-react"
import Link from "next/link"
import { CreateUserDialog } from "@/components/create-user-dialog"

// Update the users page to improve responsiveness
export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and wallets</p>
        </div>
        <CreateUserDialog />
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="h-9" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <div className="w-full min-w-[640px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name} {user.surname}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.idType}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.status === "Active"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
                        }`}
                      >
                        {user.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/users/${user.id}`}>
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">Edit user</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
  },
  {
    id: "2",
    name: "Nomzamo",
    surname: "Mbatha",
    email: "nomzamo.mbatha@example.com",
    idType: "Passport",
    phone: "+27 82 345 6789",
    status: "Active",
  },
  {
    id: "3",
    name: "Siya",
    surname: "Kolisi",
    email: "siya.kolisi@example.com",
    idType: "ID",
    phone: "+27 63 456 7890",
    status: "Active",
  },
  {
    id: "4",
    name: "Bonang",
    surname: "Matheba",
    email: "bonang.matheba@example.com",
    idType: "ID",
    phone: "+27 74 567 8901",
    status: "Pending",
  },
  {
    id: "5",
    name: "Trevor",
    surname: "Noah",
    email: "trevor.noah@example.com",
    idType: "Passport",
    phone: "+27 85 678 9012",
    status: "Active",
  },
  {
    id: "6",
    name: "Patrice",
    surname: "Motsepe",
    email: "patrice.motsepe@example.com",
    idType: "ID",
    phone: "+27 76 789 0123",
    status: "Active",
  },
  {
    id: "7",
    name: "Caster",
    surname: "Semenya",
    email: "caster.semenya@example.com",
    idType: "ID",
    phone: "+27 87 890 1234",
    status: "Pending",
  },
  {
    id: "8",
    name: "Elon",
    surname: "Musk",
    email: "elon.musk@example.com",
    idType: "Asylum Seeker",
    phone: "+27 78 901 2345",
    status: "Active",
  },
]
