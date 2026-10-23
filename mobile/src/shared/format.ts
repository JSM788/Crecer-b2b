/** Fixture timestamps are displayed as scenario-local times without host timezone conversion. */
export function formatTime(timestamp?: string) {
  if (!timestamp) return "—";
  return timestamp.includes("T")
    ? timestamp.slice(11, 16)
    : timestamp.slice(0, 5);
}
export function durationMinutes(start?: string, end?: string) {
  if (!start || !end) return 0;
  const minutes = (value: string) => {
    const [hours, minute] = formatTime(value).split(":").map(Number);
    return hours * 60 + minute;
  };
  return Math.max(0, minutes(end) - minutes(start));
}
