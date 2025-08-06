"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddExpenseForm, ExpenseFormValues } from "./add-expense-form";

interface AddTransactionDialogProps {
  onFormSubmit: (values: ExpenseFormValues) => void;
}

export function AddTransactionDialog({
  onFormSubmit,
}: AddTransactionDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleFormSubmit = (values: ExpenseFormValues) => {
    onFormSubmit(values);
    setIsOpen(false); // Close the dialog on submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add a new transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your transaction below. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <AddExpenseForm onSubmit={handleFormSubmit} />
      </DialogContent>
    </Dialog>
  );
}