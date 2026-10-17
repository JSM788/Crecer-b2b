"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, Search } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Cliente } from "../models/cliente.model";

interface ClienteCreditoTabProps {
  cliente: Cliente;
}

interface DocumentoPendiente {
  id: string;
  code: string;
  emision: string;
  vencimiento: string;
  importe: number;
  saldoPendiente: number;
  estado: "Por vencer" | "Vencido";
}

const DOCUMENTOS_PENDIENTES: DocumentoPendiente[] = [
  {
    id: "doc-1",
    code: "F001-00871",
    emision: "01 oct. 2026",
    vencimiento: "31 oct. 2026",
    importe: 1600,
    saldoPendiente: 1600,
    estado: "Por vencer",
  },
  {
    id: "doc-2",
    code: "F001-00902",
    emision: "10 oct. 2026",
    vencimiento: "09 nov. 2026",
    importe: 1000,
    saldoPendiente: 1000,
    estado: "Por vencer",
  },
];

export const ClienteCreditoTab: React.FC<ClienteCreditoTabProps> = ({ cliente }) => {
  const [searchDoc, setSearchDoc] = useState("");
  const [vencimientoFilter, setVencimientoFilter] = useState("Todos");

  const creditLimit = cliente?.creditLimit ?? 5000;
  const currentDebt = cliente?.currentDebt ?? 2600;
  const availableCredit = cliente?.availableCredit ?? Math.max(0, creditLimit - currentDebt);
  const expiredDebt = cliente?.expiredDebt ?? 0;
  const condition = cliente?.condition ?? "Al día";

  const usedPercent = creditLimit > 0 ? Math.round((currentDebt / creditLimit) * 100) : 52;

  const filteredDocs = DOCUMENTOS_PENDIENTES.filter((doc) => {
    const matchesSearch = !searchDoc || doc.code.toLowerCase().includes(searchDoc.toLowerCase());
    return matchesSearch;
  });

  const totalSaldoPendiente = filteredDocs.reduce((acc, curr) => acc + curr.saldoPendiente, 0);

  return (
    <div className="space-y-5">
      {/* Top SAP Sync Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg">
        <div className="flex items-center gap-2.5 text-xs text-zinc-700">
          <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
            <Info className="h-3 w-3" />
          </div>
          <span>
            <strong className="text-zinc-900">Información de SAP Business One</strong> · Última
            sincronización: 16 oct. 2026, 15:45
          </span>
        </div>

        <span className="px-2.5 py-1 text-2xs font-semibold rounded-md bg-zinc-200/80 text-zinc-700">
          Solo lectura
        </span>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Línea de crédito */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-2xs font-medium text-zinc-500">Línea de crédito</p>
            <p className="text-xl font-bold text-zinc-950">
              S/ {creditLimit.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Crédito utilizado */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 space-y-1.5">
            <p className="text-2xs font-medium text-zinc-500">Crédito utilizado</p>
            <p className="text-xl font-bold text-zinc-950">
              S/ {currentDebt.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 rounded-full transition-all"
                    style={{ width: `${Math.min(100, usedPercent)}%` }}
                  />
                </div>
                <span className="text-2xs text-zinc-500 font-semibold">{usedPercent}%</span>
              </div>
              <p className="text-2xs text-zinc-400">{usedPercent}% de la línea utilizada</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Crédito disponible */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-2xs font-medium text-zinc-500">Crédito disponible</p>
            <p className="text-xl font-bold text-zinc-950">
              S/ {availableCredit.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Deuda vencida */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 space-y-1">
            <p className="text-2xs font-medium text-zinc-500">Deuda vencida</p>
            <p className="text-xl font-bold text-zinc-950">
              S/ {expiredDebt.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Status & Info Sub-bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-lg">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-zinc-600 font-medium">Estado de crédito</span>
          <span className="px-3 py-0.5 rounded-full text-2xs font-bold bg-zinc-200 text-zinc-900">
            {condition}
          </span>
        </div>

        <div className="flex items-center gap-2 text-2xs text-zinc-500">
          <Info className="h-3.5 w-3.5 text-zinc-400" />
          <span>La información de crédito se consulta en SAP; no se modifica desde esta ficha.</span>
        </div>
      </div>

      {/* Section 1: Documentos Pendientes */}
      <Card className="shadow-xs border-zinc-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-zinc-900">Documentos pendientes</h3>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="w-56">
                <Input
                  placeholder="Buscar documento..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  icon={<Search className="h-3.5 w-3.5 text-zinc-400" />}
                />
              </div>

              <div className="w-40">
                <Select
                  value={vencimientoFilter}
                  onChange={(e) => setVencimientoFilter(e.target.value)}
                  options={[
                    { label: "Vencimiento: Todos", value: "Todos" },
                    { label: "Por vencer", value: "Por vencer" },
                    { label: "Vencidos", value: "Vencidos" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Documento</th>
                  <th className="py-2.5 px-3">Emisión</th>
                  <th className="py-2.5 px-3">Vencimiento</th>
                  <th className="py-2.5 px-3">Importe</th>
                  <th className="py-2.5 px-3">Saldo pendiente</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-zinc-900">{doc.code}</td>
                    <td className="py-3 px-3 text-zinc-600">{doc.emision}</td>
                    <td className="py-3 px-3 text-zinc-600">{doc.vencimiento}</td>
                    <td className="py-3 px-3 text-zinc-800">
                      S/ {doc.importe.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-zinc-900">
                      S/ {doc.saldoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        {doc.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50/90 border-t border-zinc-200">
                <tr>
                  <td colSpan={4} className="py-2.5 px-3 text-right text-xs font-semibold text-zinc-700">
                    Saldo pendiente total
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-base font-bold text-zinc-950">
                    S/ {totalSaldoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Pagos en verificación */}
      <Card className="shadow-xs border-zinc-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <h3 className="text-xs font-bold text-zinc-900">Pagos en verificación</h3>
            <div className="flex items-center gap-1.5 text-2xs text-zinc-500">
              <span>Información registrada en la plataforma de Aquamundo</span>
              <Info className="h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Documento / Referencia</th>
                  <th className="py-2.5 px-3">Fecha de reporte</th>
                  <th className="py-2.5 px-3">Importe</th>
                  <th className="py-2.5 px-3">Pedido relacionado</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Observación</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-zinc-900">OP 845219 · BCP</td>
                  <td className="py-3 px-3 text-zinc-600">15 oct. 2026</td>
                  <td className="py-3 px-3 font-semibold text-zinc-900">S/ 1,440</td>
                  <td className="py-3 px-3 text-zinc-900 font-medium">
                    <Link href="/comercial/ventas/pedidos/ped-1042/" className="hover:underline">
                      PED-1042
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      Esperando archivo
                    </span>
                  </td>
                  <td className="py-3 px-3 text-2xs text-zinc-500">
                    Pago reportado en la plataforma. Aún no confirmado ni aplicado en SAP.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="text-right text-2xs text-zinc-400 pt-2 border-t border-zinc-100">
        <span>Datos ficticios para demostración</span>
      </div>
    </div>
  );
};
