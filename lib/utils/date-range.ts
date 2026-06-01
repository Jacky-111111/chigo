export const appTimeZone = "America/New_York";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: appTimeZone,
  year: "numeric",
});

export function getTodayDateString() {
  return formatDateStringInTimeZone(new Date());
}

export function normalizeDateString(value?: string | null) {
  if (value) {
    try {
      parseDateString(value);
      return value;
    } catch {
      // Fall through to today for malformed query strings.
    }
  }

  return getTodayDateString();
}

export function getLocalDayUtcRange(
  dateString: string,
  timeZone = appTimeZone,
) {
  const { year, month, day } = parseDateString(dateString);
  const start = zonedDateTimeToUtc({ year, month, day, hour: 0 }, timeZone);
  const nextDay = addDays(dateString, 1);
  const next = parseDateString(nextDay);
  const end = zonedDateTimeToUtc(
    { year: next.year, month: next.month, day: next.day, hour: 0 },
    timeZone,
  );

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getWeekStartDateString(dateString: string) {
  const date = new Date(`${dateString}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  return addDays(dateString, diff);
}

export function getMonthStartDateString(dateString: string) {
  const { year, month } = parseDateString(dateString);

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function addMonths(dateString: string, months: number) {
  const { year, month } = parseDateString(dateString);
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12));

  return date.toISOString().slice(0, 10);
}

export function addDays(dateString: string, days: number) {
  const { year, month, day } = parseDateString(dateString);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));

  return date.toISOString().slice(0, 10);
}

export function formatDateStringInTimeZone(date: Date, timeZone = appTimeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

export function formatShortDate(dateString: string) {
  return dateFormatter.format(new Date(`${dateString}T12:00:00.000Z`));
}

export function formatDateTimeLocalInTimeZone(
  value: string | Date,
  timeZone = appTimeZone,
) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);

  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}T${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function parseDateTimeLocalInTimeZone(
  value: string,
  timeZone = appTimeZone,
) {
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value) ??
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):\d{2}$/.exec(value);

  if (!match) {
    throw new Error("Choose a valid meal time.");
  }

  const [, dateString, hourValue, minuteValue] = match;
  const { year, month, day } = parseDateString(dateString);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("Choose a valid meal time.");
  }

  return zonedDateTimeToUtc(
    { year, month, day, hour, minute },
    timeZone,
  ).toISOString();
}

function parseDateString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new Error("Invalid date.");
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) {
    throw new Error("Invalid date.");
  }

  const candidate = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error("Invalid date.");
  }

  return { year, month, day };
}

function zonedDateTimeToUtc(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute?: number;
  },
  timeZone: string,
) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute ?? 0,
  );
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const firstCandidate = utcGuess - firstOffset;
  const finalOffset = getTimeZoneOffsetMs(firstCandidate, timeZone);

  return new Date(utcGuess - finalOffset);
}

function getTimeZoneOffsetMs(utcMs: number, timeZone: string) {
  const date = new Date(utcMs);
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const localAsUtc = Date.UTC(
    Number(part(parts, "year")),
    Number(part(parts, "month")) - 1,
    Number(part(parts, "day")),
    Number(part(parts, "hour")),
    Number(part(parts, "minute")),
    Number(part(parts, "second")),
  );

  return localAsUtc - utcMs;
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((item) => item.type === type)?.value ?? "";
}
