import { businessDate } from '../../../../common/business-date';

/** Locate calendar boundaries even when a time zone skips/repeats midnight. */
export function businessDateWindow(date: string, timeZone: string) {
  const boundary = (calendarDate: string) => {
    const anchor = Date.parse(calendarDate + 'T00:00:00Z');
    let low = anchor - 36 * 3600000;
    let high = anchor + 36 * 3600000;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (businessDate(new Date(middle), timeZone) < calendarDate)
        low = middle + 1;
      else high = middle;
    }
    return new Date(low);
  };
  const following = new Date(date + 'T00:00:00Z');
  following.setUTCDate(following.getUTCDate() + 1);
  return {
    gte: boundary(date),
    lt: boundary(following.toISOString().slice(0, 10)),
  };
}

/** ISO Monday calendar date (YYYY-MM-DD) identifying the week of a calendar date. */
export function businessWeekKey(date: string): string {
  const anchor = new Date(`${date}T00:00:00Z`);
  const day = anchor.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  anchor.setUTCDate(anchor.getUTCDate() + diffToMonday);
  return anchor.toISOString().slice(0, 10);
}

/** Half-open UTC range covering Monday 00:00 through next Monday 00:00 in timeZone. */
export function businessWeekWindow(date: string, timeZone: string) {
  const monday = businessWeekKey(date);
  const sunday = new Date(`${monday}T00:00:00Z`);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return {
    gte: businessDateWindow(monday, timeZone).gte,
    lt: businessDateWindow(sunday.toISOString().slice(0, 10), timeZone).lt,
  };
}
