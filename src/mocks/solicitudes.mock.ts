export interface MockVisitaExtraordinaria {
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

export interface MockMaterialPOP {
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

export const VISITAS_EXTRAORDINARIAS_MOCK: MockVisitaExtraordinaria[] = [
  {
    id: "sol-018",
    code: "SOL-018",
    clientName: "Pet Market",
    seller: "Ana Torres",
    reason: "Fuera de territorio",
    status: "Pendiente",
    date: "16 oct. 2026",
    hour: "11:00",
    justification: "El cliente solicitó una reunión urgente para revisar nuevos productos. Se requiere visita fuera de mi territorio asignado.",
  },
  {
    id: "sol-017",
    code: "SOL-017",
    clientName: "Mundo Animal",
    seller: "Luis Ramos",
    reason: "Cliente nuevo",
    status: "Aprobada",
    date: "14 oct. 2026",
    hour: "09:30",
    justification: "Apertura de nueva sucursal en San Isidro.",
  },
];

export const MATERIAL_POP_MOCK: MockMaterialPOP[] = [
  {
    id: "pop-012",
    code: "POP-012",
    clientName: "Pet Market",
    material: "Exhibidor",
    brand: "Bravery",
    quantity: 1,
    status: "Pendiente",
    reason: "Reforzar exhibición",
    observations: "Para campaña de lanzamiento en tienda principal.",
  },
  {
    id: "pop-011",
    code: "POP-011",
    clientName: "Mundo Animal",
    material: "Afiches",
    brand: "Bravery",
    quantity: 10,
    status: "Aprobada",
    reason: "Promoción mensual",
    observations: "Distribución en puntos de venta estratégicos.",
  },
  {
    id: "pop-010",
    code: "POP-010",
    clientName: "Veterinaria Huellitas",
    material: "Exhibidor",
    brand: "Bravery",
    quantity: 1,
    status: "Pendiente",
    reason: "Nuevo punto",
    observations: "Espacio reservado en góndola principal.",
  },
];
