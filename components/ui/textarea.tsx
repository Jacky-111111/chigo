import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-[var(--border)] bg-white px-3 py-3 text-sm text-[var(--text-main)] transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-indigo)] focus:outline-none focus:ring-2 focus:ring-[rgba(108,107,226,0.18)]",
        className,
      )}
      {...props}
    />
  );
}
