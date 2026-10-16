"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  User,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/lib/utils";
import { Cliente } from "../models/cliente.model";

interface ClienteFichaViewProps {
  cliente: Cliente;
}

export const ClienteFichaView: React.FC<ClienteFichaViewProps> = ({ cliente }) => {
  const [activeTab, setActiveTab] = useState("resumen");

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "compras", label: "Compras" },
    { id: "credito", label: "Crédito y deuda" },
    { id: "actividad", label: "Actividad" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Comercial", href: "/comercial/clientes/" },
          { label: "Clientes", href: "/comercial/clientes/" },
          { label: cliente.name },
        ]}
        title={cliente.name}
        subtitle={`Cliente · ${cliente.code}`}
        actions={
          <div className="flex items-center gap-2.5">
            {/* Ocultado temporalmente: acción ejecutada en App Móvil / ERP (SAP/Defontana)
            <Link href="/comercial/ventas/pedidos/nuevo/">
              <Button variant="secondary" size="sm">
                Nuevo pedido
              </Button>
            </Link>
            <Link href="/comercial/ventas/cotizaciones/nueva/">
              <Button size="sm">
                Nueva cotización
              </Button>
            </Link>
            */}
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "resumen" ? (
        <div className="space-y-5">
          {/* Main Info Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-lg shrink-0">
                    {cliente.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-950">{cliente.name}</h2>
                    <p className="text-xs text-zinc-500">RUC {cliente.ruc}</p>
                    <p className="text-2xs text-zinc-400 mt-0.5">
                      Cliente desde {cliente.since}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs text-zinc-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-zinc-900">{cliente.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-zinc-900">{cliente.seller}</p>
                      <p className="text-2xs text-zinc-400">Ejecutiva comercial</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards Row */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xs text-zinc-500">Última compra</p>
                    <p className="text-sm font-bold text-zinc-900">
                      {cliente.lastPurchaseDate}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xs text-zinc-500">Compras mes</p>
                    <p className="text-sm font-bold text-zinc-900">
                      {formatCurrency(cliente.monthlyPurchases)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xs text-zinc-500">Crédito disponible</p>
                    <p className="text-sm font-bold text-zinc-900">
                      {formatCurrency(cliente.availableCredit)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xs text-zinc-500">Deuda vencida</p>
                    <p className="text-sm font-bold text-zinc-900">
                      {formatCurrency(cliente.expiredDebt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-right text-2xs text-zinc-400">
              Datos de SAP · Actualizado 09:00
            </p>
          </div>

          {/* Bottom Grid: Chart & Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Purchase History Chart */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-900">
                  Compras de los últimos 6 meses
                </h3>
                <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-zinc-100">
                  {[
                    { month: "Abr", amount: 2000, height: "40%" },
                    { month: "May", amount: 4500, height: "65%" },
                    { month: "Jun", amount: 7200, height: "90%" },
                    { month: "Jul", amount: 2600, height: "45%" },
                    { month: "Ago", amount: 4800, height: "70%" },
                    { month: "Sep", amount: 3200, height: "55%" },
                  ].map((bar) => (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-2xs text-zinc-400 font-medium">
                        S/ {bar.amount / 1000}k
                      </span>
                      <div
                        style={{ height: bar.height }}
                        className="w-full max-w-[36px] bg-zinc-400 hover:bg-zinc-700 rounded-t transition-all"
                      />
                      <span className="text-2xs text-zinc-500 font-medium">{bar.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-900">Actividad reciente</h3>
                  <button className="text-2xs text-zinc-500 hover:underline">Ver todas</button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-zinc-100 text-zinc-600 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-900 font-medium">Se registró una visita comercial</p>
                      <p className="text-2xs text-zinc-400">Hoy, 10:24</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-zinc-100 text-zinc-600 mt-0.5">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-900 font-medium">Se creó la cotización COT-1042</p>
                      <p className="text-2xs text-zinc-400">Ayer, 16:40</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-zinc-100 text-zinc-600 mt-0.5">
                      <ShoppingBag className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-900 font-medium">Se registró un pedido PED-0871</p>
                      <p className="text-2xs text-zinc-400">12 mar. 2025</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-zinc-100 text-zinc-600 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-zinc-900 font-medium">Ana Torres actualizó los datos del cliente</p>
                      <p className="text-2xs text-zinc-400">10 mar. 2025</p>
                    </div>
                  </div>
                </div>

                {/* Ocultado temporalmente: acción ejecutada en App Móvil / ERP (SAP/Defontana)
                <div className="pt-2 border-t border-zinc-100">
                  <Link
                    href="/comercial/ventas/pedidos/ped-1042/"
                    className="text-xs text-zinc-900 font-semibold hover:underline"
                  >
                    Reportar pago
                  </Link>
                </div>
                */}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-zinc-400">
            <p className="text-sm font-medium text-zinc-600">Sección en preparación</p>
            <p className="text-xs mt-1">La información de {activeTab} se conectará con el módulo correspondiente.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
