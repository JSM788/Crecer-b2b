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
