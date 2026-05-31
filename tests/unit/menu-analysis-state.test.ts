import { describe, expect, it } from "vitest";
import {
  canRetryMenuAnalysis,
  getMenuAnalysisProgress,
  menuAnalysisStaleAfterMs,
} from "@/lib/services/menu-analysis-state";
import type { MenuUpload } from "@/types/database";

const now = Date.parse("2026-05-31T16:00:00.000Z");

describe("menu analysis retry state", () => {
  it("keeps active processing uploads from retrying too early", () => {
    const upload = makeUpload({
      status: "processing",
      updatedAt: new Date(now - menuAnalysisStaleAfterMs + 1_000).toISOString(),
    });

    expect(canRetryMenuAnalysis(upload, now)).toBe(false);
  });

  it("allows retry when processing has exceeded the stale window", () => {
    const upload = makeUpload({
      status: "processing",
      updatedAt: new Date(now - menuAnalysisStaleAfterMs - 1_000).toISOString(),
    });

    const progress = getMenuAnalysisProgress(upload, now);

    expect(progress.isStale).toBe(true);
    expect(progress.progress).toBe(95);
    expect(canRetryMenuAnalysis(upload, now)).toBe(true);
  });

  it("allows failed uploads to retry immediately", () => {
    expect(canRetryMenuAnalysis(makeUpload({ status: "failed" }), now)).toBe(
      true,
    );
  });

  it("does not retry completed uploads from the recovery action", () => {
    expect(canRetryMenuAnalysis(makeUpload({ status: "completed" }), now)).toBe(
      false,
    );
  });
});

function makeUpload({
  status,
  createdAt = "2026-05-31T15:55:00.000Z",
  updatedAt = "2026-05-31T15:55:00.000Z",
}: {
  status: MenuUpload["status"];
  createdAt?: string;
  updatedAt?: string;
}): Pick<MenuUpload, "status" | "created_at" | "updated_at"> {
  return {
    status,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}
