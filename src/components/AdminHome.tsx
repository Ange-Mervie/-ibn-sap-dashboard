"use client";

import { useMemo } from "react";
import type { Issue } from "@/lib/issues";
import Overview from "./Overview";
import { Panel, PRIORITY_COLORS } from "./Charts";
import type { HomeProps } from "./homeProps";

export default function AdminHome(props: HomeProps) {
  const { issues, total, charts, filters, onToggle, onToggleMonth } = props;

  const recent = useMemo(() => {
    const list = [...issues];
    const key = (i: Issue) => i.closeDate || i.openDate || "";
    list.sort((a, b) => key(b).localeCompare(key(a)));
    return list.slice(0, 8);
  }, [issues]);

  return (
    <>
      <Overview issues={issues} total={total} charts={charts} filters={filters} onToggle={onToggle} onToggleMonth={onToggleMonth} />
      <Panel title="Dernières activités">
        <ul className="space-y-2">
          {recent.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm">
              <span className="font-semibold text-zinc-900">{i.id}</span>
              <span className="min-w-0 flex-1 text-zinc-600">{i.description}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_COLORS[i.priority] ?? "bg-zinc-100 text-zinc-700"}`}>
                {i.priority}
              </span>
              <span className="text-xs text-zinc-500">{i.status}</span>
              <span className="text-xs text-zinc-500">{i.module || "—"}</span>
            </li>
          ))}
          {recent.length === 0 && <p className="py-6 text-center text-sm text-zinc-400">Aucune activité récente.</p>}
        </ul>
      </Panel>
    </>
  );
}
