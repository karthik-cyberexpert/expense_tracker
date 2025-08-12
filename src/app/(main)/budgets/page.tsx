"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { Budget, Transaction } from "@/types";
import { BudgetDialog } from "@/components/budget-dialog";
import { BudgetFormValues } from "@/components/budget-form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoading(false);
      return;
    }

    const budgetsPromise = supabase
      .from("budgets")
      .select("*")
      .order("period", { ascending: false });
    const transactionsPromise = supabase.from("transactions").select("*");

    const [budgetsResult, transactionsResult] = await Promise.all([
      budgetsPromise,
      transactionsPromise,
    ]);

    if (budgetsResult.error) {
      toast.error("Failed to fetch budgets.");
      console.error("Fetch error:", budgetsResult.error.message);
    } else {
      setBudgets(budgetsResult.data.map((b) => ({ ...b, amount: Number(b.amount) })));
    }

    if (transactionsResult.error) {
      toast.error("Failed to fetch transactions.");
    } else {
      setTransactions(
        transactionsResult.data.map((t) => ({ ...t, amount: Number(t.amount) }))
      );
    }

    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const budgetsWithSpending = React.useMemo(() => {
    return budgets.map((budget) => {
      const budgetPeriod = new Date(budget.period.replace(/-/g, "/"));
      const budgetMonth = budgetPeriod.getMonth();
      const budgetYear = budgetPeriod.getFullYear();

      const spent = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date.replace(/-/g, "/"));
          return (
            t.type === "expense" &&
            t.category === budget.category &&
            transactionDate.getMonth() === budgetMonth &&
            transactionDate.getFullYear() === budgetYear
          );
        })
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

      const remaining = budget.amount - spent;
      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        progress,
      };
    });
  }, [budgets, transactions]);

  const handleFormSubmit = async (
    values: BudgetFormValues,
    budgetId?: string
  ) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const budgetData = {
      user_id: sessionData.session.user.id,
      category: values.category,
      amount: values.amount,
      period: format(
        new Date(values.period.getFullYear(), values.period.getMonth(), 1),
        "yyyy-MM-dd"
      ),
    };

    const promise = budgetId
      ? supabase.from("budgets").update(budgetData).eq("id", budgetId)
      : supabase.from("budgets").insert([budgetData]);

    const { error } = await promise;

    if (error) {
      toast.error(
        `Failed to ${budgetId ? "update" : "add"} budget: ${error.message}`
      );
    } else {
      toast.success(`Budget ${budgetId ? "updated" : "added"} successfully!`);
      fetchData();
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budgetId);

    if (error) {
      toast.error(`Failed to delete budget: ${error.message}`);
    } else {
      toast.success("Budget deleted successfully!");
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
        <BudgetDialog onFormSubmit={handleFormSubmit}>
          <Button>Add Budget</Button>
        </BudgetDialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
          <CardDescription>
            Manage your monthly spending limits for each category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Month</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-[250px]">Progress</TableHead>
                <TableHead className="text-right">Budgeted</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetsWithSpending.length > 0 ? (
                budgetsWithSpending.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {format(new Date(budget.period.replace(/-/g, "/")), "MMMM yyyy")}
                    </TableCell>
                    <TableCell>{budget.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={budget.progress}
                          className={cn(
                            "h-2",
                            budget.progress > 90 && "bg-red-500/20",
                            budget.progress > 75 && budget.progress <= 90 && "bg-yellow-500/20"
                          )}
                          indicatorClassName={cn(
                            budget.progress > 90 && "bg-red-500",
                            budget.progress > 75 && budget.progress <= 90 && "bg-yellow-500"
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(budget.progress)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {budget.spent.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        budget.remaining < 0 && "text-red-500"
                      )}
                    >
                      {budget.remaining.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <BudgetDialog
                          budget={budget}
                          onFormSubmit={handleFormSubmit}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </BudgetDialog>
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
                                permanently delete this budget.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBudget(budget.id)}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    No budgets created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}