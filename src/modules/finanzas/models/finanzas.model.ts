export interface PagoReportado {
  id: string;
  orderCode: string;
  orderId: string;
  clientName: string;
  clientRuc: string;
  seller: string;
  amount: number;
  paymentMethod: "Transferencia BCP" | "Transferencia BBVA" | "Interbank" | "Depósito en efectivo";
  operationNumber: string;
  dateReported: string;
  status: "Pendiente" | "Conciliado" | "Observado";
  voucherUrl?: string;
  bankAccount: string;
  notes?: string;
}

export interface CuentaPorCobrar {
  id: string;
  clientId: string;
  clientName: string;
  ruc: string;
  zone: string;
  seller: string;
  creditLimit: number;
  totalDebt: number;
  currentDebt: number; // No vencido
  overdue1to30: number; // 1 a 30 días
  overdue31to60: number; // 31 a 60 días
  overdueMore60: number; // Más de 60 días
  status: "Al día" | "Por vencer" | "En mora";
  lastPaymentDate: string;
}

export interface LineaCredito {
  id: string;
  clientId: string;
  clientName: string;
  ruc: string;
  assignedLimit: number;
  usedAmount: number;
  availableAmount: number;
  paymentTermDays: number;
  status: "Activa" | "Bloqueada" | "En evaluación";
  approvedDate: string;
  evaluatedBy: string;
}
