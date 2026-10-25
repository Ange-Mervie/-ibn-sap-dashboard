"use client";

import { useMemo, useState } from "react";
import { Search, Download, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Issue } from "@/lib/issues";
import { isOpen, ageDays, resolutionDays, PRIORITIES, issuesToCSV } from "@/lib/issues";
import { PRIORITY_COLORS } from "./Charts";
import SectionHeader from "./SectionHeader";

const PAGE_SIZE = 12;

type SortKey = "id" | "openDate" | "priority" | "age";

export default function IssueTable({
  issues,
  onReset,
  filtersActive,
}: {
  issues: Issue[]; // déjà filtrés par les filtres globaux
  onReset: () => void;
  filtersActive: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [page, setPage] = useState(1);

  // Recherche par numéro ou description
  const searched = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return issues;
    return issues.filter(
      (i) => i.id.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    );
  }, [issues, search]);

  // Tri
  const sorted = useMemo(() => {
    const rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const list = [...searched];
    const dir = sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      switch (sort.key) {
        case "id":
          return (Number(a.id) - Number(b.id)) * dir;
        case "openDate":
          return ((a.openDate || "9999").localeCompare(b.openDate || "9999")) * dir;
        case "priority":
          return ((rank[a.priority as keyof typeof rank] ?? 9) - (rank[b.priority as keyof typeof rank] ?? 9)) * dir;
        case "age":
          return ((ageDays(a) ?? -1) - (ageDays(b) ?? -1)) * dir;
      }
    });
    return list;
  }, [searched, sort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  }

  function arrow(key: SortKey) {
    if (sort.key !== key) return " ↕";
    return sort.dir === "asc" ? " ↑" : " ↓";
  }

  function resetAll() {
    setSearch("");
    setSort({ key: "id", dir: "asc" });
    setPage(1);
    onReset();
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

  const anyActive = Boolean(search || filtersActive);

  return (
    <div>
      <SectionHeader
        title="Suivi des incidents"
        subtitle="Recherche, filtres, tri et export — les colonnes reprennent les champs du fichier source"
        image="/banner/laptop.jpg"
      />

      {/* Barre d'outils */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="N° de ticket ou description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-72 rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-600 focus:outline-none"
          />
        </div>

        <button
          onClick={exportCSV}
          disabled={!sorted.length}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
        >
          <Download size={14} /> Export CSV
        </button>

        <button
          onClick={resetAll}
          disabled={!anyActive}
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>

        <span className="ml-auto text-sm text-zinc-500">
          {sorted.length} ticket(s) correspondant(aux)
        </span>
      </div>

      {/* Tableau */}
      <div className="table-scroll overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-600">
            <tr>
              <th onClick={() => toggleSort("id")} className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-900">
                N°{arrow("id")}
              </th>
              <th className="px-3 py-3 font-semibold">Description</th>
              <th className="px-3 py-3 font-semibold">Statut</th>
              <th onClick={() => toggleSort("priority")} className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-900">
                Priorité{arrow("priority")}
              </th>
              <th className="px-3 py-3 font-semibold">Module SAP</th>
              <th className="px-3 py-3 font-semibold">Raised By</th>
              <th onClick={() => toggleSort("openDate")} className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-900">
                Open Date{arrow("openDate")}
              </th>
              <th className="px-3 py-3 font-semibold">Close Date</th>
              <th onClick={() => toggleSort("age")} className="cursor-pointer px-3 py-3 font-semibold hover:text-zinc-900">
                Âge / Délai{arrow("age")}
              </th>
              <th className="px-3 py-3 font-semibold">Paiement</th>
              <th className="px-3 py-3 font-semibold">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-600">Aucun ticket ne correspond aux critères.</p>
                  <button onClick={resetAll} className="mt-3 text-sm text-blue-600 underline">
                    Réinitialiser les filtres
                  </button>
                </td>
              </tr>
            )}
            {rows.map((i) => {
              const age = ageDays(i);
              const delay = resolutionDays(i);
              return (
                <tr key={i.id} className={`hover:bg-zinc-50 ${i.priority === "Critical" && isOpen(i) ? "bg-red-50/40" : ""}`}>
                  <td className="px-3 py-2.5 font-mono text-xs text-zinc-500">{i.id}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5" title={i.description}>{i.description}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: i.status === "Closed" ? "#dcfce7" : i.status === "Blocked" ? "#fee2e2" : i.status === "In Progress" ? "#dbeafe" : "#f4f4f5",
                        color: i.status === "Closed" ? "#166534" : i.status === "Blocked" ? "#991b1b" : i.status === "In Progress" ? "#1e40af" : "#52525b",
                      }}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium" style={{ color: PRIORITY_COLORS[i.priority] || "#71717a" }}>
                      {i.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">
                    {i.module && i.module.toUpperCase() !== "BLANK" ? i.module : <span className="text-amber-600">Non renseigné</span>}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">{i.raisedBy || "—"}</td>
                  <td className="px-3 py-2.5 text-zinc-600">{i.openDate || <span className="text-amber-600">Information absente</span>}</td>
                  <td className="px-3 py-2.5 text-zinc-600">
                    {i.closeDate || (isOpen(i) ? <span className="text-zinc-400">Ticket ouvert</span> : <span className="text-amber-600">Information absente</span>)}
                  </td>
                  <td className="px-3 py-2.5">
                    {isOpen(i) ? (
                      <span className="text-xs font-medium text-blue-700">{age !== null ? `${age} j d'ancienneté` : "Date absente"}</span>
                    ) : delay !== null ? (
                      <span className="text-xs text-zinc-600">Résolu en {delay} j</span>
                    ) : (
                      <span className="text-xs text-amber-600">Non calculable</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {i.payment ? (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: i.payment === "PAID" ? "#dcfce7" : i.payment === "INVOICED" ? "#dbeafe" : "#fef3c7",
                          color: i.payment === "PAID" ? "#166534" : i.payment === "INVOICED" ? "#1e40af" : "#92400e",
                        }}
                      >
                        {i.payment}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">Non renseigné</span>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-zinc-500" title={i.comments}>
                    {i.comments || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Page {current} / {totalPages} · {sorted.length} ticket(s)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
            className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Précédent
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current >= totalPages}
            className="flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Légende */}
      <p className="mt-3 text-xs text-zinc-400">
        Priorités : Critical ({PRIORITIES[0]}), High, Medium, Low · Les lignes roses = tickets Critical encore ouverts ·
        « Information absente » = valeur vide dans le fichier Excel.
      </p>
    </div>
  );
}
