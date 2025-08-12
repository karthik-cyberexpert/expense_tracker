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
import { TransactionForm, TransactionFormValues } from "./transaction-form";
import type { Transaction } from "@/types";

interface TransactionDialogProps {
  children: React.ReactNode;
  transaction?: Transaction;
  onFormSubmit: (values: TransactionFormValues, transactionId?: string) => void;
}

export function TransactionDialog({
  children,
  transaction,
  onFormSubmit,
}: TransactionDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isEditMode = !!transaction;

  const handleFormSubmit = (values: TransactionFormValues) => {
    onFormSubmit(values, transaction?.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit transaction" : "Add a new transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your transaction below."
              : "Enter the details of your transaction below. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          onSubmit={handleFormSubmit}
          initialData={transaction}
          buttonText={isEditMode ? "Save Changes" : "Add Transaction"}
        />
      </DialogContent>
    </Dialog>
  );
}