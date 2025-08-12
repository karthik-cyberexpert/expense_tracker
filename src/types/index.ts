export type Transaction = {
  id: string;
  created_at: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "income" | "expense";
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string; // YYYY-MM-DD
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null; // YYYY-MM-DD
  created_at: string;
};