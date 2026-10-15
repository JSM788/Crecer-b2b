"use client";

import React from "react";
import Link from "next/link";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { MapPin, ShoppingBag, Calendar, User, Camera } from "lucide-react";
import { RegistroVisita } from "../models/visita.model";

interface RegistroVisitaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  registro: RegistroVisita | null;
}

export const RegistroVisitaDrawer: React.FC<RegistroVisitaDrawerProps> = ({
  isOpen,
  onClose,
  registro,
}) => {
  if (!registro) return null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Visita ${registro.code}`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Link href="/comercial/clientes/cl-001/">
            <Button>Ver cliente</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Client Top Card */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-zinc-900">{registro.clientName}</span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Calendar className="h-3.5 w-3.5" /> {registro.date}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-500">
            <span>RUC 20601234567</span>
            <span className="flex items-center gap-1 text-zinc-700">
              <User className="h-3.5 w-3.5" /> {registro.seller}
            </span>
          </div>
        </div>

        {/* Times & Duration KPI Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg border border-zinc-200 text-center bg-white">
            <span className="text-2xs text-zinc-400 block">Llegada</span>
            <span className="font-semibold text-zinc-900 text-xs">{registro.checkIn}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-zinc-200 text-center bg-white">
            <span className="text-2xs text-zinc-400 block">Salida</span>
            <span className="font-semibold text-zinc-900 text-xs">{registro.checkOut}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-zinc-200 text-center bg-white">
            <span className="text-2xs text-zinc-400 block">Duración</span>
            <span className="font-semibold text-zinc-900 text-xs">{registro.duration}</span>
          </div>
        </div>

        {/* Photographic Evidence */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            Evidencia fotográfica
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-28 rounded-lg bg-zinc-800 text-white p-2 flex flex-col justify-between relative overflow-hidden">
              <div className="bg-black/60 backdrop-blur-xs p-1 rounded text-2xs inline-block self-start">
                16 oct. 2026 09:24 | San Borja
              </div>
              <div className="flex items-center gap-1 text-2xs text-emerald-400">
                <MapPin className="h-3 w-3" /> GPS registrado
              </div>
            </div>

            <div className="h-28 rounded-lg bg-zinc-800 text-white p-2 flex flex-col justify-between relative overflow-hidden">
              <div className="bg-black/60 backdrop-blur-xs p-1 rounded text-2xs inline-block self-start">
                16 oct. 2026 09:24 | San Borja
              </div>
              <div className="flex items-center gap-1 text-2xs text-emerald-400">
                <MapPin className="h-3 w-3" /> GPS registrado
              </div>
            </div>
          </div>
        </div>

        {/* GPS location card */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-xs font-semibold text-zinc-900">Ubicación y precisión GPS</p>
              <p className="text-2xs text-zinc-500">-12.0958, -76.9852 (Precisión: 12 m)</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="h-7 text-xs">
            Ver en mapa
          </Button>
        </div>

        {/* Observations */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1">
            Observaciones
          </label>
          <p className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 text-xs">
            {registro.observations}
          </p>
        </div>

        {/* Linked Order */}
        {registro.orderCode && (
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Pedido vinculado
            </label>
            <Link
              href={`/comercial/ventas/pedidos/${registro.orderCode.toLowerCase()}/`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-md font-semibold text-xs transition-colors"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {registro.orderCode}
            </Link>
          </div>
        )}
      </div>
    </SideDrawer>
  );
};
