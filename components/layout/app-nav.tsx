"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CalendarPlus,
  MapPin,
  Settings,
  Users,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const items = [
  { href: "/invites", label: "Invites", mobileLabel: "Invites", icon: Users },
  {
    href: "/restaurants",
    label: "Restaurants",
    mobileLabel: "Food",
    icon: MapPin,
  },
  { href: "/menus", label: "Menus", mobileLabel: "Menus", icon: BookOpenText },
  {
    href: "/invites/new",
    label: "New invite",
    mobileLabel: "New",
    icon: CalendarPlus,
  },
  {
    href: "/settings",
    label: "Settings",
    mobileLabel: "Settings",
    icon: Settings,
  },
];

export function AppNav({ displayName }: { displayName?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/invites"
          className="flex items-center gap-3 text-[var(--brand-eggplant)]"
        >
          <span className="grid size-10 place-items-center rounded-[8px] bg-[var(--brand-eggplant)] text-white">
            <Utensils size={20} />
          </span>
          <span className="text-xl font-black">ChiGo</span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {items.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[#f4f3ff] hover:text-[var(--brand-eggplant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                  active && "bg-[#f4f3ff] text-[var(--brand-eggplant)]",
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-40 truncate text-sm font-semibold text-[var(--text-muted)]">
            {displayName ?? "CMU diner"}
          </span>
          <Button asChild className="min-h-9 px-3" variant="primary">
            <Link href="/invites/new">Create</Link>
          </Button>
        </div>
      </div>

      <nav
        className="page-shell grid grid-cols-5 gap-1 pb-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {items.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "grid min-h-12 place-items-center rounded-[8px] px-2 text-[11px] font-bold text-[var(--text-muted)]",
                active && "bg-[var(--brand-eggplant)] text-white",
              )}
            >
              <Icon size={17} />
              <span className="mt-1">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/invites") {
    return (
      pathname === "/invites" ||
      (pathname.startsWith("/invites/") && pathname !== "/invites/new")
    );
  }

  if (href === "/invites/new") {
    return pathname === "/invites/new";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
