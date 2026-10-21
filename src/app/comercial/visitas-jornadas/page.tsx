"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DashboardShell } from "@/shared/layout/DashboardShell";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Tabs } from "@/shared/components/ui/tabs";
import { useDemo } from "@/shared/state/demo-store";
import {
  getRegistrosVisita,
  AgendaView,
  JornadasView,
  RegistrosView,
} from "@/modules/comercial/visitas-jornadas";

export default function VisitasJornadasPage() {
  const [activeTab, setActiveTab] = useState("agenda");

  const { agenda, jornadas } = useDemo();
  const registros = getRegistrosVisita();

  const tabs = [
    { id: "agenda", label: "Agenda" },
    { id: "jornadas", label: "Jornadas" },
    { id: "registros", label: "Registros" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-4">
        <PageHeader
          breadcrumbs={[
            { label: "Comercial", href: "/comercial/clientes/" },
            { label: "Visitas y jornadas" },
          ]}
          title="Visitas y jornadas"
          subtitle="Supervisa las visitas y jornadas del equipo comercial"
          actions={
            <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <span>16 oct. 2026</span>
            </div>
          }
        />

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "agenda" && <AgendaView agendaItems={agenda} />}
        {activeTab === "jornadas" && <JornadasView jornadas={jornadas} />}
        {activeTab === "registros" && <RegistrosView registros={registros} />}
      </div>
    </DashboardShell>
  );
}
