"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  FileText,
  Calendar,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Cliente } from "../models/cliente.model";

interface ClienteComprasTabProps {
  cliente: Cliente;
}

interface CompraItem {
  id: string;
  code: string;
  date: string;
  productsSummary: string;
  total: number;
  status: "Pendiente" | "Conciliado";
}

const COMPRAS_MOCK: CompraItem[] = [
  {
    id: "ped-1042",
    code: "PED-1042",
    date: "15 oct. 2026",
    productsSummary: "Bravery Adulto 7 kg · 8 unidades",
    total: 1440,
    status: "Pendiente",
  },
  {
    id: "ped-1031",
    code: "PED-1031",
    date: "10 oct. 2026",
    productsSummary: "Bravery Gato 2 kg · 7 unidades",
    total: 980,
    status: "Conciliado",
  },
  {
    id: "ped-1018",
    code: "PED-1018",
    date: "02 oct. 2026",
    productsSummary: "Bravery Puppy 7 kg · 6 unidades",
    total: 780,
    status: "Conciliado",
  },
];

export const ClienteComprasTab: React.FC<ClienteComprasTabProps> = ({ cliente }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredCompras = COMPRAS_MOCK.filter((item) => {
    const matchesSearch =
      !search ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.productsSummary.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header & KPI Summary Cards */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950">Historial de compras</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pedidos comerciales registrados para este cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {/* KPI 1 */}
          <div className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-xs min-w-[170px]">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Compras de octubre</p>
              <p className="text-sm font-bold text-zinc-950">S/ 3,200</p>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-xs min-w-[150px]">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Pedidos del mes</p>
              <p className="text-sm font-bold text-zinc-950">3</p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg shadow-xs min-w-[170px]">
            <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Última compra</p>
              <p className="text-sm font-bold text-zinc-950">15 oct. 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs border-zinc-200">
        <CardContent className="p-4 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Buscar por pedido o producto"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4 text-zinc-400" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 h-9">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span>01 – 16 oct. 2026</span>
              </div>

              <div className="w-36">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { label: "Estado: Todos", value: "Todos" },
                    { label: "Pendiente", value: "Pendiente" },
                    { label: "Conciliado", value: "Conciliado" },
                  ]}
                />
              </div>

              <Button variant="secondary" size="sm" className="h-9 gap-1.5 text-xs text-zinc-700">
                <Filter className="h-3.5 w-3.5" /> Más filtros
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Pedido</th>
                  <th className="py-2.5 px-3">
                    <span className="flex items-center gap-1">Fecha &darr;</span>
                  </th>
                  <th className="py-2.5 px-3">Productos</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Estado de pago</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredCompras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-400">
                      No se encontraron compras con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredCompras.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-zinc-900">
                        <Link
                          href={`/comercial/ventas/pedidos/${item.id}/`}
                          className="hover:underline"
                        >
                          {item.code}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-zinc-600">{item.date}</td>
                      <td className="py-3 px-3 text-zinc-800">{item.productsSummary}</td>
                      <td className="py-3 px-3 font-semibold text-zinc-900">
                        S/ {item.total.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        {item.status === "Pendiente" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            <Clock className="h-3 w-3 text-zinc-500" /> Pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-zinc-900 text-white">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Conciliado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/comercial/ventas/pedidos/${item.id}/`}
                          className="text-xs font-semibold text-zinc-900 hover:underline"
                        >
                          Ver pedido
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="flex items-center justify-between text-2xs text-zinc-500 pt-1">
            <span>Mostrando {filteredCompras.length} de {COMPRAS_MOCK.length} registros</span>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded bg-zinc-900 text-white font-semibold">
                1
              </button>
              <button
                disabled
                className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Productos más comprados & Demanda no atendida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Productos más comprados (2 cols) */}
        <Card className="lg:col-span-2 shadow-xs border-zinc-200">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
              Productos más comprados
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Product 1 */}
              <div className="flex items-center justify-between gap-4">
                <span className="w-44 text-zinc-800 font-medium truncate">Bravery Adulto 7 kg</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 rounded-full w-[80%]" />
                </div>
                <span className="w-20 text-right font-semibold text-zinc-900">8 unidades</span>
              </div>

              {/* Product 2 */}
              <div className="flex items-center justify-between gap-4">
                <span className="w-44 text-zinc-800 font-medium truncate">Bravery Gato 2 kg</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 rounded-full w-[70%]" />
                </div>
                <span className="w-20 text-right font-semibold text-zinc-900">7 unidades</span>
              </div>

              {/* Product 3 */}
              <div className="flex items-center justify-between gap-4">
                <span className="w-44 text-zinc-800 font-medium truncate">Bravery Puppy 7 kg</span>
                <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-600 rounded-full w-[60%]" />
                </div>
                <span className="w-20 text-right font-semibold text-zinc-900">6 unidades</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demanda no atendida (1 col) */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-5 space-y-3.5 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                Demanda no atendida
              </h3>

              <div className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                  !
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">2 unidades · Bravery Adulto 7 kg</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Solicitadas: 10 · Aceptadas: 8</p>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-100/90 rounded-lg flex items-center gap-2 text-2xs text-zinc-600">
              <Info className="h-4 w-4 shrink-0 text-zinc-500" />
              <span>Dato comercial; no implica compromiso de entrega.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Notes */}
      <div className="flex items-center justify-between text-2xs text-zinc-400 pt-2 border-t border-zinc-100">
        <span>Pedidos: plataforma comercial · Facturación: SAP</span>
        <span>Datos ficticios para demostración</span>
      </div>
    </div>
  );
};
