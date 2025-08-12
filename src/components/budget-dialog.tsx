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
import { BudgetForm, BudgetFormValues } from "./budget-form";
import type { Budget } from "@/types";

interface BudgetDialogProps {
  children: React.ReactNode;
  budget?: Budget;
  onFormSubmit: (values: BudgetFormValues, budgetId?: string) => void;
}

export function BudgetDialog({
  children,
  budget,
  onFormSubmit,
}: BudgetDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isEditMode = !!budget;

  const handleFormSubmit = (values: BudgetFormValues) => {
    onFormSubmit(values, budget?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit budget" : "Add a new budget"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your budget below."
              : "Set a spending limit for a category for a specific month."}
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          onSubmit={handleFormSubmit}
          initialData={budget}
          buttonText={isEditMode ? "Save Changes" : "Add Budget"}
        />
      </DialogContent>
    </Dialog>
  );
}