"use client";

import React from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Gasto } from "../models/gasto.model";
import { formatCurrency } from "@/shared/lib/utils";

interface DetalleGastoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: Gasto | null;
}

export const DetalleGastoDrawer: React.FC<DetalleGastoDrawerProps> = ({
  isOpen,
  onClose,
  gasto,
}) => {
  if (!gasto) return null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${gasto.code} · ${gasto.category}`}
      subtitle={`Estado: ${gasto.status}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-2xs text-zinc-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Revisión según permisos.</span>
          </div>
          <Button variant="secondary" onClick={onClose} size="sm">
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Vendedor</span>
            <span className="font-semibold text-zinc-900">{gasto.seller}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Jornada</span>
            <span className="text-zinc-800">{gasto.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Categoría</span>
            <span className="text-zinc-800">{gasto.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">RUC proveedor</span>
            <span className="text-zinc-800">{gasto.rucProvider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Monto</span>
            <span className="font-bold text-zinc-900">{formatCurrency(gasto.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Fecha</span>
            <span className="text-zinc-800">{gasto.date}, {gasto.hour || "09:42"}</span>
          </div>
        </div>

        {/* Comprobante Ticket */}
        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
            Comprobante
          </label>
          <div className="p-4 bg-zinc-100 border border-zinc-300 rounded-lg text-center font-mono text-zinc-800 space-y-1 max-w-[240px] mx-auto shadow-xs">
            <p className="font-bold text-sm">RUTAS DEL SUR</p>
            <p className="text-2xs">PEAJE</p>
            <p className="font-bold text-base my-2">{formatCurrency(gasto.total)}</p>
            <p className="text-2xs text-zinc-500">{gasto.date} 09:42</p>
            <p className="text-2xs text-zinc-400">Vía 3</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1">
            Observaciones
          </label>
          <p className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700">
            {gasto.observations}
          </p>
        </div>

        {/* Historial */}
        <div className="pt-2 border-t border-zinc-100">
          <label className="block text-xs font-semibold text-zinc-800 mb-2">
            Historial
          </label>
          <div className="flex items-start gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
            <div>
              <p className="font-medium text-zinc-900">Registrado por {gasto.seller}</p>
              <p className="text-2xs text-zinc-400">{gasto.date}, 09:50</p>
            </div>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
};
