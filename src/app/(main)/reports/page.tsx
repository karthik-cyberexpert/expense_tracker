"use client";

import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import type { Transaction } from "@/types";
import { SpendingReport } from "@/components/spending-report";
import { IncomeExpenseReport } from "@/components/income-expense-report";

type DateRangeKey = "this_month" | "last_3_months" | "this_year" | "all_time";

export default function ReportsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState<DateRangeKey>("this_month");

  React.useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        toast.error("Failed to fetch transactions.");
        console.error("Fetch error:", error.message);
      } else {
        setTransactions(
          data.map((t) => ({ ...t, amount: Number(t.amount) }))
        );
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = React.useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_3_months":
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      case "this_year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case "all_time":
      default:
        return transactions;
    }

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate! && transactionDate <= endDate!;
    });
  }, [transactions, dateRange]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-9 w-48 mb-4" />
        <Skeleton className="h-10 w-full max-w-md mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-4 sm:mb-0">
          Financial Reports
        </h1>
        <div className="w-full sm:w-auto">
          <Select
            value={dateRange}
            onValueChange={(value: DateRangeKey) => setDateRange(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="spending">
        <TabsList>
          <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
          <TabsTrigger value="income_vs_expense">
            Income vs. Expense
          </TabsTrigger>
        </TabsList>
        <TabsContent value="spending" className="pt-4">
          <SpendingReport transactions={filteredTransactions} />
        </TabsContent>
        <TabsContent value="income_vs_expense" className="pt-4">
          <IncomeExpenseReport transactions={filteredTransactions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}