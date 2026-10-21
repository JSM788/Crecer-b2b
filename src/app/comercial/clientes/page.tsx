"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import {
  ClientesCarteraTable,
  ClientesAsignacionesTable,
  NuevoClienteModal,
} from "@/modules/comercial/clientes";
import { useDemo, useSellerNames } from "@/shared/state/demo-store";

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState("cartera");
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);
  const { clientes, agregarCliente } = useDemo();
  const sellers = useSellerNames();

  const districts = useMemo(
    () => Array.from(new Set(clientes.map((c) => c.district))).sort((a, b) => a.localeCompare(b, "es")),
    [clientes]
  );
  const rucs = useMemo(() => clientes.map((c) => c.ruc), [clientes]);

  const tabs = [
    { id: "cartera", label: "Cartera" },
    { id: "asignaciones", label: "Asignaciones" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-4">
        <PageHeader
          title="Clientes"
          actions={
            <Button size="sm" onClick={() => setIsNuevoClienteOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Nuevo cliente
            </Button>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "cartera" ? (
          <ClientesCarteraTable clientes={clientes} />
        ) : (
          <ClientesAsignacionesTable clientes={clientes} />
        )}

        <NuevoClienteModal
          isOpen={isNuevoClienteOpen}
          onClose={() => setIsNuevoClienteOpen(false)}
          onSave={agregarCliente}
          districts={districts}
          sellers={sellers}
          existingRucs={rucs}
        />
      </div>
    </DashboardShell>
  );
}
