import type { ReactNode } from "react";

export default function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-1 rounded-full bg-[var(--ibn-blue-600)]" aria-hidden />
          <h2 className="text-[17px] font-semibold tracking-tight text-[var(--ibn-text-strong)]">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-1 pl-[18px] text-[12.5px] text-[var(--ibn-text-muted)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}