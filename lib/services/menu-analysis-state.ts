import type { MenuUploadStatus } from "@/types/database";

export const menuAnalysisStaleAfterMs = 3 * 60 * 1000;

type MenuAnalysisTimedUpload = {
  status: MenuUploadStatus;
  created_at: string;
  updated_at: string;
};

export type MenuAnalysisProgressState = {
  elapsedMs: number;
  remainingMs: number;
  progress: number;
  isStale: boolean;
};

export function isMenuAnalysisPending(status: MenuUploadStatus) {
  return status === "uploaded" || status === "processing";
}

export function getMenuAnalysisStartedAt(upload: MenuAnalysisTimedUpload) {
  return upload.status === "processing" ? upload.updated_at : upload.created_at;
}

export function getMenuAnalysisProgress(
  upload: MenuAnalysisTimedUpload,
  now = Date.now(),
) {
  return getMenuAnalysisProgressFromStartedAt(
    getMenuAnalysisStartedAt(upload),
    now,
  );
}

export function getMenuAnalysisProgressFromStartedAt(
  startedAt: string,
  now = Date.now(),
  staleAfterMs = menuAnalysisStaleAfterMs,
): MenuAnalysisProgressState {
  const startedAtMs = Date.parse(startedAt);
  const elapsedMs = Number.isFinite(startedAtMs)
    ? Math.max(0, now - startedAtMs)
    : 0;
  const ratio = Math.min(elapsedMs / staleAfterMs, 1);

  return {
    elapsedMs,
    remainingMs: Math.max(0, staleAfterMs - elapsedMs),
    progress: Math.min(95, Math.max(8, Math.round(8 + ratio * 87))),
    isStale: elapsedMs >= staleAfterMs,
  };
}

export function canRetryMenuAnalysis(
  upload: MenuAnalysisTimedUpload,
  now = Date.now(),
) {
  if (upload.status === "failed") {
    return true;
  }

  if (!isMenuAnalysisPending(upload.status)) {
    return false;
  }

  return getMenuAnalysisProgress(upload, now).isStale;
}

export function getMenuAnalysisProgressLabel({
  progress,
  isStale,
}: Pick<MenuAnalysisProgressState, "progress" | "isStale">) {
  if (isStale) {
    return "Taking longer than expected";
  }

  if (progress < 36) {
    return "Reading menu image";
  }

  if (progress < 72) {
    return "Extracting dishes";
  }

  return "Personalizing results";
}

export function formatMenuAnalysisElapsed(elapsedMs: number) {
  const totalSeconds = Math.max(1, Math.floor(elapsedMs / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
