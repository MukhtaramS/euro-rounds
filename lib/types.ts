export type PostStatus = "pending" | "approved" | "rejected";

export interface Post {
  id: number;
  company: string;
  city: string;
  country: string;
  amount: string;
  round: string;
  headline: string;
  post: string;
  post_x: string;
  hashtags: string;
  source_url: string;
  check: boolean;
  status: PostStatus;
  created_at: string;
  cost_usd?: number | null;
}

export interface Run {
  id: number;
  run_date: string;
  status: "ok" | "no_new_rounds" | "error";
  step: string;
  message: string;
  trend: string;
  cost_usd?: number | null;
  execution_id?: string | null;
}
