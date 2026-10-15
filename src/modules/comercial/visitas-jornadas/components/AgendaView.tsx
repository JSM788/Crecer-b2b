"use client";

import React, { useState } from "react";
import { Plus, Calendar, MapPin, List, LayoutGrid } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { AgendaSlot } from "../models/visita.model";
import { ProgramarVisitaDrawer } from "./ProgramarVisitaDrawer";

interface AgendaViewProps {
  agendaItems: AgendaSlot[];
}

export const AgendaView: React.FC<AgendaViewProps> = ({ agendaItems }) => {
  const [seller, setSeller] = useState("Todos");
  const [territory, setTerritory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"lista" | "calendario">("calendario");
  const [isProgramarOpen, setIsProgramarOpen] = useState(false);

  const hours = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
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
              label="Vendedor"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              options={[
                { label: "Todos", value: "Todos" },
                { label: "Ana Torres", value: "Ana Torres" },
                { label: "Luis Ramos", value: "Luis Ramos" },
                { label: "Carlos Díaz", value: "Carlos Díaz" },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              label="Territorio"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              options={[
                { label: "Todos", value: "Todos" },
                { label: "San Borja", value: "San Borja" },
                { label: "Miraflores", value: "Miraflores" },
                { label: "Surco", value: "Surco" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50">
            <button
              onClick={() => setViewMode("lista")}
              className={`p-1.5 rounded text-xs ${
                viewMode === "lista"
                  ? "bg-white shadow-xs text-zinc-950 font-medium"
                  : "text-zinc-500"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("calendario")}
              className={`p-1.5 rounded text-xs ${
                viewMode === "calendario"
                  ? "bg-white shadow-xs text-zinc-950 font-medium"
                  : "text-zinc-500"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => setIsProgramarOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Agendar visita
          </Button>
        </div>
      </div>

      {/* Main Schedule & Next Visits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Schedule Slots (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 pb-2 border-b border-zinc-100">
            Viernes, 16 de octubre de 2026
          </h3>

          <div className="space-y-4">
            {hours.map((hour) => {
              const visit = agendaItems.find((v) => v.timeSlot.startsWith(hour));

              return (
                <div key={hour} className="flex items-start gap-4 text-xs">
                  <span className="w-12 text-zinc-400 font-medium pt-1 shrink-0">{hour}</span>

                  <div className="flex-1 min-h-[44px] border-t border-zinc-100 pt-1">
                    {visit ? (
                      <div className="p-3 bg-zinc-100/90 border border-zinc-200 rounded-lg hover:bg-zinc-200/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-900">{visit.clientName}</span>
                          <span className="text-2xs text-zinc-500">{visit.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-4 text-2xs text-zinc-500 mt-1">
                          <span>{visit.seller}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {visit.district}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Próximas Visitas (1 col) */}
        <Card className="h-fit">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Próximas visitas</h3>
              <button className="text-2xs text-zinc-500 hover:underline">Ver todas</button>
            </div>

            <div className="space-y-3.5">
              {agendaItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-zinc-100 hover:border-zinc-300 transition-colors bg-zinc-50/50"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-zinc-900">{item.clientName}</span>
                    <span className="text-2xs font-semibold px-2 py-0.5 bg-zinc-200 rounded">
                      {item.timeSlot.split(" - ")[0]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-2xs text-zinc-500">
                    <span>{item.seller}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.district}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProgramarVisitaDrawer
        isOpen={isProgramarOpen}
        onClose={() => setIsProgramarOpen(false)}
      />
    </div>
  );
};
