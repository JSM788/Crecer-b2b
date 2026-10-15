export interface MockCliente {
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

export const CLIENTES_MOCK: MockCliente[] = [
  {
    id: "cl-001",
    code: "CL-001",
    name: "Pet Market San Borja",
    ruc: "20123456789",
    district: "San Borja",
    city: "Lima",
    address: "Av. San Borja Norte 1234, San Borja, Lima",
    seller: "Ana Torres",
    zone: "Lima Centro",
    condition: "Al día",
    since: "12 ene. 2023",
    lastPurchaseDate: "25 sep. 2025",
    monthlyPurchases: 3200,
    availableCredit: 2400,
    expiredDebt: 0,
    creditLimit: 5000,
    currentDebt: 2300,
  },
  {
    id: "cl-002",
    code: "CL-002",
    name: "Veterinaria Huellitas",
    ruc: "20456789012",
    district: "Miraflores",
    city: "Lima",
    address: "Av. Larco 890, Miraflores, Lima",
    seller: "Carlos Rojas",
    zone: "Lima Centro",
    condition: "Con atraso",
    since: "04 mar. 2022",
    lastPurchaseDate: "10 oct. 2025",
    monthlyPurchases: 1800,
    availableCredit: 500,
    expiredDebt: 1200,
    creditLimit: 3000,
    currentDebt: 2500,
  },
  {
    id: "cl-003",
    code: "CL-003",
    name: "Mundo Animal Surco",
    ruc: "20567890123",
    district: "Santiago de Surco",
    city: "Lima",
    address: "Av. Primavera 1420, Surco, Lima",
    seller: "Lucía Mendoza",
    zone: "Lima Sur",
    condition: "Al día",
    since: "18 ago. 2023",
    lastPurchaseDate: "12 oct. 2025",
    monthlyPurchases: 4500,
    availableCredit: 6000,
    expiredDebt: 0,
    creditLimit: 8000,
    currentDebt: 2000,
  },
  {
    id: "cl-004",
    code: "CL-004",
    name: "Mascotas y Más",
    ruc: "20601234567",
    district: "Surco",
    city: "Lima",
    address: "Av. Benavides 3890, Surco, Lima",
    seller: "Carlos Díaz",
    zone: "Lima Sur",
    condition: "Al día",
    since: "05 nov. 2021",
    lastPurchaseDate: "14 oct. 2025",
    monthlyPurchases: 2900,
    availableCredit: 3500,
    expiredDebt: 0,
    creditLimit: 4000,
    currentDebt: 500,
  },
  {
    id: "cl-005",
    code: "CL-005",
    name: "Clínica Vet. San Miguel",
    ruc: "20609876543",
    district: "San Miguel",
    city: "Lima",
    address: "Av. La Marina 2100, San Miguel, Lima",
    seller: "Ana Torres",
    zone: "Lima Oeste",
    condition: "Al día",
    since: "22 feb. 2024",
    lastPurchaseDate: "15 oct. 2025",
    monthlyPurchases: 3800,
    availableCredit: 4200,
    expiredDebt: 0,
    creditLimit: 6000,
    currentDebt: 1800,
  },
  {
    id: "cl-006",
    code: "CL-006",
    name: "Agrovet San Miguel",
    ruc: "20551234567",
    district: "San Miguel",
    city: "Lima",
    address: "Av. Universitaria 1450, San Miguel, Lima",
    seller: "Luis Ramos",
    zone: "Lima Oeste",
    condition: "Con atraso",
    since: "14 sep. 2022",
    lastPurchaseDate: "05 oct. 2025",
    monthlyPurchases: 1400,
    availableCredit: 300,
    expiredDebt: 950,
    creditLimit: 2500,
    currentDebt: 2200,
  },
];
