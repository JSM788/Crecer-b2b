import React from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { NuevoPedidoView } from "@/modules/comercial/ventas";

export default function NuevoPedidoPage() {
  return (
    <DashboardShell>
      <NuevoPedidoView />
    </DashboardShell>
  );
}
