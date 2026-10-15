export interface MockItemCotizacion {
  productoId: string;
  name: string;
  sku: string;
  requestedQty: number;
  availableQty: number;
  offeredQty: number;
  unitPrice: number;
  total: number;
}

export interface MockCotizacion {
  id: string;
  code: string;
  clienteId: string;
  clienteName: string;
  seller: string;
  date: string;
  validUntil: string;
  amount: number;
  status: "Borrador" | "Enviada" | "Aprobada";
  items: MockItemCotizacion[];
  notes?: string;
}

export interface MockPedido {
  id: string;
  code: string;
  cotizacionCode?: string;
  clienteId: string;
  clienteName: string;
  ruc: string;
  seller: string;
  date: string;
  total: number;
  paymentStatus: "Pendiente" | "Conciliado";
  reservationStatus: "Por confirmar" | "Confirmada";
  orderStatus: "Pendiente de validación" | "Validado" | "Entregado";
  items: MockItemCotizacion[];
  timeline: { time: string; event: string; detail: string }[];
}

export const COTIZACIONES_MOCK: MockCotizacion[] = [
  {
    id: "cot-1042",
    code: "COT-1042",
    clienteId: "cl-001",
    clienteName: "Pet Market (CL-001)",
    seller: "Ana Torres",
    date: "16 oct. 2026",
    validUntil: "23 oct. 2025",
    amount: 1440.0,
    status: "Enviada",
    items: [
      {
        productoId: "prod-001",
        name: "Bravery Adulto 7 kg",
        sku: "BRA-AD7",
        requestedQty: 10,
        availableQty: 8,
        offeredQty: 8,
        unitPrice: 180.0,
        total: 1440.0,
      },
    ],
    notes: "Entrega programada para el almacén central de San Borja.",
  },
  {
    id: "cot-1041",
    code: "COT-1041",
    clienteId: "cl-003",
    clienteName: "Mundo Animal",
    seller: "Luis Ramos",
    date: "16 oct. 2026",
    validUntil: "24 oct. 2025",
    amount: 620.0,
    status: "Enviada",
    items: [
      {
        productoId: "prod-005",
        name: "Pro Plan Adulto 15 kg",
        sku: "PP-AD15",
        requestedQty: 2,
        availableQty: 2,
        offeredQty: 2,
        unitPrice: 310.0,
        total: 620.0,
      },
    ],
  },
  {
    id: "cot-1040",
    code: "COT-1040",
    clienteId: "cl-004",
    clienteName: "Mascotas y Más",
    seller: "Carlos Díaz",
    date: "15 oct. 2026",
    validUntil: "22 oct. 2025",
    amount: 980.0,
    status: "Aprobada",
    items: [],
  },
  {
    id: "cot-1039",
    code: "COT-1039",
    clienteId: "cl-005",
    clienteName: "Clínica Vet. San Miguel",
    seller: "Ana Torres",
    date: "15 oct. 2026",
    validUntil: "25 oct. 2025",
    amount: 1250.0,
    status: "Borrador",
    items: [],
  },
  {
    id: "cot-1038",
    code: "COT-1038",
    clienteId: "cl-006",
    clienteName: "Agrovet San Miguel",
    seller: "María López",
    date: "14 oct. 2026",
    validUntil: "21 oct. 2025",
    amount: 730.0,
    status: "Enviada",
    items: [],
  },
];

export const PEDIDOS_MOCK: MockPedido[] = [
  {
    id: "ped-1042",
    code: "PED-1042",
    cotizacionCode: "COT-1042",
    clienteId: "cl-001",
    clienteName: "Pet Market",
    ruc: "20123456789",
    seller: "Ana Torres",
    date: "16 oct. 2026",
    total: 1440.0,
    paymentStatus: "Pendiente",
    reservationStatus: "Por confirmar",
    orderStatus: "Pendiente de validación",
    items: [
      {
        productoId: "prod-001",
        name: "Bravery Adulto 7 kg",
        sku: "BRA-AD7",
        requestedQty: 10,
        availableQty: 8,
        offeredQty: 8,
        unitPrice: 180.0,
        total: 1440.0,
      },
    ],
    timeline: [
      { time: "09:30", event: "Pedido registrado", detail: "Se generó el pedido PED-1042." },
      { time: "09:35", event: "Pago reportado", detail: "Se adjuntó comprobante de pago." },
      { time: "08:00", event: "Archivo última actualización", detail: "Última versión del archivo de pago." },
    ],
  },
  {
    id: "ped-1031",
    code: "PED-1031",
    clienteId: "cl-003",
    clienteName: "Mundo Animal",
    ruc: "20567890123",
    seller: "Luis Ramos",
    date: "15 oct. 2026",
    total: 620.0,
    paymentStatus: "Conciliado",
    reservationStatus: "Confirmada",
    orderStatus: "Validado",
    items: [],
    timeline: [],
  },
];
