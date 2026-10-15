import React from "react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { getCotizaciones, getCotizacionById, DetalleCotizacionView } from "@/modules/comercial/ventas";

export function generateStaticParams() {
  const cotizaciones = getCotizaciones();
  return cotizaciones.map((c) => ({
    id: c.id,
  }));
}

export default function DetalleCotizacionPage({ params }: { params: { id: string } }) {
  const cotizacion = getCotizacionById(params.id);

  if (!cotizacion) {
    notFound();
  }

  return (
    <DashboardShell>
      <DetalleCotizacionView cotizacion={cotizacion} />
    </DashboardShell>
  );
}
