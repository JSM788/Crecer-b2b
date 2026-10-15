export interface MockAgendaItem {
  id: string;
  timeSlot: string;
  clientName: string;
  seller: string;
  district: string;
  date: string;
  status: "programada" | "en_curso" | "completada";
}

export interface MockJornada {
  id: string;
  seller: string;
  startTime: string;
  completedVisits: number;
  totalVisits: number;
  status: "En jornada" | "Interrumpida" | "Sin iniciar";
}

export interface MockRegistroVisita {
  id: string;
  code: string;
  clientName: string;
  seller: string;
  date: string;
  result: "Con pedido" | "Sin compra" | "Local cerrado";
  evidenceCount: number;
  checkIn: string;
  checkOut: string;
  duration: string;
  observations: string;
  orderCode?: string;
}

export const AGENDA_MOCK: MockAgendaItem[] = [
  {
    id: "ag-01",
    timeSlot: "09:00 - 10:00",
    clientName: "Pet Market",
    seller: "Ana Torres",
    district: "San Borja",
    date: "16 oct. 2026",
    status: "completada",
  },
  {
    id: "ag-02",
    timeSlot: "11:00 - 12:00",
    clientName: "Mundo Animal",
    seller: "Luis Ramos",
    district: "Miraflores",
    date: "16 oct. 2026",
    status: "en_curso",
  },
  {
    id: "ag-03",
    timeSlot: "14:00 - 15:00",
    clientName: "Mascotas y Más",
    seller: "Carlos Díaz",
    district: "Surco",
    date: "16 oct. 2026",
    status: "programada",
  },
  {
    id: "ag-04",
    timeSlot: "16:00 - 17:00",
    clientName: "Clínica Veterinaria San Miguel",
    seller: "Ana Torres",
    district: "San Miguel",
    date: "16 oct. 2026",
    status: "programada",
  },
];

export const JORNADAS_MOCK: MockJornada[] = [
  { id: "j-01", seller: "Ana Torres", startTime: "08:00", completedVisits: 3, totalVisits: 5, status: "En jornada" },
  { id: "j-02", seller: "Luis Ramos", startTime: "08:10", completedVisits: 1, totalVisits: 4, status: "Interrumpida" },
  { id: "j-03", seller: "Carlos Díaz", startTime: "08:15", completedVisits: 0, totalVisits: 4, status: "Sin iniciar" },
  { id: "j-04", seller: "María López", startTime: "08:05", completedVisits: 2, totalVisits: 5, status: "En jornada" },
  { id: "j-05", seller: "Jorge Ramírez", startTime: "08:20", completedVisits: 1, totalVisits: 3, status: "En jornada" },
];

export const REGISTROS_VISITA_MOCK: MockRegistroVisita[] = [
  {
    id: "vis-018",
    code: "VIS-018",
    clientName: "Pet Market",
    seller: "Ana Torres",
    date: "16 oct. 2026",
    result: "Con pedido",
    evidenceCount: 2,
    checkIn: "09:10",
    checkOut: "09:35",
    duration: "25 min",
    observations: "Buena recepción de la promoción. Interesados en ampliar surtido.",
    orderCode: "PED-1042",
  },
  {
    id: "vis-019",
    code: "VIS-019",
    clientName: "Mundo Animal",
    seller: "Luis Ramos",
    date: "16 oct. 2026",
    result: "Sin compra",
    evidenceCount: 1,
    checkIn: "11:05",
    checkOut: "11:30",
    duration: "25 min",
    observations: "Stock suficiente en tienda por 15 días.",
  },
  {
    id: "vis-020",
    code: "VIS-020",
    clientName: "Mascotas y Más",
    seller: "Carlos Díaz",
    date: "15 oct. 2026",
    result: "Local cerrado",
    evidenceCount: 1,
    checkIn: "14:10",
    checkOut: "14:15",
    duration: "5 min",
    observations: "Local en remodelación de fachada.",
  },
  {
    id: "vis-017",
    code: "VIS-017",
    clientName: "Clínica Vet. San Miguel",
    seller: "Ana Torres",
    date: "15 oct. 2026",
    result: "Con pedido",
    evidenceCount: 3,
    checkIn: "15:30",
    checkOut: "16:10",
    duration: "40 min",
    observations: "Pedido formalizado con pago al contado.",
  },
  {
    id: "vis-016",
    code: "VIS-016",
    clientName: "Agrovet San Miguel",
    seller: "Luis Ramos",
    date: "14 oct. 2026",
    result: "Sin compra",
    evidenceCount: 1,
    checkIn: "10:00",
    checkOut: "10:20",
    duration: "20 min",
    observations: "Esperando pago de clientes finales.",
  },
];
