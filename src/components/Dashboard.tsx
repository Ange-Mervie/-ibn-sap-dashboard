"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Menu,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  SlidersHorizontal,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { IssueData, DimKey, Filters } from "@/lib/issues";
import { applyFilters, filterChips, isOpen, EMPTY_FILTERS, NO_VALUE, NO_VALUE_DISPLAY } from "@/lib/issues";
import { t, type Locale } from "@/lib/i18n";
import Banner from "./Banner";
import SessionControls from "./SessionControls";
import Sidebar, { type NavItem } from "./Sidebar";
import AdminHome from "./AdminHome";
import ManagerHome from "./ManagerHome";
import ConsultantHome from "./ConsultantHome";
import IssueTable from "./IssueTable";
import Analysis from "./Analysis";

const ALL_MODULES = "Tous les modules";
const ALL_PAYMENTS = "Tous les statuts de paiement";

type SessionUser = { name: string; email: string; role: string };

export default function Dashboard({
  data,
  user,
  locale = "fr",
}: {
  data: IssueData;
  user: SessionUser;
  syncNote?: { outcome: string; detail: string } | null;
  locale?: Locale;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const Home = user.role === "admin" ? AdminHome : user.role === "manager" ? ManagerHome : ConsultantHome;

  const visibleIssues = data.issues;

  const filtered = useMemo(() => applyFilters(visibleIssues, filters), [visibleIssues, filters]);
  const filtersActive = Boolean(filters.status || filters.priority || filters.module || filters.payment || filters.from || filters.to);

  const charts = useMemo(
    () => ({
      status: visibleIssues,
      priority: visibleIssues,
      module: visibleIssues,
      payment: visibleIssues,
      period: visibleIssues,
    }),
    [visibleIssues]
  );

  const modules = useMemo(
    () => [...new Set(visibleIssues.map((i) => i.module).filter((m) => m && m.toUpperCase() !== "BLANK"))].sort(),
    [visibleIssues]
  );
  const payments = useMemo(
    () => [...new Set(visibleIssues.map((i) => i.payment).filter((p) => p && p.toUpperCase() !== "BLANK"))].sort(),
    [visibleIssues]
  );

  const chips = filterChips(filters);

  const notifications = useMemo(() => {
    if (user.role !== "admin") return [] as { id: string; title: string; body: string; href: string }[];
    const items: { id: string; title: string; body: string; href: string }[] = [];
    const critical = visibleIssues.filter((i) => isOpen(i) && i.priority === "Critical");
    if (critical.length) {
      items.push({
        id: "crit",
        title: `${critical.length} ticket(s) Critical ouvert(s)`,
        body: "À traiter en priorité.",
        href: "/?section=tracking",
      });
    }
    return items;
  }, [user.role, visibleIssues]);

  const canCreateTickets = user.role === "admin" || user.role === "manager";
  const canAccessGmail = user.role === "admin";

  const period = useMemo(() => {
    const dates = data.issues.map((i) => i.openDate).filter(Boolean).sort();
    return dates.length ? `${dates[0].slice(0, 10)} → ${dates[dates.length - 1].slice(0, 10)}` : "—";
  }, [data.issues]);

  const navItems: NavItem[] =
    user.role === "admin"
      ? [
          { id: "overview", label: t(locale, "overview"), href: "/", icon: LayoutDashboard, group: t(locale, "main") },
          { id: "tracking", label: t(locale, "tracking"), href: "/", icon: ClipboardList, group: t(locale, "main") },
          { id: "analysis", label: t(locale, "analysis"), href: "/", icon: ChartNoAxesCombined, group: t(locale, "main") },
          { id: "tickets", label: t(locale, "tickets"), href: "/tickets", icon: FolderKanban, group: t(locale, "management") },
          { id: "users", label: t(locale, "users"), href: "/admin", icon: Users, group: t(locale, "management") },
          { id: "reports", label: t(locale, "reports"), href: "/admin/rapports", icon: ReceiptText, group: t(locale, "management") },
          { id: "payments", label: t(locale, "payments"), href: "/admin/payments", icon: Wallet, group: t(locale, "management") },
          { id: "assignation", label: t(locale, "assignation"), href: "/manager/assignation", icon: UserCog, group: t(locale, "management") },
          { id: "emails", label: t(locale, "emails"), href: "/emails", icon: Mail, group: t(locale, "account") },
        ]
      : user.role === "manager"
        ? [
            { id: "overview", label: t(locale, "overview"), href: "/", icon: LayoutDashboard, group: t(locale, "main") },
            { id: "tracking", label: t(locale, "tracking"), href: "/", icon: ClipboardList, group: t(locale, "main") },
            { id: "analysis", label: t(locale, "analysis"), href: "/", icon: ChartNoAxesCombined, group: t(locale, "main") },
            { id: "agents", label: t(locale, "agentTracking"), href: "/manager/consultants", icon: Users, group: t(locale, "supervision") },
            { id: "paiements", label: t(locale, "agentPayments"), href: "/manager/paiements", icon: BarChart3, group: t(locale, "supervision") },
            { id: "retards", label: t(locale, "retards"), href: "/manager/retards", icon: CalendarClock, group: t(locale, "supervision") },
            { id: "emails", label: t(locale, "emails"), href: "/emails", icon: Mail, group: t(locale, "account") },
          ]
        : [
            { id: "overview", label: t(locale, "myTickets"), href: "/", icon: LayoutDashboard, group: t(locale, "main") },
            { id: "mes-tickets", label: t(locale, "myTickets"), href: "/consultant/mes-tickets", icon: ClipboardList, group: t(locale, "work") },
            { id: "echeances", label: t(locale, "myDeadlines"), href: "/consultant/echeances", icon: CalendarClock, group: t(locale, "work") },
            { id: "historique", label: t(locale, "myHistory"), href: "/consultant/historique", icon: ChartNoAxesCombined, group: t(locale, "work") },
            { id: "interventions", label: t(locale, "myReports"), href: "/consultant/interventions", icon: ReceiptText, group: t(locale, "work") },
            { id: "remuneration", label: t(locale, "myPay"), href: "/consultant/remuneration", icon: Wallet, group: t(locale, "work") },
          ];

  function toggleFilter(dim: DimKey, value: string) {
    const key = dim as keyof Filters;
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));
  }
  function toggleMonth(from: string, to: string) {
    setFilters((f) =>
      f.from === from && f.to === to ? { ...f, from: "", to: "" } : { ...f, from, to }
    );
  }
  function removeChip(key: keyof Filters) {
    setFilters((f) => ({ ...f, [key]: "" }));
  }
  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function handleNavSelect(id: string, href: string) {
    if (id === "overview" || id === "tracking" || id === "analysis") {
      setActiveSection(id);
      setNavOpen(false);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    router.push(href);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const roleLabel = t(locale, (`role_${user.role}` as "role_admin"));

  return (
    <div className="min-h-screen bg-[var(--ibn-bg)]">
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

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[var(--ibn-border)] bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label={t(locale, "openMenu")}
              className="ibn-btn ibn-btn-ghost px-2 lg:hidden"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--ibn-text-faint)]">
                {roleLabel}
              </p>
              <h1 className="truncate text-[16px] font-semibold tracking-tight text-[var(--ibn-text-strong)]">
                {t(locale, "appName")}
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <span className="ibn-badge mr-1 hidden bg-slate-100 text-slate-600 md:inline-flex">
                <CalendarClock size={12} /> {period}
              </span>

              {canCreateTickets && (
                <Link href="/tickets/nouveau" className="ibn-btn ibn-btn-primary hidden sm:inline-flex">
                  <PlusCircle size={15} /> {t(locale, "newTicket")}
                </Link>
              )}
              {canAccessGmail && (
                <Link href="/emails" className="ibn-btn ibn-btn-ghost hidden md:inline-flex" aria-label={t(locale, "gmail")}>
                  <Mail size={16} />
                </Link>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label={t(locale, "notifications")}
                  className="ibn-btn ibn-btn-ghost relative px-2"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <button
                      type="button"
                      aria-label={t(locale, "closeMenu")}
                      onClick={() => setNotifOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--ibn-border)] bg-white shadow-[var(--ibn-shadow-md)]">
                      <div className="border-b border-[var(--ibn-border)] px-4 py-3 text-[13px] font-semibold text-[var(--ibn-text-strong)]">
                        {t(locale, "notifications")}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-5 text-[12.5px] text-[var(--ibn-text-faint)]">{t(locale, "noNotifications")}</p>
                        ) : (
                          notifications.map((n) => (
                            <a
                              key={n.id}
                              href={n.href}
                              onClick={() => setNotifOpen(false)}
                              className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"
                            >
                              <p className="text-[12.5px] font-medium text-[var(--ibn-text-strong)]">{n.title}</p>
                              <p className="mt-0.5 text-[11.5px] text-[var(--ibn-text-muted)]">{n.body}</p>
                            </a>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <SessionControls user={user} locale={locale} />
            </div>
          </div>
        </header>

        <Banner
          title={t(locale, "overview")}
          subtitle={
            user.role === "admin"
              ? "Supervision complète des incidents SAP : volume, priorités, modules, délais et qualité des données."
              : user.role === "manager"
                ? "Pilotage de l'équipe : charge, affectations, retards et qualité des interventions."
                : "Votre espace de travail : tickets assignés, échéances et interventions."
          }
          meta={[
            { label: t(locale, "dataPeriod"), value: period },
            { label: t(locale, "tickets"), value: String(visibleIssues.length) },
            { label: t(locale, "open"), value: String(visibleIssues.filter(isOpen).length) },
            { label: t(locale, "closed"), value: String(visibleIssues.length - visibleIssues.filter(isOpen).length) },
          ]}
        />

        <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-6 lg:px-8">
          <section className="ibn-card p-4" aria-label={t(locale, "filters")}>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ibn-text-muted)]">
                <SlidersHorizontal size={14} /> {t(locale, "filters")}
              </span>
              <select
                aria-label={locale === "fr" ? "Filtrer par priorité" : "Filter by priority"}
                value={filters.priority}
                onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                className="ibn-select w-auto min-w-[150px]"
              >
                <option value="">{t(locale, "allPriorities")}</option>
                {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                aria-label={locale === "fr" ? "Filtrer par module" : "Filter by module"}
                value={filters.module}
                onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
                className="ibn-select w-auto min-w-[150px]"
              >
                <option value="">{ALL_MODULES}</option>
                <option value={NO_VALUE}>{NO_VALUE_DISPLAY}</option>
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                aria-label={locale === "fr" ? "Filtrer par paiement" : "Filter by payment"}
                value={filters.payment}
                onChange={(e) => setFilters((f) => ({ ...f, payment: e.target.value }))}
                className="ibn-select w-auto min-w-[150px]"
              >
                <option value="">{ALL_PAYMENTS}</option>
                <option value={NO_VALUE_DISPLAY}>{NO_VALUE_DISPLAY}</option>
                {payments.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button onClick={resetFilters} disabled={!filtersActive} className="ibn-btn ml-auto">
                <RotateCcw size={14} /> {t(locale, "resetFilters")}
              </button>
            </div>

            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-[11px] font-medium text-[var(--ibn-text-faint)]">{t(locale, "activeSelection")}</span>
                {chips.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => removeChip(c.key as keyof Filters)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    {c.label}
                    <X size={11} />
                  </button>
                ))}
              </div>
            )}
          </section>

          {filtered.length === 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
              <span className="font-medium">{t(locale, "noTicketsMatch")}</span>
              <span className="text-amber-700">{t(locale, "removeCriteria")}</span>
              <button onClick={resetFilters} className="ibn-btn ml-auto border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
                {t(locale, "resetFilters")}
              </button>
            </div>
          )}

          <div className="mt-8 space-y-10">
            <section id="overview" className="scroll-mt-24">
              <Home
                data={data}
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

            <section id="tracking" className="scroll-mt-24">
              <IssueTable issues={filtered} onReset={resetFilters} filtersActive={filtersActive} />
            </section>

            <section id="analysis" className="scroll-mt-24">
              <Analysis
                issues={filtered}
                controls={data.controls}
                charts={charts}
                filters={filters}
                onToggle={toggleFilter}
                role={user.role}
              />
            </section>
          </div>

          <footer className="mt-14 border-t border-[var(--ibn-border)] pt-5 text-center text-[11px] text-[var(--ibn-text-faint)]">
            {t(locale, "footer")}
          </footer>
        </main>
      </div>
    </div>
  );
}