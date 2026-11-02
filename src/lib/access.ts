export type WorkspaceRole = "admin" | "manager" | "agent" | "viewer";

export function sameIdentity(value: string | null | undefined, email: string): boolean {
  return Boolean(value?.trim() && email.trim() && value.trim().toLowerCase() === email.trim().toLowerCase());
}

export function canManageUsers(role: WorkspaceRole): boolean {
  return role === "admin";
}

export function canReadReports(
  role: WorkspaceRole,
  status: string,
  owner: string,
  email: string
): boolean {
  if (role === "admin" || role === "manager") return true;
  if (role === "agent") return sameIdentity(owner, email);
  return role === "viewer" && status === "validated";
}

export function canReadEvaluations(role: WorkspaceRole, owner: string, email: string): boolean {
  return role === "admin" || role === "manager" || (role === "agent" && sameIdentity(owner, email));
}

export function canReadPayments(role: WorkspaceRole, _owner: string, _email: string): boolean {
  return role === "admin" || role === "manager";
}

export function canWriteTickets(role: WorkspaceRole, assignee: string, email: string): boolean {
  return role === "admin" || role === "manager" || (role === "agent" && sameIdentity(assignee, email));
}

export function canWriteComments(role: WorkspaceRole, assignee: string, email: string): boolean {
  return role === "admin" || role === "manager" || (role === "agent" && sameIdentity(assignee, email));
}

export function canReadTicket(role: WorkspaceRole, assignee: string, email: string): boolean {
  return role !== "agent" || sameIdentity(assignee, email);
}

export function canCreateReports(role: WorkspaceRole, assignee: string, email: string): boolean {
  return role === "admin" || (role === "agent" && sameIdentity(assignee, email));
}
