"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import type { Goal } from "@/types";
import { GoalDialog } from "@/components/goal-dialog";
import { GoalFormValues } from "@/components/goal-form";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { Flag, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { UpdateGoalProgressDialog } from "@/components/update-goal-progress-dialog";
import { UpdateGoalProgressFormValues } from "@/components/update-goal-progress-form";

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchGoals = React.useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch goals.");
      console.error("Fetch error:", error.message);
    } else {
      setGoals(
        data.map((g) => ({
          ...g,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount),
        }))
      );
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleFormSubmit = async (values: GoalFormValues, goalId?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const goalData = {
      user_id: sessionData.session.user.id,
      name: values.name,
      target_amount: values.target_amount,
      target_date: values.target_date
        ? format(values.target_date, "yyyy-MM-dd")
        : null,
    };

    const promise = goalId
      ? supabase.from("goals").update(goalData).eq("id", goalId)
      : supabase.from("goals").insert([goalData]);

    const { error } = await promise;

    if (error) {
      toast.error(
        `Failed to ${goalId ? "update" : "add"} goal: ${error.message}`
      );
    } else {
      toast.success(`Goal ${goalId ? "updated" : "added"} successfully!`);
      fetchGoals();
    }
  };

  const handleProgressUpdate = async (
    values: UpdateGoalProgressFormValues,
    goalId: string
  ) => {
    const { error } = await supabase
      .from("goals")
      .update({ current_amount: values.current_amount })
      .eq("id", goalId);

    if (error) {
      toast.error("Failed to update goal progress.");
    } else {
      toast.success("Goal progress updated!");
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);

    if (error) {
      toast.error(`Failed to delete goal: ${error.message}`);
    } else {
      toast.success("Goal deleted successfully!");
      fetchGoals();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
        <GoalDialog onFormSubmit={handleFormSubmit}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </GoalDialog>
      </div>
      {goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress =
              goal.target_amount > 0
                ? (goal.current_amount / goal.target_amount) * 100
                : 0;
            const daysLeft = goal.target_date
              ? differenceInDays(new Date(goal.target_date), new Date())
              : null;

            return (
              <Card key={goal.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <Flag
                      className={cn(
                        "h-5 w-5",
                        progress >= 100
                          ? "text-green-500"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <CardDescription>
                    {goal.target_date
                      ? `Target: ${format(new Date(goal.target_date), "PPP")}`
                      : "No target date"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <div className="text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        {goal.current_amount.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </span>
                      {" / "}
                      {goal.target_amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })}
                      <span className="ml-2">({Math.round(progress)}%)</span>
                    </div>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <p className="text-sm text-muted-foreground">
                        {daysLeft} days left to reach your goal.
                      </p>
                    )}
                     {daysLeft !== null && daysLeft < 0 && (
                      <p className="text-sm text-red-500">
                        Target date has passed.
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <UpdateGoalProgressDialog
                    goal={goal}
                    onFormSubmit={handleProgressUpdate}
                  >
                    <Button variant="outline">Update Progress</Button>
                  </UpdateGoalProgressDialog>
                  <GoalDialog goal={goal} onFormSubmit={handleFormSubmit}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </GoalDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your goal '{goal.name}'.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No goals yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first financial goal to start saving.
          </p>
          <GoalDialog onFormSubmit={handleFormSubmit}>
            <Button className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </GoalDialog>
        </div>
      )}
    </div>
  );
}