import React from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { getJornadas, DetalleJornadaView } from "@/modules/comercial/visitas-jornadas";

export function generateStaticParams() {
  const jornadas = getJornadas();
  return jornadas.map((j) => ({
    id: j.id,
  }));
}

export default function DetalleJornadaPage() {
  return (
    <DashboardShell>
      <DetalleJornadaView />
    </DashboardShell>
  );
}
