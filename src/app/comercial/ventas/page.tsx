"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { CotizacionesTable, PedidosTable } from "@/modules/comercial/ventas";

export default function VentasPage() {
  const [activeTab, setActiveTab] = useState("cotizaciones");

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
          subtitle="Supervisa las cotizaciones y pedidos que registran los comerciales desde la app"
          actions={
            /* Ocultado temporalmente: acción ejecutada en App Móvil / ERP (SAP/Defontana)
            // Al reactivar, importar: Link (next/link), Plus (lucide-react) y Button (ui/button)
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
            */
            undefined
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "cotizaciones" ? <CotizacionesTable /> : <PedidosTable />}
      </div>
    </DashboardShell>
  );
}
