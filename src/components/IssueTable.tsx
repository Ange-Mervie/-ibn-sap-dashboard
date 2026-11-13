"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Issue } from "@/lib/issues";
import { isOpen, ageDays, PRIORITIES, issuesToCSV } from "@/lib/issues";
import SectionHeader from "./SectionHeader";

const PAGE_SIZE = 12;

type SortKey = "id" | "openDate" | "priority" | "age";

export default function IssueTable({
  issues,
  onReset,
  filtersActive,
}: {
  issues: Issue[];
  onReset?: () => void;
  filtersActive: boolean;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const list = [...issues];
    const dir = sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sort.key) {
        case "id":
          return a.id.localeCompare(b.id, "fr", { numeric: true }) * dir;
        case "openDate":
          return ((a.openDate || "9999").localeCompare(b.openDate || "9999")) * dir;
        case "priority":
          return ((rank[a.priority as keyof typeof rank] ?? 9) - (rank[b.priority as keyof typeof rank] ?? 9)) * dir;
        case "age":
          return ((ageDays(a) ?? -1) - (ageDays(b) ?? -1)) * dir;
      }
    });
    return list;
  }, [issues, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  }

  function arrow(key: SortKey) {
    if (sort.key !== key) return "";
    return sort.dir === "asc" ? " ↑" : " ↓";
  }

  function resetAll() {
    setSort({ key: "id", dir: "asc" });
    setPage(1);
    onReset?.();
  }

  function exportCSV() {
    const csv = issuesToCSV(sorted);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents-sap-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusStyle = (s: string) =>
    s === "Closed"
      ? "bg-green-50 text-green-700"
      : s === "Blocked"
        ? "bg-red-50 text-red-700"
        : s === "In Progress"
          ? "bg-blue-50 text-blue-700"
          : s === "waiting for Customer"
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-600";

  const priorityStyle = (p: string) =>
    p === "Critical"
      ? "bg-red-50 text-red-700"
      : p === "High"
        ? "bg-orange-50 text-orange-700"
        : p === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600";

  return (
    <div>
      <SectionHeader
        title="Suivi des incidents"
        subtitle="Tous les tickets, du plus récent au plus ancien. Cliquez sur un numéro pour ouvrir la fiche."
        action={
          <div className="flex items-center gap-2">
            <span className="ibn-badge bg-slate-100 text-slate-600">{sorted.length} tickets</span>
            <button onClick={exportCSV} disabled={!sorted.length} className="ibn-btn">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={resetAll} disabled={!filtersActive && sort.key === "id"} className="ibn-btn">
              <RotateCcw size={14} /> Réinitialiser
            </button>
          </div>
        }
      />

      <div className="ibn-card overflow-hidden">
        <div className="table-scroll">
          <table className="ibn-table w-full">
            <thead>
              <tr>
                <th onClick={() => toggleSort("id")} className="cursor-pointer select-none">N°{arrow("id")}</th>
                <th>Description</th>
                <th>Statut</th>
                <th onClick={() => toggleSort("priority")} className="cursor-pointer select-none">Priorité{arrow("priority")}</th>
                <th>Module SAP</th>
                <th>Demandeur</th>
                <th>Consultant</th>
                <th onClick={() => toggleSort("openDate")} className="cursor-pointer select-none">Ouvert le{arrow("openDate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <p className="text-[13px] font-medium text-[var(--ibn-text-muted)]">Aucun ticket ne correspond aux critères.</p>
                    <button onClick={resetAll} className="mt-2 text-[12.5px] font-medium text-[var(--ibn-blue-600)] hover:underline">
                      Réinitialiser les filtres
                    </button>
                  </td>
                </tr>
              )}
              {rows.map((i) => (
                <tr key={i.id} className={i.priority === "Critical" && isOpen(i) ? "bg-red-50/40" : undefined}>
                  <td className="whitespace-nowrap font-mono text-[11.5px]">
                    <Link href={`/tickets/${encodeURIComponent(i.id)}`} className="font-medium text-[var(--ibn-blue-600)] hover:underline">
                      {i.id}
                    </Link>
                  </td>
                  <td className="max-w-[320px] truncate text-[var(--ibn-text-muted)]" title={i.description}>
                    {i.description}
                  </td>
                  <td>
                    <span className={`ibn-badge ${statusStyle(i.status)}`}>{i.status}</span>
                  </td>
                  <td>
                    <span className={`ibn-badge ${priorityStyle(i.priority)}`}>{i.priority}</span>
                  </td>
                  <td className="text-[var(--ibn-text-muted)]">
                    {i.module && i.module.toUpperCase() !== "BLANK" ? i.module : <span className="text-amber-600">Non renseigné</span>}
                  </td>
                  <td className="text-[var(--ibn-text-muted)]">{i.raisedBy || "—"}</td>
                  <td className="text-[var(--ibn-text-muted)]">{i.assignee || <span className="text-[var(--ibn-text-faint)]">Non affecté</span>}</td>
                  <td className="whitespace-nowrap text-[var(--ibn-text-muted)]">{i.openDate || <span className="text-amber-600">Information absente</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ibn-border)] px-4 py-3">
          <p className="text-[11.5px] text-[var(--ibn-text-muted)]">
            Page {current} / {totalPages} · {sorted.length} ticket(s)
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current <= 1} className="ibn-btn">
              <ChevronLeft size={14} /> Précédent
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current >= totalPages} className="ibn-btn">
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-[var(--ibn-text-faint)]">
        Priorités : {PRIORITIES.join(" · ")} — les lignes « Critical » ouvertes sont surlignées.
      </p>
    </div>
  );
}