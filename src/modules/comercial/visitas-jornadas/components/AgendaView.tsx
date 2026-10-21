"use client";

import React, { useMemo, useState } from "react";
import { Plus, Calendar, MapPin, List, LayoutGrid, CheckCircle2, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { optionsFrom } from "@/shared/lib/options";
import { AgendaSlot } from "../models/visita.model";
import { ProgramarVisitaDrawer } from "./ProgramarVisitaDrawer";
import { SCENARIO_DAY, SCENARIO_DAY_LONG, SLOT_STATUS_LABEL, slotStart } from "./scenario-day";

interface AgendaViewProps {
  /** Agenda of the day, taken from the demo store by the page. */
  agendaItems: AgendaSlot[];
}

const MIN_HOUR = 8;
const MAX_HOUR = 17;

const STATUS_VARIANT = {
  completada: "success",
  en_curso: "info",
  programada: "neutral",
} as const;

const byTime = (a: AgendaSlot, b: AgendaSlot) => slotStart(a.timeSlot).localeCompare(slotStart(b.timeSlot));

export const AgendaView: React.FC<AgendaViewProps> = ({ agendaItems }) => {
  const [seller, setSeller] = useState("Todos");
  const [territory, setTerritory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"lista" | "calendario">("calendario");
  const [isProgramarOpen, setIsProgramarOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const sellerOptions = useMemo(() => optionsFrom(agendaItems.map((s) => s.seller)), [agendaItems]);
  const territoryOptions = useMemo(() => optionsFrom(agendaItems.map((s) => s.district)), [agendaItems]);

  const visible = useMemo(
    () =>
      agendaItems
        .filter((s) => seller === "Todos" || s.seller === seller)
        .filter((s) => territory === "Todos" || s.district === territory)
        .sort(byTime),
    [agendaItems, seller, territory]
  );
  const upcoming = visible.filter((s) => s.status !== "completada");

  // The hour grid grows when a visit is scheduled outside the usual 08:00-17:00 window.
  const hours = useMemo(() => {
    const starts = visible.map((s) => Number(slotStart(s.timeSlot).slice(0, 2)));
    const first = Math.min(MIN_HOUR, ...starts);
    const last = Math.max(MAX_HOUR, ...starts);
    return Array.from({ length: last - first + 1 }, (_, i) => `${String(first + i).padStart(2, "0")}:00`);
  }, [visible]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-zinc-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <span>{SCENARIO_DAY}</span>
          </div>

          <div className="w-40">
            <Select
              label="Vendedor"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              options={sellerOptions}
            />
          </div>

          <div className="w-40">
            <Select
              label="Territorio"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              options={territoryOptions}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex rounded-md border border-zinc-200 p-0.5 bg-zinc-50">
            <button
              onClick={() => setViewMode("lista")}
              aria-label="Vista de lista"
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
              aria-label="Vista de calendario"
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

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
            className="p-1 text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Schedule & Next Visits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Schedule Slots (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 pb-2 border-b border-zinc-100">
            {SCENARIO_DAY_LONG}
          </h3>

          {visible.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              No hay visitas programadas con los filtros seleccionados.
            </p>
          ) : viewMode === "calendario" ? (
            <div className="space-y-4">
              {hours.map((hour) => {
                const visits = visible.filter((v) => slotStart(v.timeSlot).startsWith(hour.slice(0, 2)));

                return (
                  <div key={hour} className="flex items-start gap-4 text-xs">
                    <span className="w-12 text-zinc-400 font-medium pt-1 shrink-0">{hour}</span>

                    <div className="flex-1 min-h-11 border-t border-zinc-100 pt-1 space-y-2">
                      {visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="p-3 bg-zinc-100/90 border border-zinc-200 rounded-lg hover:bg-zinc-200/80 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-zinc-900">{visit.clientName}</span>
                            <span className="text-2xs text-zinc-500">{visit.timeSlot}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-2xs text-zinc-500 mt-1">
                            <div className="flex items-center gap-4">
                              <span>{visit.seller}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {visit.district}
                              </span>
                            </div>
                            <Badge variant={STATUS_VARIANT[visit.status]}>{SLOT_STATUS_LABEL[visit.status]}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {visible.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-zinc-500 font-medium">{visit.timeSlot}</span>
                    <div>
                      <p className="font-semibold text-zinc-900">{visit.clientName}</p>
                      <p className="flex items-center gap-3 text-2xs text-zinc-500 mt-0.5">
                        <span>{visit.seller}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {visit.district}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[visit.status]}>{SLOT_STATUS_LABEL[visit.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Próximas Visitas (1 col) */}
        <Card className="h-fit">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Próximas visitas</h3>
              <button
                onClick={() => setViewMode("lista")}
                className="text-2xs text-zinc-500 hover:underline"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-3.5">
              {upcoming.length === 0 && (
                <p className="text-2xs text-zinc-500">No quedan visitas pendientes.</p>
              )}
              {upcoming.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-zinc-100 hover:border-zinc-300 transition-colors bg-zinc-50/50"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-zinc-900">{item.clientName}</span>
                    <span className="text-2xs font-semibold px-2 py-0.5 bg-zinc-200 rounded">
                      {slotStart(item.timeSlot)}
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
        onSave={(slot) => {
          // Show the new visit even if the current filters would hide it.
          setSeller("Todos");
          setTerritory("Todos");
          setNotice(`Visita programada: ${slot.clientName}, ${slot.timeSlot} con ${slot.seller}.`);
        }}
      />
    </div>
  );
};
