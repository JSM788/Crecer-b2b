"use client";

import React, { useState } from "react";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { ConciliacionPagosTable } from "./ConciliacionPagosTable";
import { CuentasPorCobrarTable } from "./CuentasPorCobrarTable";
import { LineasCreditoTable } from "./LineasCreditoTable";
import {
  PAGOS_REPORTADOS_MOCK,
  CUENTAS_POR_COBRAR_MOCK,
  LINEAS_CREDITO_MOCK,
} from "../mocks/finanzas.mock";
import { CheckCircle2, Clock, AlertTriangle, Wallet } from "lucide-react";

export const FinanzasView: React.FC = () => {
  const [activeTab, setActiveTab] = useState("conciliacion");

  // Quick stats
  const pendientesConciliacion = PAGOS_REPORTADOS_MOCK.filter(
    (p) => p.status === "Pendiente"
  ).length;
  const montoPendiente = PAGOS_REPORTADOS_MOCK.filter((p) => p.status === "Pendiente")
    .reduce((acc, p) => acc + p.amount, 0);

  const deudaTotal = CUENTAS_POR_COBRAR_MOCK.reduce((acc, c) => acc + c.totalDebt, 0);
  const deudaMora = CUENTAS_POR_COBRAR_MOCK.reduce(
    (acc, c) => acc + c.overdue31to60 + c.overdueMore60,
    0
  );

  const tabs = [
    {
      id: "conciliacion",
      label: "Conciliación de pagos",
      badge: pendientesConciliacion > 0 ? pendientesConciliacion : undefined,
    },
    {
      id: "cuentas-cobrar",
      label: "Cuentas por cobrar y mora",
    },
    {
      id: "lineas-credito",
      label: "Líneas de crédito",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1320px] mx-auto">
      <PageHeader
        title="Finanzas y Cobranzas"
        subtitle="Conciliación bancaria, liberación de pedidos y control de crédito comercial"
        breadcrumbs={[
          { label: "Inicio", href: "/inicio/" },
          { label: "Finanzas" },
        ]}
      />

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Por Conciliar */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500">Por conciliar</p>
            <p className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5">
              S/ {montoPendiente.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              {pendientesConciliacion} comprobantes pendientes
            </p>
          </div>
        </div>

        {/* Card 2: Cartera Total */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500">Cartera total por cobrar</p>
            <p className="text-xl font-bold tracking-tight text-zinc-900 mt-0.5">
              S/ {deudaTotal.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">5 clientes con saldo</p>
          </div>
        </div>

        {/* Card 3: Deuda en mora */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500">Deuda vencida (&gt;30d)</p>
            <p className="text-xl font-bold tracking-tight text-rose-600 mt-0.5">
              S/ {deudaMora.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">2 clientes observados</p>
          </div>
        </div>

        {/* Card 4: Conciliados */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xs font-medium text-zinc-500">Conciliados hoy</p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 mt-0.5">
              S/ 3,000.00
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">2 pedidos validados</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "conciliacion" && (
          <ConciliacionPagosTable initialData={PAGOS_REPORTADOS_MOCK} />
        )}

        {activeTab === "cuentas-cobrar" && (
          <CuentasPorCobrarTable initialData={CUENTAS_POR_COBRAR_MOCK} />
        )}

        {activeTab === "lineas-credito" && (
          <LineasCreditoTable initialData={LINEAS_CREDITO_MOCK} />
        )}
      </div>
    </div>
  );
};
