export function formatInviteTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatShortTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function isStartingSoon(startAt: string) {
  const start = new Date(startAt).getTime();
  const now = Date.now();
  return start >= now && start - now <= 45 * 60 * 1000;
}

export function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export function getStartAtFromPreset(preset: string, customStartAt?: string | null) {
  const now = new Date();

  if (preset === "now") {
    return now;
  }

  if (preset === "in_30_minutes") {
    return new Date(now.getTime() + 30 * 60 * 1000);
  }

  if (preset === "in_1_hour") {
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  if (!customStartAt) {
    throw new Error("Choose a custom start time.");
  }

  return new Date(customStartAt);
}

export function getDefaultCustomStart() {
  const value = new Date(Date.now() + 90 * 60 * 1000);
  value.setSeconds(0, 0);
  return value.toISOString().slice(0, 16);
}
