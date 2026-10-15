export interface ItemVenta {
  productoId: string;
  name: string;
  sku: string;
  requestedQty: number;
  availableQty: number;
  offeredQty: number;
  unitPrice: number;
  total: number;
}

export interface Cotizacion {
  id: string;
  code: string;
  clienteId: string;
  clienteName: string;
  seller: string;
  date: string;
  validUntil: string;
  amount: number;
  status: "Borrador" | "Enviada" | "Aprobada";
  items: ItemVenta[];
  notes?: string;
}

export interface Pedido {
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
  items: ItemVenta[];
  timeline: { time: string; event: string; detail: string }[];
}
