export interface MockGasto {
  id: string;
  code: string;
  seller: string;
  category: "Peaje" | "Combustible" | "Alimentación" | "Estacionamiento" | "Movilidad";
  date: string;
  hour?: string;
  total: number;
  status: "Por revisar" | "Revisado";
  rucProvider: string;
  observations: string;
  receiptImage?: string;
}

export const GASTOS_MOCK: MockGasto[] = [
  {
    id: "gas-021",
    code: "GAS-021",
    seller: "Ana Torres",
    category: "Peaje",
    date: "16 oct. 2026",
    hour: "09:42",
    total: 15.0,
    status: "Por revisar",
    rucProvider: "20123456789",
    observations: "Peaje de ruta a visita a Pet Market.",
  },
  {
    id: "gas-020",
    code: "GAS-020",
    seller: "Ana Torres",
    category: "Alimentación",
    date: "15 oct. 2026",
    hour: "13:30",
    total: 25.0,
    status: "Revisado",
    rucProvider: "20456789012",
    observations: "Almuerzo de trabajo en ruta San Miguel.",
  },
  {
    id: "gas-019",
    code: "GAS-019",
    seller: "Luis Ramos",
    category: "Combustible",
    date: "14 oct. 2026",
    hour: "08:15",
    total: 80.0,
    status: "Revisado",
    rucProvider: "20112233445",
    observations: "Carga de combustible en Primax Javier Prado.",
  },
  {
    id: "gas-018",
    code: "GAS-018",
    seller: "Carlos Díaz",
    category: "Estacionamiento",
    date: "10 oct. 2026",
    hour: "11:20",
    total: 12.0,
    status: "Revisado",
    rucProvider: "20998877665",
    observations: "Estacionamiento en C.C. El Polo.",
  },
  {
    id: "gas-017",
    code: "GAS-017",
    seller: "Ana Torres",
    category: "Peaje",
    date: "08 oct. 2026",
    hour: "16:00",
    total: 15.0,
    status: "Revisado",
    rucProvider: "20123456789",
    observations: "Retorno peaje Evitamiento.",
  },
  {
    id: "gas-016",
    code: "GAS-016",
    seller: "Luis Ramos",
    category: "Movilidad",
    date: "05 oct. 2026",
    hour: "10:00",
    total: 30.0,
    status: "Revisado",
    rucProvider: "20334455667",
    observations: "Taxi para entrega urgente de muestras.",
  },
];
