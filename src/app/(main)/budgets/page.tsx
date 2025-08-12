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
import type { Budget } from "@/types";
import { BudgetDialog } from "@/components/budget-dialog";
import { BudgetFormValues } from "@/components/budget-form";

export default function BudgetsPage() {
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchBudgets = React.useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("period", { ascending: false });

    if (error) {
      toast.error("Failed to fetch budgets.");
      console.error("Fetch error:", error.message);
    } else {
      setBudgets(data.map(b => ({...b, amount: Number(b.amount)})));
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

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
      period: format(new Date(values.period.getFullYear(), values.period.getMonth(), 1), "yyyy-MM-dd"),
    };

    const promise = budgetId
      ? supabase.from("budgets").update(budgetData).eq("id", budgetId)
      : supabase.from("budgets").insert([budgetData]);

    const { error } = await promise;

    if (error) {
      toast.error(`Failed to ${budgetId ? "update" : "add"} budget: ${error.message}`);
    } else {
      toast.success(`Budget ${budgetId ? "updated" : "added"} successfully!`);
      fetchBudgets();
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);

    if (error) {
      toast.error(`Failed to delete budget: ${error.message}`);
    } else {
      toast.success("Budget deleted successfully!");
      fetchBudgets();
    }
  };

  if (loading) {
    return (
      <div>
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
    <div>
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
                <TableHead>Month</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.length > 0 ? (
                budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">
                      {format(new Date(budget.period), "MMMM yyyy")}
                    </TableCell>
                    <TableCell>{budget.category}</TableCell>
                    <TableCell className="text-right">
                      {budget.amount.toLocaleString("en-US", {
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
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
                  <TableCell colSpan={4} className="h-24 text-center">
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