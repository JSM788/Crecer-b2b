import React from "react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { getJornadas, DetalleJornadaView } from "@/modules/comercial/visitas-jornadas";

export function generateStaticParams() {
  const jornadas = getJornadas();
  return jornadas.map((j) => ({
    id: j.id,
  }));
}

export default function DetalleJornadaPage({ params }: { params: { id: string } }) {
  const jornada = getJornadas().find((j) => j.id === params.id);
  if (!jornada) notFound();

  return (
    <DashboardShell>
      <DetalleJornadaView jornada={jornada} />
    </DashboardShell>
  );
}
