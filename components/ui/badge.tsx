import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "neutral" | "warm" | "indigo" | "urgent";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-[#f4f3f8] text-[var(--text-muted)]",
  warm: "bg-[rgba(236,178,45,0.18)] text-[#815714]",
  indigo: "bg-[rgba(108,107,226,0.14)] text-[var(--brand-eggplant)]",
  urgent: "bg-[rgba(224,92,32,0.14)] text-[var(--food-chili)]",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
