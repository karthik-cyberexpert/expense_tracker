"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export interface Filters {
  type: "all" | "income" | "expense";
  category: string;
  startDate?: Date;
  endDate?: Date;
}

interface TransactionFiltersProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  categories: string[];
  onClearFilters: () => void;
}

export function TransactionFilters({
  filters,
  onFilterChange,
  categories,
  onClearFilters,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <span className="text-sm font-medium">Filter by:</span>
      <Select
        value={filters.type}
        onValueChange={(value: Filters["type"]) =>
          onFilterChange({ type: value })
        }
      >
        <SelectTrigger className="w-full flex-1 min-w-[150px] sm:w-auto">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange({ category: value })}
      >
        <SelectTrigger className="w-full flex-1 min-w-[150px] sm:w-auto">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full flex-1 justify-start text-left font-normal min-w-[200px] sm:w-auto",
              !filters.startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate && isValid(filters.startDate) ? (
              format(filters.startDate, "PPP")
            ) : (
              <span>Start date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate}
            onSelect={(date) => onFilterChange({ startDate: date ?? undefined })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full flex-1 justify-start text-left font-normal min-w-[200px] sm:w-auto",
              !filters.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.endDate && isValid(filters.endDate) ? (
              format(filters.endDate, "PPP")
            ) : (
              <span>End date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate}
            onSelect={(date) => onFilterChange({ endDate: date ?? undefined })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        onClick={onClearFilters}
        className="flex items-center gap-1"
      >
        <X className="h-4 w-4" />
        Clear
      </Button>
    </div>
  );
}