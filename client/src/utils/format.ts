const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/**
 * Parses a backend LocalDate ("1995-08-02") or LocalDateTime ("2026-01-27T15:59:43.7") as *local*
 * time. `new Date("1995-08-02")` would be UTC midnight and show the previous day west of Greenwich.
 */
export const parseLocal = (value: string): Date => {
  const [datePart, timePart = "00:00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map((n) => Number.parseFloat(n) || 0);
  return new Date(year, month - 1, day, hours, minutes, Math.floor(seconds));
};

/** Instants from the API end in "Z" (UTC); plain dates/date-times are local. */
export const parseDateTime = (value: string): Date =>
  /(Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(value) : parseLocal(value);

export const formatDate = (value: string | null | undefined): string =>
  value ? dateFormatter.format(parseDateTime(value)) : "—";

export const formatRelative = (value: string, now: Date = new Date()): string => {
  const seconds = Math.round((parseDateTime(value).getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeFormatter.format(Math.round(seconds / size), unit);
    }
  }
  return "just now";
};

export const ageFrom = (dateOfBirth: string, now: Date = new Date()): number => {
  const dob = parseLocal(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

/** Today as YYYY-MM-DD in local time (for `max` on date inputs). */
export const todayIso = (now: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const initials = (...parts: (string | null | undefined)[]): string => {
  const words = parts.filter(Boolean).join(" ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const AVATAR_HUES = [172, 199, 221, 243, 262, 291, 330, 12, 32, 142];

/** A stable, pleasant colour for a name, so the same project always gets the same avatar. */
export const hueFor = (seed: string): number => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
};

export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
