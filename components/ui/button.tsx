import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--food-tangerine)] text-white shadow-[0_10px_22px_rgba(222,127,36,0.24)] hover:bg-[#c96d1c]",
  secondary:
    "border border-[var(--border)] bg-white text-[var(--brand-eggplant)] hover:border-[var(--brand-indigo)] hover:bg-[#f4f3ff]",
  ghost: "text-[var(--brand-eggplant)] hover:bg-[#f4f3ff]",
  danger: "bg-[var(--food-chili)] text-white hover:bg-[#c94f1a]",
};

export function Button({
  asChild = false,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)] disabled:pointer-events-none disabled:opacity-55",
        variants[variant],
        className,
      )}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}
