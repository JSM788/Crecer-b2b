export interface VisitaExtraordinaria {
  id: string;
  code: string;
  clientName: string;
  seller: string;
  reason: string;
  status: "Pendiente" | "Aprobada" | "Rechazada";
  date: string;
  hour: string;
  justification: string;
}

export interface MaterialPOP {
  id: string;
  code: string;
  clientName: string;
  material: string;
  brand: string;
  quantity: number;
  status: "Pendiente" | "Aprobada" | "Rechazada";
  reason: string;
  observations: string;
}
