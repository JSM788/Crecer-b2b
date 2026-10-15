import React from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { NuevaCotizacionView } from "@/modules/comercial/ventas";

export default function NuevaCotizacionPage() {
  return (
    <DashboardShell>
      <NuevaCotizacionView />
    </DashboardShell>
  );
}
