import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9 border">
            {transaction.type === "credit" ? (
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            )}
            <AvatarFallback>{transaction.name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.name}</p>
            <p className="text-sm text-muted-foreground">{transaction.date}</p>
          </div>
          <div className={`ml-auto font-medium ${transaction.type === "credit" ? "text-green-500" : "text-red-500"}`}>
            {transaction.type === "credit" ? "+" : "-"}R {transaction.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}

const transactions = [
  {
    id: "1",
    name: "Thabo Mbeki",
    amount: 250.0,
    date: "2023-11-14",
    type: "credit",
  },
  {
    id: "2",
    name: "Nomzamo Mbatha",
    amount: 1000.0,
    date: "2023-11-13",
    type: "debit",
  },
  {
    id: "3",
    name: "Siya Kolisi",
    amount: 500.0,
    date: "2023-11-12",
    type: "credit",
  },
  {
    id: "4",
    name: "Trevor Noah",
    amount: 750.0,
    date: "2023-11-11",
    type: "debit",
  },
  {
    id: "5",
    name: "Patrice Motsepe",
    amount: 2500.0,
    date: "2023-11-10",
    type: "credit",
  },
]
