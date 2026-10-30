import type { Issue, Filters, DimKey, IssueData } from "@/lib/issues";

export type HomeProps = {
  data: IssueData;
  syncNote?: { outcome: string; detail: string } | null;
  user: { name: string; email: string; role: string };
  issues: Issue[];
  total: number;
  charts: { status: Issue[]; priority: Issue[]; module: Issue[]; payment: Issue[]; period: Issue[] };
  filters: Filters;
  onToggle: (dim: DimKey, value: string) => void;
  onToggleMonth: (from: string, to: string) => void;
  onReset: () => void;
};
