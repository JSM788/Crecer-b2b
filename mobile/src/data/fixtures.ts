export const demoProfile = {
  name: "Ana Torres",
  role: "Comercial",
  email: "ana.torres@aquamundo.com",
  password: "demo123",
  initials: "AT",
} as const;

export const customers = [
  {
    id: "customer-1",
    name: "Pet Market San Borja",
    code: "CL-001",
    address: "Av. San Borja Norte 1234",
    district: "San Borja, Lima",
    contactName: "Carlos Pérez",
    phone: "987654321",
  },
  {
    id: "customer-2",
    name: "Clínica Vet. San Miguel",
    code: "CL-005",
    address: "Av. La Marina 2450",
    district: "San Miguel, Lima",
    contactName: "Lucía Ramírez",
    phone: "987654322",
  },
] as const;

export const demoScenario = {
  scheduledEnds: {
    "visit-1": "2026-10-16T10:00:00-05:00",
    "visit-2": "2026-10-16T17:00:00-05:00",
  } as Record<string, string>,
  dateLabel: "Viernes, 16 de octubre de 2026",
  shiftLabel: "08:00 – 17:00",
  timestamps: {
    start: "2026-10-16T08:00:00-05:00",
    arrivals: {
      "visit-1": "2026-10-16T09:10:00-05:00",
      "visit-2": "2026-10-16T16:00:00-05:00",
    } as Record<string, string>,
    departures: {
      "visit-1": "2026-10-16T09:45:00-05:00",
      "visit-2": "2026-10-16T16:35:00-05:00",
    } as Record<string, string>,
    end: "2026-10-16T17:00:00-05:00",
  },
  gps: { accuracyMeters: 12, distanceMeters: 24, radiusMeters: 50 },
} as const;

export const visitSeeds = [
  {
    id: "visit-1",
    customerId: "customer-1",
    scheduledAt: "2026-10-16T09:00:00-05:00",
  },
  {
    id: "visit-2",
    customerId: "customer-2",
    scheduledAt: "2026-10-16T16:00:00-05:00",
  },
] as const;
