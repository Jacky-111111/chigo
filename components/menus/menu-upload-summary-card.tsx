import Link from "next/link";
import {
  AlertTriangle,
  Clock3,
  RefreshCcw,
  ScanText,
  Utensils,
} from "lucide-react";
import { retryMenuAnalysis } from "@/lib/actions/menu-actions";
import type { MenuUploadSummary } from "@/lib/services/menus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export function MenuUploadSummaryCard({
  upload,
}: {
  upload: MenuUploadSummary;
}) {
  const statusVariant =
    upload.status === "failed"
      ? "urgent"
      : upload.status === "completed"
        ? "warm"
        : "indigo";

  return (
    <Card className="grid gap-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-[var(--brand-eggplant)]">
              {upload.restaurant?.name ?? "Menu upload"}
            </h2>
            <Badge variant={statusVariant}>{statusLabel(upload.status)}</Badge>
          </div>
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Clock3 size={15} />
            {formatMenuDate(upload.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {upload.restaurant?.cuisine ? (
            <Badge variant="neutral">{upload.restaurant.cuisine}</Badge>
          ) : null}
          {upload.itemCount > 0 ? (
            <Badge variant="indigo">{upload.itemCount} dishes</Badge>
          ) : null}
        </div>
      </div>

      {upload.error_message ? (
        <p className="flex items-start gap-2 rounded-[8px] border border-[rgba(224,92,32,0.22)] bg-[rgba(224,92,32,0.08)] px-3 py-2 text-sm font-semibold text-[var(--food-chili)]">
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
          {upload.error_message}
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-[8px] bg-[#f7f7fb] px-3 py-2 text-sm leading-6 text-[var(--text-muted)]">
          <Utensils
            className="mt-0.5 shrink-0 text-[var(--food-tangerine)]"
            size={16}
          />
          AI menu insights are estimates. Check with the restaurant for
          allergies or medical needs.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {upload.status === "failed" ? (
          <form action={retryMenuAnalysis}>
            <input type="hidden" name="menuUploadId" value={upload.id} />
            <SubmitButton
              pendingLabel="Retrying..."
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <RefreshCcw size={16} />
              Retry
            </SubmitButton>
          </form>
        ) : null}
        <Button
          asChild
          variant={upload.status === "completed" ? "primary" : "secondary"}
        >
          <Link href={`/menus/${upload.id}`}>
            <ScanText size={16} />
            View analysis
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export function statusLabel(status: MenuUploadSummary["status"]) {
  if (status === "uploaded") {
    return "Uploaded";
  }

  if (status === "processing") {
    return "Processing";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Failed";
}

function formatMenuDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
