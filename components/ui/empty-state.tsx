import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="grid gap-3 p-6 text-center">
      <h2 className="text-lg font-bold text-[var(--brand-eggplant)]">{title}</h2>
      <p className="mx-auto max-w-md text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-1 flex justify-center">{action}</div> : null}
    </Card>
  );
}
