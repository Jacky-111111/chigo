"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="page-shell">
      <EmptyState
        title="Something did not load"
        description={error.message || "Try again in a moment."}
        action={<Button onClick={reset}>Retry</Button>}
      />
    </section>
  );
}
