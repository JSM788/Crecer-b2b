export function businessDate(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (name: string) => {
    const found = parts.find((item) => item.type === name);
    if (!found) throw new Error('Calendar date could not be formatted');
    return found.value;
  };
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function databaseDate(value: string): Date {
  return new Date(value + 'T00:00:00.000Z');
}
