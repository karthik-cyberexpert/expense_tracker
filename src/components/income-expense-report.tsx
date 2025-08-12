"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import type { Transaction } from "@/types";

interface IncomeExpenseReportProps {
  transactions: Transaction[];
}

export function IncomeExpenseReport({ transactions }: IncomeExpenseReportProps) {
  const data = React.useMemo(() => {
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = format(parseISO(transaction.date), "yyyy-MM");
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      if (transaction.type === "income") {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expense += Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { month: string; income: number; expense: number }>);

    return Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    ).map(d => ({...d, month: format(parseISO(d.month), "MMM yyyy")}));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground">
        No data available for this period.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs. Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                name="Expense"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}