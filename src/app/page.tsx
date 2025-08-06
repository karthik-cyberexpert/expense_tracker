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
import { DollarSign, CreditCard, Package, LogOut } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { ExpenseFormValues } from "@/components/add-expense-form";
import { format } from "date-fns";
import { ExpenseChart } from "@/components/expense-chart";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export type Transaction = {
  id: string;
  created_at: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
};

export default function DashboardPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setSession(data.session);
      }
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchTransactions = React.useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        toast.error("Failed to fetch transactions.");
        console.error("Fetch error:", error.message);
      } else {
        const formattedData = data.map((t) => ({
          ...t,
          amount: Number(t.amount),
        }));
        setTransactions(formattedData);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  React.useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

  const handleAddTransaction = async (data: ExpenseFormValues) => {
    if (!session) return;

    const amount =
      data.type === "expense" ? -Math.abs(data.amount) : Math.abs(data.amount);

    const newTransaction = {
      user_id: session.user.id,
      description: data.description,
      category: data.category,
      date: format(data.date, "yyyy-MM-dd"),
      amount: amount,
      type: data.type,
    };

    const { error } = await supabase
      .from("transactions")
      .insert([newTransaction]);

    if (error) {
      toast.error(`Failed to add transaction: ${error.message}`);
    } else {
      toast.success("Transaction added successfully!");
      fetchTransactions();
    }
  };

  const handleLogout = async () => {
    toast("Logging out...");
    await supabase.auth.signOut();
    setTransactions([]);
    router.push("/login");
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
          t.type === "expense"
        );
      })
      .reduce((acc, transaction) => acc + transaction.amount, 0);
  }, [transactions]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="mt-8 grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="xl:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-4">
            <AddTransactionDialog onFormSubmit={handleAddTransaction} />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
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
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            {format(
                              new Date(transaction.date.replace(/-/g, "/")),
                              "PPP"
                            )}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              transaction.type === "income"
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No transactions yet. Add one to get started!
                        </TableCell>
                      </TableRow>
                    )}
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