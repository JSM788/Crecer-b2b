"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Users, AlertCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { JornadaSummary } from "../models/visita.model";

interface JornadasViewProps {
  jornadas: JornadaSummary[];
}

export const JornadasView: React.FC<JornadasViewProps> = ({ jornadas }) => {
  const [team, setTeam] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [showAlert, setShowAlert] = useState(true);

  const columns: Column<JornadaSummary>[] = [
    {
      header: "Vendedor",
      accessorKey: "seller",
      cell: (row) => <span className="font-semibold text-zinc-900">{row.seller}</span>,
    },
    {
      header: "Inicio",
      accessorKey: "startTime",
      cell: (row) => <span className="text-zinc-600">{row.startTime}</span>,
    },
    {
      header: "Avance",
      cell: (row) => {
        const percentage = Math.round((row.completedVisits / row.totalVisits) * 100) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-zinc-700 font-medium">
              {row.completedVisits} / {row.totalVisits}
            </span>
            <div className="w-16 h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${percentage}%` }}
                className="h-full bg-zinc-800 rounded-full"
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Estado",
      cell: (row) => {
        const variant =
          row.status === "En jornada"
            ? "info"
            : row.status === "Interrumpida"
            ? "danger"
            : "neutral";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Acción",
      className: "w-28 text-right",
      cell: (row) => (
        <Link href={`/comercial/visitas-jornadas/jornada/${row.id}/`}>
          <Button
            size="sm"
            variant={row.status === "En jornada" ? "primary" : "secondary"}
            className="h-7 text-xs px-2.5"
          >
            {row.status === "En jornada" ? "Abrir" : row.status === "Interrumpida" ? "Revisar" : "Ver"}
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span>16 oct. 2026</span>
          </div>

          <div className="w-40">
            <Select
              label="Equipo"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              options={[
                { label: "Todos", value: "Todos" },
                { label: "Equipo Lima Centro", value: "Lima Centro" },
                { label: "Equipo Lima Sur", value: "Lima Sur" },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: "Todos", value: "Todos" },
                { label: "En jornada", value: "En jornada" },
                { label: "Interrumpida", value: "Interrumpida" },
                { label: "Sin iniciar", value: "Sin iniciar" },
              ]}
            />
          </div>
        </div>

        {/* Ocultado temporalmente: acción ejecutada en App Móvil / ERP (SAP/Defontana)
        <Link href="/comercial/visitas-jornadas/jornada/j-01/">
          <Button size="sm">Ver mi jornada</Button>
        </Link>
        */}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-zinc-950">4</span>
                <span className="text-xs font-semibold text-zinc-800">Jornadas activas</span>
              </div>
              <p className="text-2xs text-zinc-400">de 5 vendedores</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-zinc-950">2</span>
                <span className="text-xs font-semibold text-zinc-800">
                  Visitas pendientes de reasignar
                </span>
              </div>
              <p className="text-2xs text-amber-600 font-medium">requieren atención</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Banner */}
      {showAlert && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-between text-xs text-zinc-800">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-zinc-600" />
            <span>2 visitas requieren reasignación por vendedor no disponible.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="h-7 text-xs">
              Revisar visitas
            </Button>
            <button
              onClick={() => setShowAlert(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={jornadas}
        keyExtractor={(row) => row.id}
        entityName="jornadas"
      />
    </div>
  );
};
