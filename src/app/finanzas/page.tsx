import React from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { EmptyState } from "@/shared/patterns/EmptyState";
import { CircleDollarSign } from "lucide-react";

export default function FinanzasPage() {
  return (
    <DashboardShell>
      <div className="space-y-4">
        <PageHeader title="Finanzas y Conciliación" subtitle="Conciliación de pagos reportados y extractos bancarios" />
        <EmptyState
          icon={<CircleDollarSign className="h-6 w-6" />}
          title="Módulo de Finanzas en preparación"
          description="Los pagos reportados desde los pedidos (C16) se sincronizan con las cuentas por cobrar y el historial del cliente."
        />
      </div>
    </DashboardShell>
  );
}
