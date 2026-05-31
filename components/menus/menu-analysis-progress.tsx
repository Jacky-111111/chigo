"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatMenuAnalysisElapsed,
  getMenuAnalysisProgressFromStartedAt,
  getMenuAnalysisProgressLabel,
  menuAnalysisStaleAfterMs,
} from "@/lib/services/menu-analysis-state";
import { cn } from "@/lib/utils/cn";

type MenuAnalysisProgressProps = {
  startedAt: string;
  staleAfterMs?: number;
  refreshIntervalMs?: number;
  compact?: boolean;
  className?: string;
};

export function MenuAnalysisProgress({
  startedAt,
  staleAfterMs = menuAnalysisStaleAfterMs,
  refreshIntervalMs,
  compact = false,
  className,
}: MenuAnalysisProgressProps) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const state = getMenuAnalysisProgressFromStartedAt(
    startedAt,
    now,
    staleAfterMs,
  );
  const label = getMenuAnalysisProgressLabel(state);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!refreshIntervalMs) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [refreshIntervalMs, router]);

  return (
    <div className={cn("grid gap-2", className)} aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase text-[var(--brand-eggplant)]">
        <span>{label}</span>
        <span>{state.progress}%</span>
      </div>
      <div
        aria-label="Menu analysis progress"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={state.progress}
        aria-valuetext={`${label}, ${state.progress}%`}
        className="h-2.5 overflow-hidden rounded-full bg-[#eceaf8]"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-indigo),var(--food-gold),var(--food-tangerine))] transition-[width] duration-500"
          style={{ width: `${state.progress}%` }}
        />
      </div>
      {compact ? null : (
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          {state.isStale
            ? "This analysis may have stalled. Retry is available now."
            : `Working for ${formatMenuAnalysisElapsed(state.elapsedMs)}. This page refreshes while analysis is active.`}
        </p>
      )}
    </div>
  );
}
