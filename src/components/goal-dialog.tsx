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
import { GoalForm, GoalFormValues } from "./goal-form";
import type { Goal } from "@/types";

interface GoalDialogProps {
  children: React.ReactNode;
  goal?: Goal;
  onFormSubmit: (values: GoalFormValues, goalId?: string) => void;
}

export function GoalDialog({ children, goal, onFormSubmit }: GoalDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isEditMode = !!goal;

  const handleFormSubmit = (values: GoalFormValues) => {
    onFormSubmit(values, goal?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit goal" : "Create a new goal"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your financial goal."
              : "Set a new financial goal to start saving."}
          </DialogDescription>
        </DialogHeader>
        <GoalForm
          onSubmit={handleFormSubmit}
          initialData={goal}
          buttonText={isEditMode ? "Save Changes" : "Create Goal"}
        />
      </DialogContent>
    </Dialog>
  );
}