"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Table2, BarChart3, RotateCcw, Filter, X, AlertTriangle, PlusCircle, Users } from "lucide-react";
import type { IssueData, DimKey, Filters } from "@/lib/issues";
import { STATUSES, PRIORITIES, EMPTY_FILTERS, applyFilters, filterChips, NO_VALUE, NO_VALUE_DISPLAY } from "@/lib/issues";
import Overview from "./Overview";
import IssueTable from "./IssueTable";
import Analysis from "./Analysis";
import SessionControls from "./SessionControls";

// Sections de navigation (sidebar + mobile)
const SECTIONS = [
  { id: "overview", label: "Vue générale", icon: LayoutDashboard },
  { id: "tracking", label: "Suivi des incidents", icon: Table2 },
  { id: "analysis", label: "Analyse", icon: BarChart3 },
];

export default function Dashboard({
  data,
  syncNote,
  user,
}: {
  data: IssueData;
  syncNote?: { outcome: string; detail: string } | null;
  user: { name: string; email: string; role: string };
}) {
  const canCreateTickets = user.role === "admin" || user.role === "agent";
  const canAccessGmail = user.role === "admin" || user.role === "manager";
  // ==========================================================
  // ÉTAT GLOBAL UNIQUE DES FILTRES (source de vérité)
  // Tout en dérive : KPI, graphiques, tableau, compteur, chips.
  // Chaque graphique reçoit ses données via applyFilters(..., exclude)
  // pour ne pas filtrer sa propre dimension (filtres combinables).
  // ==========================================================
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeSection, setActiveSection] = useState("overview");

  // Listes des filtres déroulants (à partir des données)
  const modules = useMemo(
    () => [...new Set(data.issues.map((i) => i.module).filter(Boolean))].sort(),
    [data.issues]
  );
  const payments = useMemo(() => {
    const vals = new Set(data.issues.map((i) => i.payment).filter(Boolean));
    return [...vals].sort();
  }, [data.issues]);

  // Tickets retenus par la combinaison de filtres active
  const filtered = useMemo(() => applyFilters(data.issues, filters), [data.issues, filters]);

  // Données par graphique : chaque dimension est exclue de son propre
  // filtre → les autres catégories restent visibles et cliquables
  const charts = useMemo(
    () => ({
      status: applyFilters(data.issues, filters, "status"),
      priority: applyFilters(data.issues, filters, "priority"),
      module: applyFilters(data.issues, filters, "module"),
      payment: applyFilters(data.issues, filters, "payment"),
      period: applyFilters(data.issues, filters, "period"),
    }),
    [data.issues, filters]
  );

  const chips = filterChips(filters);
  const filtersActive = chips.length > 0;

  // Clic sur un élément d'un graphique / d'une légende = bascule du filtre
  function toggleFilter(dim: DimKey, value: string) {
    setFilters((f) => ({ ...f, [dim]: f[dim] === value ? "" : value }));
  }

  // Clic sur une barre du graphique temporel = filtre de période sur le mois
  function toggleMonth(from: string, to: string) {
    setFilters((f) => (f.from === from && f.to === to ? { ...f, from: "", to: "" } : { ...f, from, to }));
  }

  // Suppression d'une sélection active (chip)
  function removeChip(key: string) {
    if (key === "period") setFilters((f) => ({ ...f, from: "", to: "" }));
    else setFilters((f) => ({ ...f, [key]: "" }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  // Mise en évidence de la section visible (scrollspy)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const selectClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none";
  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none";

  return (
    <div>
      {/* Bande d'information Gmail / dernière synchronisation (Task 5) */}
      {canAccessGmail && syncNote && (
        <div className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2 text-xs text-zinc-600">
            <span className="font-medium text-zinc-700">Gmail :</span>
            <span data-sync-banner>
              Dernière synchronisation : {syncNote.outcome} — {syncNote.detail}
            </span>
              <Link href="/emails" className="text-blue-700 underline">
              Voir les candidats
            </Link>
          </div>
        </div>
      )}

      {/* ============ EN-TÊTE : titre, période, mise à jour ============ */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-zinc-900">
                IBN GROUP SARL — Suivi des incidents SAP
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                Période des données : du {data.period.from.split("-").reverse().join("/")} au{" "}
                {data.period.to.split("-").reverse().join("/")} · Dernière actualisation : {data.lastUpdate}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {filtered.length} / {data.issues.length} tickets
              </span>
              {canCreateTickets && <Link
                href="/tickets/nouveau"
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <PlusCircle size={15} /> Nouveau ticket
              </Link>}
              {canAccessGmail && <Link href="/emails" className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Gmail</Link>}
              {user.role === "admin" && <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"><Users size={15} /> Utilisateurs</Link>}
              <SessionControls user={user} />
            </div>
          </div>

          {/* Filtres globaux combinables (statut, priorité, module, paiement, période) */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
              <Filter size={15} /> Filtres
            </span>
            <select
              aria-label="Filtrer par statut"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className={selectClass}
            >
              <option value="">Tous les statuts</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Filtrer par priorité"
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className={selectClass}
            >
              <option value="">Toutes les priorités</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              aria-label="Filtrer par module"
              value={filters.module}
              onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
              className={selectClass}
            >
              <option value="">Tous les modules SAP</option>
              <option value={NO_VALUE}>{NO_VALUE}</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              aria-label="Filtrer par paiement"
              value={filters.payment}
              onChange={(e) => setFilters((f) => ({ ...f, payment: e.target.value }))}
              className={selectClass}
            >
              <option value="">Tous les paiements</option>
              <option value={NO_VALUE_DISPLAY}>{NO_VALUE_DISPLAY}</option>
              {payments.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              Ouvert entre
              <input
                type="date"
                aria-label="Date d'ouverture début"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className={inputClass}
              />
              et
              <input
                type="date"
                aria-label="Date d'ouverture fin"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className={inputClass}
              />
            </span>
            <button
              onClick={resetFilters}
              disabled={!filtersActive}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={14} /> Réinitialiser les filtres
            </button>
          </div>

          {/* Sélections actives, clairement visibles et supprimables */}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Sélection active :</span>
              {chips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => removeChip(c.key)}
                  className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  {c.label}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Message clair si aucun ticket ne correspond aux filtres */}
      {filtered.length === 0 && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="font-medium">Aucun ticket ne correspond à la combinaison de filtres actuelle.</span>
            <span className="text-amber-700">Retirez un critère ci-dessus ou réinitialisez les filtres.</span>
            <button
              onClick={resetFilters}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}


      {/* Navigation mobile (barre horizontale) */}
      <nav className="border-b border-zinc-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 py-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                activeSection === s.id ? "bg-blue-50 font-medium text-blue-700" : "text-zinc-600"
              }`}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6">
        {/* ============ BARRE LATÉRALE ============ */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-6 space-y-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-blue-600 font-medium text-white"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <Icon size={16} />
                  {s.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* ============ CONTENU ============ */}
        <main className="min-w-0 flex-1 space-y-16">
          <section id="overview" className="scroll-mt-4">
            <Overview
              issues={filtered}
              total={data.issues.length}
              charts={charts}
              filters={filters}
              onToggle={toggleFilter}
              onToggleMonth={toggleMonth}
            />
          </section>

          <section id="tracking" className="scroll-mt-4">
            <IssueTable issues={filtered} onReset={resetFilters} filtersActive={filtersActive} />
          </section>

          <section id="analysis" className="scroll-mt-4">
            <Analysis
              issues={filtered}
              controls={data.controls}
              source={data.source}
              charts={charts}
              filters={filters}
              onToggle={toggleFilter}
            />
          </section>
        </main>
      </div>

      {/* Pied de page */}
      <footer className="border-t border-zinc-200 bg-white py-5">
        <p className="text-center text-xs text-zinc-400">
          IBN SAP Dashboard , Source : {data.source} · {data.issues.length} tickets ·
          Consultation, création et modification des tickets (la source Excel n&apos;est pas modifiée)
        </p>
      </footer>
    </div>
  );
}
