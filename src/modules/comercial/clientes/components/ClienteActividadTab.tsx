"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  FileText,
  ShoppingCart,
  User,
  Search,
  Calendar,
  Clock,
  ImageIcon,
  ChevronRight,
  Info,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { Cliente } from "../models/cliente.model";

interface ClienteActividadTabProps {
  cliente: Cliente;
}

export const ClienteActividadTab: React.FC<ClienteActividadTabProps> = ({ cliente }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [responsableFilter, setResponsableFilter] = useState("Todos");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-xs border-zinc-200">
            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Header & Filter Bar */}
              <div>
                <h2 className="text-base font-bold text-zinc-950">Historial de actividad</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Eventos comerciales y evidencias del cliente
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar en actividad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="h-3.5 w-3.5 text-zinc-400" />}
                  />
                </div>

                <div className="w-32">
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={[
                      { label: "Tipo: Todos", value: "Todos" },
                      { label: "Visitas", value: "Visitas" },
                      { label: "Pagos", value: "Pagos" },
                      { label: "Pedidos", value: "Pedidos" },
                    ]}
                  />
                </div>

                <div className="w-36">
                  <Select
                    value={responsableFilter}
                    onChange={(e) => setResponsableFilter(e.target.value)}
                    options={[
                      { label: "Responsable: Todos", value: "Todos" },
                      { label: "Ana Torres", value: "Ana Torres" },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 h-9">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <span>01 – 16 oct. 2026</span>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="space-y-4 pt-2">
                {/* Day 1: Hoy · 16 oct. 2026 */}
                <div className="space-y-3">
                  <div className="bg-zinc-100/80 px-3 py-1.5 rounded-md text-2xs font-bold text-zinc-700">
                    Hoy · 16 oct. 2026
                  </div>

                  <div className="space-y-3 pl-2 sm:pl-3">
                    {/* Event 1: Visita completada */}
                    <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xs font-semibold text-zinc-400 mt-1 w-10 shrink-0">
                          09:45
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-zinc-950">Visita completada</span>
                          </div>
                          <p className="text-2xs text-zinc-500">Ana Torres</p>
                          <p className="text-2xs text-zinc-600">
                            Check-in 09:10 · Check-out 09:45 · Resultado:{" "}
                            <strong className="text-zinc-800">Con pedido</strong>
                          </p>
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-2xs font-medium border border-zinc-200">
                              <ImageIcon className="h-3 w-3 text-zinc-500" /> 2 evidencias
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/comercial/visitas-jornadas/"
                        className="flex items-center gap-1 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline shrink-0 pt-1"
                      >
                        <span>Ver visita</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Event 2: Pago reportado */}
                    <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xs font-semibold text-zinc-400 mt-1 w-10 shrink-0">
                          09:35
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-950">Pago reportado</span>
                          <p className="text-2xs text-zinc-500">Ana Torres</p>
                          <p className="text-2xs text-zinc-600">
                            PED-1042 · BCP · OP 845219 · S/ 1,440
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-2xs font-medium border border-zinc-200">
                              <Clock className="h-3 w-3 text-zinc-500" /> Esperando archivo
                            </span>
                          </div>
                          <p className="text-2xs text-zinc-400 mt-0.5">
                            Comprobante pendiente de conciliación.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/comercial/ventas/pedidos/ped-1042/"
                        className="flex items-center gap-1 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline shrink-0 pt-1"
                      >
                        <span>Ver pedido</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Day 2: Ayer · 15 oct. 2026 */}
                <div className="space-y-3 pt-2">
                  <div className="bg-zinc-100/80 px-3 py-1.5 rounded-md text-2xs font-bold text-zinc-700">
                    Ayer · 15 oct. 2026
                  </div>

                  <div className="space-y-3 pl-2 sm:pl-3">
                    {/* Event 3: Pedido registrado */}
                    <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xs font-semibold text-zinc-400 mt-1 w-10 shrink-0">
                          16:20
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-950">Pedido registrado</span>
                          <p className="text-2xs text-zinc-600">
                            PED-1042 · 8 unidades aceptadas · S/ 1,440
                          </p>
                          <p className="text-2xs text-amber-600 font-medium">
                            2 unidades de demanda no atendida.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/comercial/ventas/pedidos/ped-1042/"
                        className="flex items-center gap-1 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline shrink-0 pt-1"
                      >
                        <span>Ver pedido</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Event 4: Cotización enviada */}
                    <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xs font-semibold text-zinc-400 mt-1 w-10 shrink-0">
                          16:05
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-950">Cotización enviada</span>
                          <p className="text-2xs text-zinc-600">COT-1042 · S/ 1,440</p>
                        </div>
                      </div>

                      <Link
                        href="/comercial/ventas/cotizaciones/cot-1042/"
                        className="flex items-center gap-1 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline shrink-0 pt-1"
                      >
                        <span>Ver cotización</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Day 3: 10 oct. 2026 */}
                <div className="space-y-3 pt-2">
                  <div className="bg-zinc-100/80 px-3 py-1.5 rounded-md text-2xs font-bold text-zinc-700">
                    10 oct. 2026
                  </div>

                  <div className="space-y-3 pl-2 sm:pl-3">
                    {/* Event 5: Visita sin compra */}
                    <div className="flex items-start justify-between gap-3 p-3 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xs font-semibold text-zinc-400 mt-1 w-10 shrink-0">
                          11:30
                        </span>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-950">Visita sin compra</span>
                          <p className="text-2xs text-zinc-500">Ana Torres</p>
                          <p className="text-2xs text-zinc-600">Motivo: Aún cuenta con stock.</p>
                        </div>
                      </div>

                      <Link
                        href="/comercial/visitas-jornadas/"
                        className="flex items-center gap-1 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline shrink-0 pt-1"
                      >
                        <span>Ver visita</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Widgets */}
        <div className="space-y-4">
          {/* Widget 1: Última visita */}
          <Card className="shadow-xs border-zinc-200">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-zinc-900 border-b border-zinc-100 pb-2">
                Última visita
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-800">
                  <MapPin className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="font-semibold">16 oct. 2026 · 09:45</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-800">
                  <User className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span>Ana Torres</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-800">
                  <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span>Con pedido</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget 2: Evidencias recientes */}
          <Card className="shadow-xs border-zinc-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-bold text-zinc-900">Evidencias recientes</h3>
                <Link
                  href="/comercial/visitas-jornadas/"
                  className="flex items-center gap-0.5 text-2xs font-semibold text-zinc-800 hover:text-zinc-950 hover:underline"
                >
                  <span>Ver evidencias</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {/* Photo 1 */}
                <div className="space-y-1.5">
                  <div className="h-32 rounded-lg bg-zinc-900 text-zinc-100 flex flex-col justify-end p-3 relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                    <div className="relative z-20 flex items-center justify-between">
                      <span className="text-xs font-bold text-white drop-shadow-xs">Exhibición</span>
                      <span className="text-2xs text-zinc-300">16 oct. 2026 · 09:40</span>
                    </div>
                  </div>
                </div>

                {/* Photo 2 */}
                <div className="space-y-1.5">
                  <div className="h-32 rounded-lg bg-zinc-800 text-zinc-100 flex flex-col justify-end p-3 relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                    <div className="relative z-20 flex items-center justify-between">
                      <span className="text-xs font-bold text-white drop-shadow-xs">Góndola</span>
                      <span className="text-2xs text-zinc-300">16 oct. 2026 · 09:40</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget 3: Notice banner */}
          <div className="p-3 bg-zinc-100/90 border border-zinc-200/80 rounded-lg flex items-center gap-2.5 text-2xs text-zinc-700">
            <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Info className="h-3 w-3" />
            </div>
            <span>Actividad registrada en la plataforma comercial.</span>
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
