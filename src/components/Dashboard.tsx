"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Table2, BarChart3, RotateCcw, Filter, X, AlertTriangle, PlusCircle, Users, Bell, Menu } from "lucide-react";
import type { IssueData, DimKey, Filters } from "@/lib/issues";
import { PRIORITIES, EMPTY_FILTERS, applyFilters, filterChips, NO_VALUE, NO_VALUE_DISPLAY, isOpen } from "@/lib/issues";
import { t, type Locale } from "@/lib/i18n";
import IssueTable from "./IssueTable";
import Analysis from "./Analysis";
import SessionControls from "./SessionControls";
import Banner from "./Banner";
import Sidebar from "./Sidebar";
import AdminHome from "./AdminHome";
import ManagerHome from "./ManagerHome";
import AgentHome from "./AgentHome";
import type { SidebarItem } from "./Sidebar";

export default function Dashboard({
  data,
  syncNote,
  user,
  locale = "fr",
}: {
  data: IssueData;
  syncNote?: { outcome: string; detail: string } | null;
  user: { name: string; email: string; role: string };
  locale?: Locale;
}) {
  const router = useRouter();
  const canCreateTickets = user.role === "admin" || user.role === "manager";
  const canAccessGmail = user.role === "admin";
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeSection, setActiveSection] = useState("overview");
  const [notifOpen, setNotifOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const visibleIssues = data.issues;

  const modules = useMemo(
    () => [...new Set(visibleIssues.map((i) => i.module).filter(Boolean))].sort(),
    [visibleIssues]
  );
  const payments = useMemo(() => {
    const vals = new Set(visibleIssues.map((i) => i.payment).filter(Boolean));
    return [...vals].sort();
  }, [visibleIssues]);

  const filtered = useMemo(() => applyFilters(visibleIssues, filters), [visibleIssues, filters]);
  const charts = useMemo(
    () => ({
      status: applyFilters(visibleIssues, filters, "status"),
      priority: applyFilters(visibleIssues, filters, "priority"),
      module: applyFilters(visibleIssues, filters, "module"),
      payment: applyFilters(visibleIssues, filters, "payment"),
      period: applyFilters(visibleIssues, filters, "period"),
    }),
    [visibleIssues, filters]
  );

  const chips = filterChips(filters);
  const filtersActive = chips.length > 0;

  const sections = useMemo(
    () => [
      { id: "overview", label: t(locale, "overview"), icon: LayoutDashboard },
      { id: "tracking", label: t(locale, "ticketTracking"), icon: Table2 },
      { id: "analysis", label: locale === "fr" ? "Analyse" : "Analysis", icon: BarChart3 },
    ],
    [locale]
  );

  const navItems = useMemo<SidebarItem[]>(() => {
    const nav: Record<string, SidebarItem[]> = {
      admin: [
        { id: "overview", label: t(locale, "overview"), href: "/", icon: LayoutDashboard, group: t(locale, "general") },
        { id: "tracking", label: t(locale, "allTickets"), href: "/admin/tickets", icon: Table2, group: t(locale, "general") },
        { id: "analysis", label: t(locale, "reportsAnalysis"), href: "/admin/reports", icon: BarChart3, group: t(locale, "general") },
        { id: "admin", label: t(locale, "collaborators"), href: "/admin", icon: Users, group: t(locale, "management") },
        { id: "emails", label: t(locale, "reportsNotifications"), href: "/emails", icon: Bell, group: t(locale, "management") },
      ],
      manager: [
        { id: "overview", label: t(locale, "supervision"), href: "/", icon: LayoutDashboard, group: t(locale, "supervision") },
        { id: "tracking", label: t(locale, "ticketTracking"), href: "/manager/tickets", icon: Table2, group: t(locale, "supervision") },
        { id: "analysis", label: t(locale, "interventionReports"), href: "/manager/interventions", icon: BarChart3, group: t(locale, "supervision") },
        { id: "agents", label: t(locale, "agentTracking"), href: "/manager/agents", icon: Users, group: t(locale, "supervision") },
        { id: "assignation", label: t(locale, "ticketAssignment"), href: "/manager/assignation", icon: Table2, group: t(locale, "supervision") },
        { id: "paiements", label: t(locale, "agentPayments"), href: "/manager/paiements", icon: BarChart3, group: t(locale, "supervision") },
        { id: "retards", label: t(locale, "delaysAlerts"), href: "/manager/retards", icon: AlertTriangle, group: t(locale, "supervision") },
      ],
      agent: [
        { id: "overview", label: t(locale, "myDashboard"), href: "/", icon: LayoutDashboard, group: t(locale, "mySpace") },
        { id: "tracking", label: t(locale, "myTickets"), href: "/agent/mes-tickets", icon: Table2, group: t(locale, "mySpace") },
        { id: "analysis", label: t(locale, "myInterventions"), href: "/agent/interventions", icon: BarChart3, group: t(locale, "mySpace") },
      ],
    };
    return nav[user.role] ?? nav.admin;
  }, [locale, user.role]);

  const notifications = useMemo(() => {
    const list: { id: string; title: string; body: string; href: string }[] = [];
    if (syncNote) {
      const body =
        syncNote.outcome === "not_configured"
          ? t(locale, "gmailNotConfigured")
          : `${t(locale, "lastSync")} : ${syncNote.outcome} — ${syncNote.detail}`;
      list.push({ id: "sync", title: t(locale, "gmail"), body, href: "/emails" });
    }
    const criticalOpen = filtered.filter((i) => isOpen(i) && (i.priority === "Critical" || i.priority === "High")).length;
    if (criticalOpen > 0) {
      list.push({
        id: "critical",
        title: locale === "fr" ? "Tickets critiques / à haut risque" : "Critical / high-risk tickets",
        body:
          locale === "fr"
            ? `${criticalOpen} ticket(s) Critical/High encore ouverts avec les filtres actifs.`
            : `${criticalOpen} Critical/High ticket(s) still open with active filters.`,
        href: "#tracking",
      });
    }
    return list;
  }, [syncNote, filtered, locale]);

  function toggleFilter(dim: DimKey, value: string) {
    setFilters((f) => ({ ...f, [dim]: f[dim] === value ? "" : value }));
  }

  function toggleMonth(from: string, to: string) {
    setFilters((f) => (f.from === from && f.to === to ? { ...f, from: "", to: "" } : { ...f, from, to }));
  }

  function removeChip(key: string) {
    if (key === "period") setFilters((f) => ({ ...f, from: "", to: "" }));
    else setFilters((f) => ({ ...f, [key]: "" }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const Home = user.role === "admin" ? AdminHome : user.role === "manager" ? ManagerHome : AgentHome;

  function handleNavSelect(id: string) {
    if (id.startsWith("/")) {
      router.push(id);
      return;
    }
    setActiveSection(id);
  }

  function handleLogout() {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/login");
      router.refresh();
    });
  }

  const selectClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none";
  const fromLabel = data.period.from.split("-").reverse().join("/");
  const toLabel = data.period.to.split("-").reverse().join("/");

  return (
    <div>
      <Banner />

      {canAccessGmail && syncNote && (
        <div className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2 text-xs text-zinc-600">
            <span className="font-medium text-zinc-700">Gmail :</span>
            <span data-sync-banner>
              {syncNote.outcome === "not_configured"
                ? t(locale, "gmailNotConfigured")
                : `${t(locale, "lastSync")} : ${syncNote.outcome} — ${syncNote.detail}`}
            </span>
            <Link href="/emails" className="font-medium text-blue-700 underline">
              {t(locale, "gmail")}
            </Link>
          </div>
        </div>
      )}

      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-6 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div className="w-full">
              <h1 className="text-base font-bold text-zinc-900">{t(locale, "dashboardTitle")}</h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t(locale, "period", { from: fromLabel, to: toLabel, lastUpdate: data.lastUpdate })}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavSelect("tracking");
              }}
              className="flex items-center"
            >
              <input
                type="search"
                name="q"
                placeholder={t(locale, "searchPlaceholder")}
                className="w-56 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none"
              />
              <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                {t(locale, "search")}
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {t(locale, "ticketsCount", { filtered: filtered.length, total: visibleIssues.length })}
              </span>
              {canCreateTickets && (
                <Link href="/tickets/nouveau" className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                  <PlusCircle size={15} /> {t(locale, "newTicket")}
                </Link>
              )}
              {canAccessGmail && (
                <Link href="/emails" className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  {t(locale, "gmail")}
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label={t(locale, "notifications")}
                  className="relative rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-700 hover:bg-zinc-50"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg">
                    <div className="border-b border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-900">{t(locale, "notifications")}</div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-zinc-400">{t(locale, "noNotifications")}</p>
                      ) : (
                        notifications.map((n) => (
                          <a key={n.id} href={n.href} onClick={() => setNotifOpen(false)} className="block border-b border-zinc-100 px-3 py-3 hover:bg-zinc-50">
                            <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">{n.body}</p>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {user.role === "admin" && (
                <Link href="/admin" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                  <Users size={15} /> {t(locale, "users")}
                </Link>
              )}
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label={t(locale, "openMenu")}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-700 hover:bg-zinc-50 lg:hidden"
              >
                <Menu size={16} />
              </button>
              <SessionControls user={user} locale={locale} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
              <Filter size={15} /> {t(locale, "filters")}
            </span>
            <select
              aria-label={locale === "fr" ? "Filtrer par priorité" : "Filter by priority"}
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t(locale, "allPriorities")}</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              aria-label={locale === "fr" ? "Filtrer par module" : "Filter by module"}
              value={filters.module}
              onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t(locale, "allModules")}</option>
              <option value={NO_VALUE}>{t(locale, "notSpecified")}</option>
              {modules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              aria-label={locale === "fr" ? "Filtrer par paiement" : "Filter by payment"}
              value={filters.payment}
              onChange={(e) => setFilters((f) => ({ ...f, payment: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t(locale, "allPayments")}</option>
              <option value={NO_VALUE_DISPLAY}>{t(locale, "notSpecified")}</option>
              {payments.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              disabled={!filtersActive}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={14} /> {t(locale, "resetFilters")}
            </button>
          </div>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">{t(locale, "activeSelection")}</span>
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

      {filtered.length === 0 && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="font-medium">{t(locale, "noTicketsMatch")}</span>
            <span className="text-amber-700">{t(locale, "removeCriteria")}</span>
            <button onClick={resetFilters} className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
              {t(locale, "resetFilters")}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:pl-52">
        <Sidebar
          items={navItems}
          active={activeSection}
          onSelect={handleNavSelect}
          user={user}
          onLogout={handleLogout}
          open={navOpen}
          onOpenChange={setNavOpen}
          locale={locale}
        />

        <main className="min-w-0 flex-1 space-y-16">
          <section id="overview" className="scroll-mt-4">
            <Home
              data={data}
              syncNote={syncNote}
              user={user}
              issues={filtered}
              total={visibleIssues.length}
              charts={charts}
              filters={filters}
              onToggle={toggleFilter}
              onToggleMonth={toggleMonth}
              onReset={resetFilters}
            />
          </section>

          <section id="tracking" className="scroll-mt-4">
            <IssueTable issues={filtered} onReset={resetFilters} filtersActive={filtersActive} />
          </section>

          <section id="analysis" className="scroll-mt-4">
            <Analysis
              issues={filtered}
              controls={data.controls}
              charts={charts}
              filters={filters}
              onToggle={toggleFilter}
              role={user.role}
            />
          </section>
        </main>
      </div>

      <footer className="border-t border-zinc-200 bg-white py-3">
        <p className="text-center text-xs text-zinc-400">{t(locale, "footer")}</p>
      </footer>
    </div>
  );
}
