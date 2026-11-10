let timeZone = "UTC";
export function setTimeZone(value: string) {
  timeZone = value;
}
export function formatDate(value: Date | string = new Date()) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}
export function formatTime(timestamp?: string) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}
export function durationMinutes(start?: string, end?: string) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000));
}
