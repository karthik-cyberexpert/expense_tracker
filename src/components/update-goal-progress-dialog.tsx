"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UpdateGoalProgressForm,
  UpdateGoalProgressFormValues,
} from "./update-goal-progress-form";
import type { Goal } from "@/types";

interface UpdateGoalProgressDialogProps {
  children: React.ReactNode;
  goal: Goal;
  onFormSubmit: (values: UpdateGoalProgressFormValues, goalId: string) => void;
}

export function UpdateGoalProgressDialog({
  children,
  goal,
  onFormSubmit,
}: UpdateGoalProgressDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleFormSubmit = (values: UpdateGoalProgressFormValues) => {
    onFormSubmit(values, goal.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Goal Progress</DialogTitle>
          <DialogDescription>
            Update the total amount you've saved for '{goal.name}'.
          </DialogDescription>
        </DialogHeader>
        <UpdateGoalProgressForm onSubmit={handleFormSubmit} goal={goal} />
      </DialogContent>
    </Dialog>
  );
}