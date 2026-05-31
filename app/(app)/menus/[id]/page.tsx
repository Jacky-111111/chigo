/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ImageOff,
  RefreshCcw,
  ScanText,
} from "lucide-react";
import { MenuAnalysisProgress } from "@/components/menus/menu-analysis-progress";
import { MenuItemCard } from "@/components/menus/menu-item-card";
import { statusLabel } from "@/components/menus/menu-upload-summary-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { retryMenuAnalysis } from "@/lib/actions/menu-actions";
import {
  canRetryMenuAnalysis,
  getMenuAnalysisStartedAt,
  isMenuAnalysisPending,
  menuAnalysisStaleAfterMs,
} from "@/lib/services/menu-analysis-state";
import { getMenuAnalysis } from "@/lib/services/menus";
import { requireCompletedProfile, requireUser } from "@/lib/services/profiles";

export const metadata = {
  title: "Menu Analysis",
};

export const dynamic = "force-dynamic";

type MenuDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MenuDetailPage({
  params,
  searchParams,
}: MenuDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  await requireCompletedProfile(user.id);
  const menu = await getMenuAnalysis(id, user.id);

  if (!menu) {
    notFound();
  }

  const feedbackItemIds = new Set(
    menu.feedback.map((feedback) => feedback.menu_item_id),
  );
  const statusVariant =
    menu.status === "failed"
      ? "urgent"
      : menu.status === "completed"
        ? "warm"
        : "indigo";
  const canRetryAnalysis = canRetryMenuAnalysis(menu);
  const isPendingAnalysis = isMenuAnalysisPending(menu.status);
  const analysisStartedAt = isPendingAnalysis
    ? getMenuAnalysisStartedAt(menu)
    : null;

  return (
    <section className="page-shell grid gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-2">
          <Link href="/menus">
            <ArrowLeft size={17} />
            Back to menus
          </Link>
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant={statusVariant}>{statusLabel(menu.status)}</Badge>
              {menu.source_language ? (
                <Badge variant="neutral">{menu.source_language}</Badge>
              ) : null}
              {menu.ai_model ? (
                <Badge variant="indigo">{menu.ai_model}</Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-black text-[var(--brand-eggplant)] md:text-4xl">
              {menu.restaurant?.name ?? "Menu analysis"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              AI output is an estimate. Confirm allergens, ingredients, and
              preparation with the restaurant.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {menu.restaurant ? (
              <Button asChild variant="secondary">
                <Link href={`/restaurants/${menu.restaurant.id}`}>
                  Restaurant detail
                </Link>
              </Button>
            ) : null}
            {canRetryAnalysis ? (
              <form action={retryMenuAnalysis}>
                <input type="hidden" name="menuUploadId" value={menu.id} />
                <SubmitButton
                  pendingLabel="Retrying..."
                  className="w-full sm:w-auto"
                >
                  <RefreshCcw size={16} />
                  Retry analysis
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </div>
      </div>

      {query?.error ? (
        <div className="rounded-[8px] border border-[rgba(224,92,32,0.24)] bg-[rgba(224,92,32,0.08)] p-3 text-sm font-semibold text-[var(--food-chili)]">
          {query.error}
        </div>
      ) : null}

      {query?.message ? (
        <div className="rounded-[8px] border border-[rgba(108,107,226,0.22)] bg-[rgba(108,107,226,0.1)] p-3 text-sm font-semibold text-[var(--brand-eggplant)]">
          {query.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit overflow-hidden">
          <div className="relative aspect-[4/5] bg-[#f7f7fb]">
            {menu.signedImageUrl ? (
              <img
                src={menu.signedImageUrl}
                alt="Uploaded menu"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-[var(--text-muted)]">
                <div className="grid gap-2 text-center">
                  <ImageOff
                    className="mx-auto text-[var(--food-tangerine)]"
                    size={34}
                  />
                  <p className="text-sm font-semibold">
                    Image preview unavailable
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="grid gap-3 p-4">
            <div className="grid gap-1">
              <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
                Target language
              </p>
              <p className="font-black text-[var(--brand-eggplant)]">
                {menu.target_language}
              </p>
            </div>
            {menu.error_message ? (
              <p className="flex items-start gap-2 rounded-[8px] border border-[rgba(224,92,32,0.22)] bg-[rgba(224,92,32,0.08)] px-3 py-2 text-sm font-semibold text-[var(--food-chili)]">
                <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                {menu.error_message}
              </p>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4">
          {menu.status === "completed" && menu.items.length > 0 ? (
            <>
              <div className="flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-muted)]">
                <ScanText className="text-[var(--food-tangerine)]" size={17} />
                {menu.items.length} dishes found. Use feedback when the AI
                misses something.
              </div>

              {menu.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  menuUploadId={menu.id}
                  feedbackSubmitted={feedbackItemIds.has(item.id)}
                />
              ))}

              {menu.extracted_text ? (
                <details className="rounded-[8px] border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-muted)]">
                  <summary className="cursor-pointer font-black text-[var(--brand-eggplant)]">
                    Extracted menu text
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap font-sans leading-6">
                    {menu.extracted_text}
                  </pre>
                </details>
              ) : null}
            </>
          ) : menu.status === "failed" ? (
            <EmptyState
              title="Analysis failed"
              description="The image is saved. Retry after checking that the menu is clear and the AI provider key is configured."
            />
          ) : isPendingAnalysis && analysisStartedAt ? (
            <Card className="grid gap-4 p-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-[rgba(236,178,45,0.16)] text-[var(--food-tangerine)]">
                  <ScanText size={20} />
                </div>
                <div className="grid gap-1">
                  <h2 className="text-lg font-black text-[var(--brand-eggplant)]">
                    Analysis in progress
                  </h2>
                  <p className="text-sm leading-6 text-[var(--text-muted)]">
                    ChiGo is reading the image, extracting dishes, and matching
                    the results to your preferences.
                  </p>
                </div>
              </div>
              <MenuAnalysisProgress
                startedAt={analysisStartedAt}
                staleAfterMs={menuAnalysisStaleAfterMs}
                refreshIntervalMs={7000}
              />
            </Card>
          ) : (
            <EmptyState
              title="Analysis unavailable"
              description="This menu analysis is not ready yet. Try refreshing the page in a moment."
            />
          )}
        </div>
      </div>
    </section>
  );
}
