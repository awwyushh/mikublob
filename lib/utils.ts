export function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(value);
}

export function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(value);
}

export function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(value: Date) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + 1);
  return date;
}

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 1);
}

export function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseDateParam(value?: string | null) {
  if (!value) {
    return startOfDay(new Date());
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? startOfDay(new Date()) : startOfDay(parsed);
}

export function getCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const jsOffset = (first.getDay() + 6) % 7;
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = 0; index < jsOffset; index += 1) {
    const date = new Date(first);
    date.setDate(first.getDate() - (jsOffset - index));
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]?.date ?? first;
    const date = new Date(last);
    date.setDate(last.getDate() + 1);
    cells.push({ date, inMonth: false });
  }

  return cells;
}

export function slugifyTag(value: string) {
  return value.trim().toLowerCase();
}
