export const usernameChangeCooldownMs = 30 * 24 * 60 * 60 * 1000;

export function getNextUsernameChangeDate(lastChangedAt: string | Date) {
  const lastChanged =
    typeof lastChangedAt === "string" ? new Date(lastChangedAt) : lastChangedAt;

  return new Date(lastChanged.getTime() + usernameChangeCooldownMs);
}

export function canChangeUsername(
  lastChangedAt: string | null,
  now: Date = new Date(),
) {
  if (!lastChangedAt) {
    return true;
  }

  return getNextUsernameChangeDate(lastChangedAt).getTime() <= now.getTime();
}

export function formatUsernameChangeDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
