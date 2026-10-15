"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import {
  getCotizaciones,
  getPedidos,
  CotizacionesTable,
  PedidosTable,
} from "@/modules/comercial/ventas";

export default function VentasPage() {
  const [activeTab, setActiveTab] = useState("cotizaciones");

  const cotizaciones = getCotizaciones();
  const pedidos = getPedidos();

  const tabs = [
    { id: "cotizaciones", label: "Cotizaciones" },
    { id: "pedidos", label: "Pedidos" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-4">
        <PageHeader
          breadcrumbs={[
            { label: "Comercial", href: "/comercial/clientes/" },
            { label: "Ventas" },
          ]}
          title="Ventas"
          subtitle="Gestiona cotizaciones y pedidos de clientes"
          actions={
            activeTab === "cotizaciones" ? (
              <Link href="/comercial/ventas/cotizaciones/nueva/">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Nueva cotización
                </Button>
              </Link>
            ) : (
              <Link href="/comercial/ventas/pedidos/nuevo/">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Nuevo pedido
                </Button>
              </Link>
            )
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "cotizaciones" ? (
          <CotizacionesTable cotizaciones={cotizaciones} />
        ) : (
          <PedidosTable pedidos={pedidos} />
        )}
      </div>
    </DashboardShell>
  );
}
