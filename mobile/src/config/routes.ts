export const routes = {
  login: "/",
  workday: "/workday",
  agenda: "/agenda",
  visit: (id: string) => `/visits/${encodeURIComponent(id)}` as const,
  record: (id: string) => `/visits/${encodeURIComponent(id)}/record` as const,
} as const;
