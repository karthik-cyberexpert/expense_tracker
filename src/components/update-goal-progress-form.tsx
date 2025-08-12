"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Goal } from "@/types";

const formSchema = z.object({
  current_amount: z.coerce
    .number()
    .min(0, { message: "Amount cannot be negative." }),
});

export type UpdateGoalProgressFormValues = z.infer<typeof formSchema>;

interface UpdateGoalProgressFormProps {
  onSubmit: (values: UpdateGoalProgressFormValues) => void;
  goal: Goal;
}

export function UpdateGoalProgressForm({
  onSubmit,
  goal,
}: UpdateGoalProgressFormProps) {
  const form = useForm<UpdateGoalProgressFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_amount: goal.current_amount,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="current_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Saved Amount</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Update Progress
        </Button>
      </form>
    </Form>
  );
}