import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-main)] transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-indigo)] focus:outline-none focus:ring-2 focus:ring-[rgba(108,107,226,0.18)]",
        className,
      )}
      {...props}
    />
  );
}
