"use client";

import type { ReactNode } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";
import { STATUSES, PRIORITIES } from "@/lib/issues";
import type { DimKey } from "@/lib/issues";

// ============================================================
// Couleurs (modifiez ici) — bleu professionnel + neutres
// ============================================================
export const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#94a3b8",
  "In Progress": "#2563eb",
  "On Hold": "#64748b",
  Blocked: "#dc2626",
  "waiting for Customer": "#f59e0b",
  Closed: "#16a34a",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#f59e0b",
  Low: "#94a3b8",
};

export const PAYMENT_COLORS: Record<string, string> = {
  PAID: "#16a34a",
  INVOICED: "#2563eb",
  "NOT INVOICED": "#f59e0b",
  "Non renseigné": "#cbd5e1",
};

// ============================================================
// Interactivité (comme Power BI) :
// - un clic (secteur / barre / légende) fait basculer le filtre global
// - `active` = valeur déjà filtrée sur cette dimension (surbrillance)
// - les données arrivent SANS le filtre de cette dimension : les autres
//   catégories restent visibles et cliquables (filtre combinable)
// ============================================================
export type SelectFn = (dim: DimKey, value: string) => void;

type Interact = {
  dim?: DimKey;
  active?: string;
  onSelect?: SelectFn;
};

// Opacité d'une catégorie : atténuée si un filtre est actif sur la
// dimension et que ce n'est pas la valeur sélectionnée
function dimmed(active: string | undefined, name: string): number {
  return active && active !== name ? 0.3 : 1;
}

// ---------- panneau (carte blanche) ----------
export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${className}`}>
      {title && (
        <h3 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700">
          {title}
        </h3>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ---------- graphique ou message "aucune donnée" ----------
// data-chart = cible stable pour les tests e2e ;
// chart-clickable = curseur pointeur sur les éléments cliquables
export function ChartBox({
  id,
  data,
  children,
  emptyMsg = "Aucune donnée pour ces filtres.",
}: {
  id: string;
  data: { name: string; value: number }[];
  children: ReactNode;
  emptyMsg?: string;
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-zinc-400">{emptyMsg}</p>;
  }
  return (
    <div data-chart={id} className="chart-clickable">
      {children}
    </div>
  );
}

// ---------- pastilles de catégories cliquables ----------
// Recharts ne produit qu'une entrée de légende par SÉRIE de barres (« value »),
// pas une par catégorie : on affiche donc nos propres pastilles cliquables,
// avec la valeur et la sélection active en évidence (comme Power BI).
export function CategoryChips({
  data,
  color,
  dim,
  active,
  onSelect,
}: {
  data: { name: string; value: number }[];
  color: string | ((name: string) => string);
  dim: DimKey;
  active?: string;
  onSelect?: SelectFn;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {data.map((entry) => {
        const isActive = active === entry.name;
        const swatch = typeof color === "function" ? color(entry.name) : color;
        return (
          <button
            key={entry.name}
            type="button"
            data-cat={entry.name}
            aria-pressed={isActive}
            title="Cliquez pour filtrer sur cette catégorie"
            onClick={() => onSelect?.(dim, entry.name)}
            className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
              isActive
                ? "border-blue-600 bg-blue-600 font-medium text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: isActive ? "#ffffff" : swatch }}
            />
            {entry.name}
            <span className={`text-[10px] ${isActive ? "text-blue-100" : "text-zinc-400"}`}>
              {entry.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- infobulle ----------
function SimpleTooltip({
  active,
  payload,
  hint,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  hint?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow">
      <span className="font-medium">{payload[0].name}</span> : {payload[0].value}
      {hint && <p className="mt-0.5 text-zinc-400">Cliquez pour filtrer</p>}
    </div>
  );
}

// ---------- ordres d'affichage ----------
export function sortByStatus(data: { name: string; value: number }[]) {
  const order: string[] = [...STATUSES];
  return [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

export function sortByPriority(data: { name: string; value: number }[]) {
  const order: string[] = [...PRIORITIES];
  return [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
}

// ---------- graphique camembert (statuts) ----------
export function StatusPie({ data, active, onSelect }: { data: { name: string; value: number }[] } & Interact) {
  const sorted = sortByStatus(data);
  const clickable = Boolean(onSelect && active !== undefined);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={sorted}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          outerRadius={80}
          innerRadius={42}
          paddingAngle={1}
          onClick={(sector) => {
            const name = String(sector.payload?.name ?? sector.name ?? "");
            if (name) onSelect?.("status", name);
          }}
        >
          {sorted.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLORS[entry.name] || "#94a3b8"}
              stroke="#fff"
              strokeWidth={2}
              opacity={dimmed(active, entry.name)}
            />
          ))}
        </Pie>
        <Tooltip content={<SimpleTooltip hint={clickable} />} />
        <Legend
          verticalAlign="bottom"
          iconType="square"
          iconSize={9}
          formatter={(value) => <span className="text-xs text-zinc-600">{value}</span>}
          onClick={(legend) => onSelect?.("status", String(legend.value))}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------- barres verticales génériques ----------
export function CountBars({
  data,
  color,
  order,
  dim,
  active,
  onSelect,
}: {
  data: { name: string; value: number }[];
  color: string | ((name: string) => string);
  order?: string[];
} & Interact) {
  let sorted = data;
  if (order) {
    sorted = [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  } else {
    sorted = [...data].sort((a, b) => b.value - a.value);
  }
  const clickable = Boolean(dim && onSelect);
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={sorted} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#d4d4d8" }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={30} />
          <Tooltip content={<SimpleTooltip hint={clickable} />} cursor={{ fill: "#f8fafc" }} />
          <Bar
            dataKey="value"
            radius={[3, 3, 0, 0]}
            onClick={(bar) => {
              const name = String(bar.payload?.name ?? "");
              if (clickable && name) onSelect?.(dim!, name);
            }}
          >
            {sorted.map((entry) => (
              <Cell
                key={entry.name}
                fill={typeof color === "function" ? color(entry.name) : color}
                opacity={dimmed(active, entry.name)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {clickable && (
        <CategoryChips data={sorted} color={color} dim={dim!} active={active} onSelect={onSelect} />
      )}
    </div>
  );
}

// ---------- barres horizontales (modules) ----------
export function HorizontalBars({
  data,
  color,
  dim,
  active,
  onSelect,
}: { data: { name: string; value: number }[]; color: string } & Interact) {
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const clickable = Boolean(dim && onSelect);
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sorted} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#d4d4d8" }} tickLine={false} width={110} />
          <Tooltip content={<SimpleTooltip hint={clickable} />} cursor={{ fill: "#f8fafc" }} />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            onClick={(bar) => {
              const name = String(bar.payload?.name ?? "");
              if (clickable && name) onSelect?.(dim!, name);
            }}
          >
            {sorted.map((entry) => (
              <Cell key={entry.name} fill={color} opacity={dimmed(active, entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {clickable && (
        <CategoryChips data={sorted} color={color} dim={dim!} active={active} onSelect={onSelect} />
      )}
    </div>
  );
}

// ---------- évolution mensuelle (ouverts / clôturés) ----------
// Clic sur une barre = filtre de période sur ce mois (récliquer = annuler).
// `active` = mois sélectionné ; les autres mois restent visibles atténués.
export function TimelineBars({
  data,
  active,
  onSelectMonth,
}: {
  data: { month: string; ouverts: number; clotures: number; from: string; to: string }[];
  active?: { from: string; to: string };
  onSelectMonth?: (from: string, to: string) => void;
}) {
  const isActive = (m: { from: string; to: string }) =>
    Boolean(active && active.from && active.from === m.from && active.to === m.to);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#d4d4d8" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<SimpleTooltip hint={Boolean(onSelectMonth)} />} cursor={{ fill: "#f8fafc" }} />
        <Legend iconType="square" iconSize={9} formatter={(value) => <span className="text-xs text-zinc-600">{value}</span>} />
        <Bar
          dataKey="ouverts"
          name="Ouverts"
          fill="#2563eb"
          radius={[3, 3, 0, 0]}
          onClick={(bar) => {
            const m = bar.payload;
            if (m) onSelectMonth?.(m.from, m.to);
          }}
        >
          {data.map((m) => (
            <Cell key={m.month} fill="#2563eb" opacity={active?.from ? (isActive(m) ? 1 : 0.35) : 1} />
          ))}
        </Bar>
        <Bar
          dataKey="clotures"
          name="Clôturés"
          fill="#16a34a"
          radius={[3, 3, 0, 0]}
          onClick={(bar) => {
            const m = bar.payload;
            if (m) onSelectMonth?.(m.from, m.to);
          }}
        >
          {data.map((m) => (
            <Cell key={m.month} fill="#16a34a" opacity={active?.from ? (isActive(m) ? 1 : 0.35) : 1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
