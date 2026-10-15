export interface AgendaSlot {
  id: string;
  timeSlot: string;
  clientName: string;
  seller: string;
  district: string;
  date: string;
  status: "programada" | "en_curso" | "completada";
}

export interface JornadaSummary {
  id: string;
  seller: string;
  startTime: string;
  completedVisits: number;
  totalVisits: number;
  status: "En jornada" | "Interrumpida" | "Sin iniciar";
}

export interface RegistroVisita {
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
