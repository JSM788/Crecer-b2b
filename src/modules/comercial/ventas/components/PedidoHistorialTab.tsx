"use client";

import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Info,
  CalendarRange,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Select } from "@/shared/components/ui/select";
import { Pedido } from "../models/venta.model";

interface PedidoHistorialTabProps {
  pedido: Pedido;
}

export const PedidoHistorialTab: React.FC<PedidoHistorialTabProps> = ({ pedido }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState("Todos");
  const [originFilter, setOriginFilter] = useState("Todos");

  return (
    <div className="space-y-5">
      {/* Top Row: 3 Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pago */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Pago</p>
              <p className="text-xs font-bold text-zinc-900">Esperando archivo</p>
              <p className="text-2xs text-zinc-500 mt-0.5">Sube el comprobante de pago</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Reserva */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Reserva</p>
              <p className="text-xs font-bold text-zinc-900">Confirmación SAP pendiente</p>
              <p className="text-2xs text-zinc-500 mt-0.5">Reserva provisional registrada</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pedido */}
        <Card className="shadow-xs border-zinc-200">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-700 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-400 font-medium">Pedido</p>
              <p className="text-xs font-bold text-zinc-900">Pendiente de validación</p>
              <p className="text-2xs text-zinc-500 mt-0.5">En revisión por administración</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Trazabilidad (2 cols) & Estado Actual (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Trazabilidad */}
        <Card className="lg:col-span-2 shadow-xs border-zinc-200">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
              Trazabilidad del pedido
            </h3>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-40">
                <Select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  options={[
                    { label: "Tipo de evento: Todos", value: "Todos" },
                    { label: "Pago", value: "Pago" },
                    { label: "Archivo", value: "Archivo" },
                    { label: "Pedido", value: "Pedido" },
                    { label: "Cotización", value: "Cotización" },
                  ]}
                />
              </div>

              <div className="w-36">
                <Select
                  value={originFilter}
                  onChange={(e) => setOriginFilter(e.target.value)}
                  options={[
                    { label: "Origen: Todos", value: "Todos" },
                    { label: "App comercial", value: "App comercial" },
                    { label: "Integración financiera", value: "Integración financiera" },
                  ]}
                />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 h-9">
                <CalendarRange className="h-4 w-4 text-zinc-500" />
                <span>15 – 16 oct. 2026</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 pt-1">
              {/* Group 1: 16 oct. 2026 */}
              <div className="space-y-3">
                <div className="bg-zinc-100/80 px-3 py-1.5 rounded-md text-2xs font-bold text-zinc-700">
                  16 oct. 2026
                </div>

                <div className="space-y-3 pl-2 sm:pl-3">
                  {/* Event 1 */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        <span className="text-2xs font-semibold text-zinc-400">09:35</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-950">Pago reportado</p>
                        <p className="text-2xs text-zinc-500">Ana Torres · App comercial</p>
                        <p className="text-2xs text-zinc-700 font-medium">
                          BCP · OP 845219 · S/ 1,440
                        </p>
                        <p className="text-2xs text-zinc-400 mt-1">
                          El comprobante aún no confirma el pago.
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
                      Esperando archivo
                    </span>
                  </div>

                  {/* Event 2 */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        <span className="text-2xs font-semibold text-zinc-400">08:00</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-950">
                          Archivo financiero actualizado
                        </p>
                        <p className="text-2xs text-zinc-500">Integración financiera</p>
                        <p className="text-2xs text-zinc-400">
                          Última versión disponible para conciliación; anterior al reporte del pago.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: 15 oct. 2026 */}
              <div className="space-y-3 pt-1">
                <div className="bg-zinc-100/80 px-3 py-1.5 rounded-md text-2xs font-bold text-zinc-700">
                  15 oct. 2026
                </div>

                <div className="space-y-3 pl-2 sm:pl-3">
                  {/* Event 3 */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        <span className="text-2xs font-semibold text-zinc-400">16:20</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-950">Pedido registrado</p>
                        <p className="text-2xs text-zinc-500">Ana Torres · App comercial</p>
                        <p className="text-2xs text-zinc-700 font-medium">PED-1042 · S/ 1,440</p>
                      </div>
                    </div>
                  </div>

                  {/* Event 4 */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        <span className="text-2xs font-semibold text-zinc-400">16:20</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-950">
                          Cantidad aceptada registrada
                        </p>
                        <p className="text-2xs text-zinc-500">Ana Torres · App comercial</p>
                        <p className="text-2xs text-zinc-700">
                          Solicitadas: 10 · Aceptadas: 8 · Demanda no atendida: 2
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event 5 */}
                  <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-zinc-900" />
                        <span className="text-2xs font-semibold text-zinc-400">16:05</span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-950">Cotización registrada</p>
                        <p className="text-2xs text-zinc-500">Ana Torres · App comercial</p>
                        <p className="text-2xs text-zinc-700">COT-1042 · Ana Torres</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (1 col): Estado Actual & Note */}
        <div className="space-y-4">
          <Card className="shadow-xs border-zinc-200">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Estado actual
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span>Pedido</span>
                  </div>
                  <span className="font-bold text-zinc-950">Pendiente de validación</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <FileText className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span>Pago</span>
                  </div>
                  <span className="font-semibold text-zinc-800">Esperando archivo</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span>Reserva</span>
                  </div>
                  <span className="font-semibold text-zinc-800">Confirmación SAP pendiente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-2.5 text-2xs text-zinc-600">
            <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-3 w-3" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-800">Eventos de consulta y registro.</p>
              <p className="text-zinc-500">
                No existe confirmación de pago ni de reserva SAP en este ejemplo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-right text-2xs text-zinc-400 pt-2 border-t border-zinc-100">
        <span>Datos ficticios para demostración</span>
      </div>
    </div>
  );
};
