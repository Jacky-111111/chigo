import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--brand-eggplant)]">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-medium text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}
