"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, CreditCard, Package } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { ExpenseFormValues } from "@/components/add-expense-form";
import { format } from "date-fns";
import { ExpenseChart } from "@/components/expense-chart";

// Mock data for now
const initialTransactions = [
  {
    id: 1,
    date: "2024-07-26",
    description: "Groceries",
    category: "Food",
    amount: -75.42,
  },
  {
    id: 2,
    date: "2024-07-25",
    description: "Salary",
    category: "Income",
    amount: 2500.0,
  },
  {
    id: 3,
    date: "2024-07-24",
    description: "Netflix Subscription",
    category: "Entertainment",
    amount: -15.99,
  },
  {
    id: 4,
    date: "2024-07-23",
    description: "Gasoline",
    category: "Transport",
    amount: -50.12,
  },
  {
    id: 5,
    date: "2024-07-22",
    description: "Dinner with friends",
    category: "Food",
    amount: -120.0,
  },
];

export default function DashboardPage() {
  const [transactions, setTransactions] = React.useState(initialTransactions);

  const handleAddTransaction = (data: ExpenseFormValues) => {
    const amount =
      data.type === "expense" ? -Math.abs(data.amount) : Math.abs(data.amount);
    const newTransaction = {
      id: transactions.length + 1,
      description: data.description,
      category: data.category,
      date: format(data.date, "yyyy-MM-dd"),
      amount: amount,
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const totalBalance = React.useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );
  }, [transactions]);

  const monthlySpending = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear &&
          t.amount < 0
        );
      })
      .reduce((acc, transaction) => acc + transaction.amount, 0);
  }, [transactions]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <AddTransactionDialog onFormSubmit={handleAddTransaction} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBalance.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on all transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month's Spending
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlySpending.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                For the current month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Total transactions recorded
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell
                          className={`text-right ${
                            transaction.amount > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {transaction.amount.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1">
            <ExpenseChart transactions={transactions} />
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
}