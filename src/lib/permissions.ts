import { eq } from "drizzle-orm";
import { tickets, type User } from "@/db/schema";

export type Action =
  | "ticket.read"
  | "ticket.create"
  | "ticket.update"
  | "ticket.delete"
  | "ticket.status"
  | "ticket.comment"
  | "dashboard.view"
  | "export.csv"
  | "import.excel"
  | "users.manage"
  | "audit.read";

type Ticket = typeof tickets.$inferSelect;

export function scopeWhere(user: User) {
  if (user.role === "agent") return eq(tickets.assignee, user.email);
  return undefined;
}

export function can(user: User, action: Action, ticket?: Ticket): boolean {
  const role = user.role;
  switch (action) {
    case "ticket.read":
      if (role === "agent") return !!ticket && ticket.assignee.toLowerCase() === user.email.toLowerCase();
      return role === "admin" || role === "manager" || role === "viewer";
    case "ticket.create":
    case "ticket.update":
    case "ticket.delete":
    case "ticket.status":
      if (role === "admin" || role === "manager") return true;
      if (role === "agent")
        return !!ticket && ticket.assignee.toLowerCase() === user.email.toLowerCase() && action === "ticket.status";
      return false;
    case "ticket.comment":
      if (role === "admin" || role === "manager") return true;
      if (role === "agent") return !!ticket && ticket.assignee.toLowerCase() === user.email.toLowerCase();
      return false;
    case "dashboard.view":
    case "export.csv":
      return role === "admin" || role === "manager" || role === "agent" || role === "viewer";
    case "import.excel":
    case "users.manage":
      return role === "admin";
    case "audit.read":
      return role === "admin" || role === "manager";
    default:
      return false;
  }
}
