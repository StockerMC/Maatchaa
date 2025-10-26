import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Card } from "@/components/ui/card"

export function UserTransactions({ userId }: { userId: string }) {
  // Filter transactions for this user
  const userTransactions = transactions.filter((t) => t.userId === userId)

  if (userTransactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No transactions found for this user.</div>
  }

  return (
    <div className="space-y-4">
      {userTransactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <div className="flex items-center">
            <Avatar className="h-9 w-9 border">
              {transaction.type === "credit" ? (
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              )}
              <AvatarFallback>{transaction.description[0]}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.date} • {transaction.time}
              </p>
            </div>
            <div className={`ml-auto font-medium ${transaction.type === "credit" ? "text-green-500" : "text-red-500"}`}>
              {transaction.type === "credit" ? "+" : "-"}R {transaction.amount.toFixed(2)}
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Reference: {transaction.reference}</div>
        </Card>
      ))}
    </div>
  )
}

const transactions = [
  {
    id: "t1",
    userId: "1",
    description: "Salary Deposit",
    amount: 5000.0,
    date: "2023-11-14",
    time: "09:45 AM",
    type: "credit",
    reference: "SAL-NOV-2023",
  },
  {
    id: "t2",
    userId: "1",
    description: "Grocery Shopping",
    amount: 750.0,
    date: "2023-11-12",
    time: "02:30 PM",
    type: "debit",
    reference: "POS-CHECKERS-1234",
  },
  {
    id: "t3",
    userId: "1",
    description: "Electricity Bill",
    amount: 450.0,
    date: "2023-11-10",
    time: "10:15 AM",
    type: "debit",
    reference: "UTIL-ESKOM-5678",
  },
  {
    id: "t4",
    userId: "2",
    description: "Business Payment",
    amount: 12500.0,
    date: "2023-11-15",
    time: "11:20 AM",
    type: "credit",
    reference: "BUS-PAYMENT-9012",
  },
  {
    id: "t5",
    userId: "2",
    description: "Car Insurance",
    amount: 1200.0,
    date: "2023-11-05",
    time: "08:45 AM",
    type: "debit",
    reference: "INS-OUTSURANCE-3456",
  },
  {
    id: "t6",
    userId: "3",
    description: "Sponsorship Payment",
    amount: 25000.0,
    date: "2023-11-08",
    time: "03:15 PM",
    type: "credit",
    reference: "SPON-NIKE-7890",
  },
]
