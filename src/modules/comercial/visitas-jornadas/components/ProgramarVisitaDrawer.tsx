"use client";

import React, { useState } from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";
import { AlertCircle } from "lucide-react";

interface ProgramarVisitaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const ProgramarVisitaDrawer: React.FC<ProgramarVisitaDrawerProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [client, setClient] = useState("Pet Market (RUC 20601234567)");
  const [seller, setSeller] = useState("Ana Torres");
  const [date, setDate] = useState("2026-10-16");
  const [time, setTime] = useState("09:00");
  const [objective, setObjective] = useState("Presentar promoción");
  const [territory, setTerritory] = useState("San Borja");
  const [notes, setNotes] = useState(
    "Revisar stock y presentar nueva promoción de alimentos premium."
  );
  const [outOfZone, setOutOfZone] = useState(false);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Programar visita"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave?.();
              onClose();
            }}
          >
            Guardar programación
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Cliente
          </label>
          <Input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Buscar cliente..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Vendedor
          </label>
          <Select
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            options={[
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Carlos Rojas", value: "Carlos Rojas" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Fecha
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Hora
            </label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Objetivo de la visita
            </label>
            <Select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              options={[
                { label: "Presentar promoción", value: "Presentar promoción" },
                { label: "Cobranza", value: "Cobranza" },
                { label: "Auditoría de stock", value: "Auditoría de stock" },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Territorio
            </label>
            <Select
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              options={[
                { label: "San Borja", value: "San Borja" },
                { label: "Miraflores", value: "Miraflores" },
                { label: "Surco", value: "Surco" },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Observaciones
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={outOfZone}
              onChange={(e) => setOutOfZone(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-4 w-4"
            />
            <span className="text-xs font-medium text-zinc-700">
              Visita fuera de zona
            </span>
          </label>

          {outOfZone && (
            <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Fuera de territorio: requiere aprobación previa.</span>
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
};
