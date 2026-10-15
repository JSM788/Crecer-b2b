"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import {
  getClientes,
  ClientesCarteraTable,
  ClientesAsignacionesTable,
  NuevoClienteModal,
} from "@/modules/comercial/clientes";

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState("cartera");
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);
  const clientes = getClientes();

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
        />
      </div>
    </DashboardShell>
  );
}
