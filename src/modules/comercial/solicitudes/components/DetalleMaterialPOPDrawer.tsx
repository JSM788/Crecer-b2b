"use client";

import React from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Info, Package } from "lucide-react";
import { MaterialPOP } from "../models/solicitud.model";

interface DetalleMaterialPOPDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  material: MaterialPOP | null;
}

export const DetalleMaterialPOPDrawer: React.FC<DetalleMaterialPOPDrawerProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  if (!material) return null;

  const isExhibidor =
    material.material.toLowerCase().includes("exhibidor") ||
    material.code.toLowerCase().includes("012");

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de solicitud POP"
      width="max-w-lg"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="secondary" onClick={onClose} className="px-6 text-xs h-9">
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Title & Badge */}
        <div className="pb-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-base font-extrabold text-zinc-950">{material.code}</span>
          <Badge
            variant={
              material.status === "Aprobada"
                ? "success"
                : material.status === "Pendiente"
                ? "warning"
                : "danger"
            }
          >
            {material.status}
          </Badge>
        </div>

        {/* Metadata Details */}
        <div className="space-y-2 py-1 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Cliente</span>
            <span className="font-semibold text-zinc-900">
              {material.clientName.includes("CL-")
                ? material.clientName
                : `${material.clientName} San Borja · CL-001`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Solicitante</span>
            <span className="text-zinc-800">Ana Torres · Comercial</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Fecha</span>
            <span className="text-zinc-800">16 oct. 2026 · 09:40</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Marca</span>
            <span className="font-semibold text-zinc-900">{material.brand || "Bravery"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Material</span>
            <span className="text-zinc-800">{material.material}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Cantidad</span>
            <span className="font-semibold text-zinc-900">
              {material.quantity} {material.quantity === 1 ? "unidad" : "unidades"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-500">Motivo</span>
            <span className="text-zinc-800">{material.reason || "Reforzar exhibición"}</span>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3 space-y-1.5">
          <h4 className="text-xs font-bold text-zinc-900">Observaciones</h4>
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg text-zinc-700 leading-relaxed">
            {material.observations ||
              "Solicita un exhibidor para mejorar la visibilidad de la marca en la entrada del local."}
          </div>
        </div>

        {/* Foto de referencia */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-zinc-900">Foto de referencia</h4>

          <div className="h-48 rounded-lg bg-zinc-900 border border-zinc-300 relative overflow-hidden flex flex-col justify-end p-4 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />

            {/* Stand Graphic Representation */}
            <div className="absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none">
              <div className="w-36 h-36 border border-zinc-700 bg-zinc-950/80 rounded-lg flex flex-col items-center justify-between p-2 shadow-2xl">
                <span className="text-2xs font-extrabold tracking-wider text-white bg-zinc-800 px-2 py-0.5 rounded uppercase">
                  {material.brand || "Bravery"}
                </span>
                <div className="grid grid-cols-2 gap-1 w-full px-1">
                  <div className="h-6 bg-zinc-800 rounded-sm flex items-center justify-center text-[9px] text-zinc-300">
                    Prod 1
                  </div>
                  <div className="h-6 bg-zinc-800 rounded-sm flex items-center justify-center text-[9px] text-zinc-300">
                    Prod 2
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 w-full px-1">
                  <div className="h-6 bg-zinc-800 rounded-sm flex items-center justify-center text-[9px] text-zinc-300">
                    Prod 3
                  </div>
                  <div className="h-6 bg-zinc-800 rounded-sm flex items-center justify-center text-[9px] text-zinc-300">
                    Prod 4
                  </div>
                </div>
                <span className="text-[8px] text-zinc-400">Exhibidor Oficial</span>
              </div>
            </div>

            <div className="relative z-20 flex items-center justify-between">
              <span className="text-xs font-bold text-white drop-shadow-xs">
                {material.material} {material.brand}
              </span>
              <span className="text-2xs text-zinc-300">Campaña retail</span>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="space-y-2.5 pt-2 border-t border-zinc-100">
          <h4 className="text-xs font-bold text-zinc-900">Historial</h4>

          <div className="space-y-2 pl-1">
            <div className="flex items-center gap-2.5 text-2xs text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0" />
              <span>16 oct. 2026 · 09:40 — Registrada desde la app comercial</span>
            </div>

            <div className="flex items-center gap-2.5 text-2xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
              <span>Pendiente de revisión</span>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-100/90 rounded-lg flex items-center gap-2 text-2xs text-zinc-600 mt-2">
            <Info className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span>La solicitud no confirma disponibilidad ni salida de inventario.</span>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
};
