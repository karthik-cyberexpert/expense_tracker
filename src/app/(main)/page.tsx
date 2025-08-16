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
import {
  DollarSign,
  CreditCard,
  Package,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionFormValues } from "@/components/transaction-form";
import { format } from "date-fns";
import { ExpenseChart } from "@/components/expense-chart";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TransactionFilters,
  type Filters,
} from "@/components/transaction-filters";
import type { Transaction } from "@/types";

const initialFilters: Filters = {
  type: "all",
  category: "all",
  startDate: undefined,
  endDate: undefined,
};

export default function DashboardPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [uniqueCategories, setUniqueCategories] = React.useState<string[]>([]);
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

  const fetchUniqueCategories = React.useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase.from("transactions").select("category");

    if (error) {
      toast.error("Failed to load categories.");
      console.error("Category fetch error:", error.message);
    } else {
      const unique = [...new Set(data.map((item) => item.category))].sort();
      setUniqueCategories(unique);
    }
  }, [session]);

  const fetchTransactions = React.useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters.startDate) {
        query = query.gte("date", format(filters.startDate, "yyyy-MM-dd"));
      }
      if (filters.endDate) {
        query = query.lte("date", format(filters.endDate, "yyyy-MM-dd"));
      }

      const { data, error } = await query;

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
  }, [session, filters]);

  React.useEffect(() => {
    if (session) {
      fetchTransactions();
      fetchUniqueCategories();
    }
  }, [session, fetchTransactions, fetchUniqueCategories]);

  const handleFormSubmit = async (
    data: TransactionFormValues,
    transactionId?: string
  ) => {
    if (!session) return;

    const amount =
      data.type === "expense" ? -Math.abs(data.amount) : Math.abs(data.amount);

    const transactionData = {
      user_id: session.user.id,
      description: data.description,
      category: data.category,
      date: format(data.date, "yyyy-MM-dd"),
      amount: amount,
      type: data.type,
    };

    const promise = transactionId
      ? supabase.from("transactions").update(transactionData).eq("id", transactionId)
      : supabase.from("transactions").insert([transactionData]);

    const { error } = await promise;

    if (error) {
      toast.error(`Failed to ${transactionId ? "update" : "add"} transaction: ${error.message}`);
    } else {
      toast.success(`Transaction ${transactionId ? "updated" : "added"} successfully!`);
      fetchTransactions();
      fetchUniqueCategories();
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId);

    if (error) {
      toast.error(`Failed to delete transaction: ${error.message}`);
    } else {
      toast.success("Transaction deleted successfully!");
      fetchTransactions();
      fetchUniqueCategories();
    }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.info("No transactions to export.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Description",
      "Category",
      "Type",
      "Amount",
      "User ID",
      "Created At",
    ];
    const csvRows = [headers.join(",")];

    for (const transaction of transactions) {
      const values = [
        transaction.id,
        transaction.date,
        `"${transaction.description.replace(/"/g, '""')}"`,
        transaction.category,
        transaction.type,
        transaction.amount,
        transaction.user_id,
        transaction.created_at,
      ];
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.setAttribute("download", `transactions-${timestamp}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Transactions exported successfully!");
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
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
        const transactionDate = new Date(t.date.replace(/-/g, "/"));
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
      <>
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
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
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <TransactionDialog onFormSubmit={handleFormSubmit}>
            <Button>Add Transaction</Button>
          </TransactionDialog>
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
          <div className="mb-4">
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              categories={uniqueCategories}
              onClearFilters={handleClearFilters}
            />
          </div>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TransactionDialog
                              transaction={transaction}
                              onFormSubmit={handleFormSubmit}
                            >
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            </TransactionDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this transaction.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteTransaction(transaction.id)
                                    }
                                  >
                                    Continue
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No transactions found for the selected filters.
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
    </>
  );
}