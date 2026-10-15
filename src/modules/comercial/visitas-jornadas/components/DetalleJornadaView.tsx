"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Coffee,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/shared/patterns/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";

export const DetalleJornadaView: React.FC = () => {
  const [isFinalizada, setIsFinalizada] = useState(false);

  const itinerario = [
    {
      num: 1,
      client: "Pet Market",
      time: "09:00 - 10:00",
      status: "Completada",
      active: false,
    },
    {
      num: 2,
      client: "Mundo Animal",
      time: "11:00 - 12:00",
      status: "Pendiente Check-in",
      active: true,
    },
    {
      num: 3,
      client: "Mascotas y Más",
      time: "14:00 - 15:00",
      status: "Pendiente",
      active: false,
    },
    {
      num: 4,
      client: "Vet Center La Molina",
      time: "16:00 - 17:00",
      status: "Pendiente",
      active: false,
    },
    {
      num: 5,
      client: "Distribuidora Patitas",
      time: "17:30 - 18:00",
      status: "Pendiente",
      active: false,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Comercial", href: "/comercial/clientes/" },
          { label: "Visitas y jornadas", href: "/comercial/visitas-jornadas/" },
          { label: "Jornadas", href: "/comercial/visitas-jornadas/" },
          { label: "Ana Torres" },
        ]}
        title="Jornada de Ana Torres"
        subtitle="Jueves, 16 de octubre de 2026"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="info">En jornada</Badge>
              <span className="text-xs text-zinc-500 font-medium">2 / 5 visitas</span>
            </div>
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Coffee className="h-3.5 w-3.5" /> Refrigerio
            </Button>
            <Button
              size="sm"
              onClick={() => setIsFinalizada(true)}
              disabled={isFinalizada}
            >
              {isFinalizada ? "Jornada finalizada" : "Finalizar jornada"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Itinerario & Events */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                Itinerario del día (5)
              </h3>

              <div className="space-y-2.5">
                {itinerario.map((item) => (
                  <div
                    key={item.num}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-xs font-bold">
                        {item.num}
                      </span>
                      <div>
                        <Link
                          href="/comercial/visitas-jornadas/visita-activa/"
                          className="font-semibold text-xs text-zinc-900 hover:underline"
                        >
                          {item.client}
                        </Link>
                        <p className="text-2xs text-zinc-400">{item.time}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === "Completada" ? (
                        <span className="flex items-center gap-1 text-2xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Completada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-2xs text-zinc-500">
                          <Circle className="h-3 w-3" /> {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Último Evento */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">
                Último evento
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-zinc-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Pet Market</p>
                    <p className="text-2xs text-zinc-500">Se registró foto de góndola.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-2xs text-zinc-400">
                  <span>09:45</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Línea de tiempo de eventos */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">
                Línea de tiempo de eventos
              </h4>

              <div className="space-y-3 text-xs pl-2 border-l border-zinc-200 ml-1">
                <div className="relative pl-3">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-900 ring-2 ring-white" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-zinc-900">
                      Check-in en Pet Market
                    </span>
                    <span className="text-2xs text-zinc-400">09:00</span>
                  </div>
                  <p className="text-2xs text-zinc-500">Jornada iniciada.</p>
                </div>

                <div className="relative pl-3">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-900 ring-2 ring-white" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-zinc-900">
                      Registro de evidencia
                    </span>
                    <span className="text-2xs text-zinc-400">09:45</span>
                  </div>
                  <p className="text-2xs text-zinc-500">Se subió una foto de góndola.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mapa y Acciones de Gerencia */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-900">
                Ubicaciones por eventos
              </h3>

              {/* Map Canvas Representation */}
              <div className="h-72 rounded-lg bg-zinc-100 border border-zinc-200 relative overflow-hidden flex items-center justify-center p-4">
                {/* Simulated Street Grid */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    1
                  </div>
                  <span className="text-2xs font-semibold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1">
                    Pet Market
                  </span>
                </div>

                <div className="absolute top-1/2 left-2/3 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-zinc-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    2
                  </div>
                  <span className="text-2xs font-semibold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1">
                    Mundo Animal
                  </span>
                </div>

                <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-zinc-400 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    3
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-2xs font-semibold text-zinc-700 shadow-xs border border-zinc-200">
                  San Borja - Lima
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Gerencia */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-900">
                Acciones de gerencia
              </h3>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                <div>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <UserCheck className="h-4 w-4" /> Reasignar pendientes
                  </Button>
                  <p className="text-2xs text-zinc-500 mt-2">
                    Permite reasignar las visitas pendientes de esta jornada a otro ejecutivo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
