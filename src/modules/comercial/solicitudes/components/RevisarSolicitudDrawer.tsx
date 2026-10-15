"use client";

import React, { useState } from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { VisitaExtraordinaria } from "../models/solicitud.model";

interface RevisarSolicitudDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: VisitaExtraordinaria | null;
  onDecide?: (action: "aprobar" | "rechazar", notes: string) => void;
}

export const RevisarSolicitudDrawer: React.FC<RevisarSolicitudDrawerProps> = ({
  isOpen,
  onClose,
  solicitud,
  onDecide,
}) => {
  const [notes, setNotes] = useState(
    "Se aprueba la visita para evaluar oportunidad de nuevos productos."
  );

  if (!solicitud) return null;

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${solicitud.code} · Visita extraordinaria`}
      subtitle={`Estado: ${solicitud.status}`}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => {
              onDecide?.("rechazar", notes);
              onClose();
            }}
          >
            Rechazar
          </Button>
          <Button
            onClick={() => {
              onDecide?.("aprobar", notes);
              onClose();
            }}
          >
            Aprobar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Cliente</span>
            <span className="font-semibold text-zinc-900">{solicitud.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Solicitante</span>
            <span className="text-zinc-800">{solicitud.seller}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Fecha solicitada</span>
            <span className="text-zinc-800">
              {solicitud.date}, {solicitud.hour}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Territorio</span>
            <span className="text-zinc-800">{solicitud.reason}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-800 mb-1">
            Justificación
          </label>
          <p className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700">
            {solicitud.justification}
          </p>
        </div>

        {/* Sección Decisión */}
        <div className="pt-2 border-t border-zinc-100 space-y-2">
          <h4 className="font-semibold text-zinc-900">Decisión</h4>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-zinc-700">
                Observaciones *
              </label>
              <span className="text-2xs text-zinc-400">{notes.length}/250</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={250}
              className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded text-2xs text-zinc-500">
            <AlertCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>La decisión quedará registrada en el historial.</span>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
};
