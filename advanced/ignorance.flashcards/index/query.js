const DAY = 86_400_000;

export function dayOffset(baseline, days) {
  const date = new Date(Date.parse(`${baseline}T00:00:00Z`) + days * DAY);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : undefined;
}

export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
