import React from "react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { VisitaActivaView } from "@/modules/comercial/visitas-jornadas";

export default function VisitaActivaPage() {
  return (
    <DashboardShell>
      <VisitaActivaView />
    </DashboardShell>
  );
}
