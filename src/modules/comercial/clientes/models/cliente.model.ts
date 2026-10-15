export interface Cliente {
  id: string;
  code: string;
  name: string;
  ruc: string;
  district: string;
  city: string;
  address: string;
  seller: string;
  zone: string;
  condition: "Al día" | "Con atraso";
  since: string;
  lastPurchaseDate: string;
  monthlyPurchases: number;
  availableCredit: number;
  expiredDebt: number;
  creditLimit: number;
  currentDebt: number;
}

export interface ClienteFilters {
  search?: string;
  district?: string;
  seller?: string;
  status?: string;
  lastPurchase?: string;
  zone?: string;
}
