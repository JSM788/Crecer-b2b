"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";

export interface MasFiltrosValue {
  seller: string;
  status: string;
  lastPurchase: string;
}

interface MasFiltrosPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: MasFiltrosValue) => void;
  /** Seller names present in the data; the "Todos" option is added here. */
  sellers: string[];
  /** Filters currently applied, so the popover reopens showing them. */
  current?: MasFiltrosValue;
}

const DEFAULTS: MasFiltrosValue = {
  seller: "Todos",
  status: "Todos",
  lastPurchase: "Cualquier fecha",
};

export const MasFiltrosPopover: React.FC<MasFiltrosPopoverProps> = ({
  isOpen,
  onClose,
  onApply,
  sellers,
  current = DEFAULTS,
}) => {
  const [seller, setSeller] = useState(current.seller);
  const [status, setStatus] = useState(current.status);
  const [lastPurchase, setLastPurchase] = useState(current.lastPurchase);

  // Sync the draft with the applied filters each time the popover opens.
  useEffect(() => {
    if (!isOpen) return;
    setSeller(current.seller);
    setStatus(current.status);
    setLastPurchase(current.lastPurchase);
  }, [isOpen, current.seller, current.status, current.lastPurchase]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({ seller, status, lastPurchase });
    onClose();
  };

  const handleClear = () => {
    setSeller(DEFAULTS.seller);
    setStatus(DEFAULTS.status);
    setLastPurchase(DEFAULTS.lastPurchase);
    onApply(DEFAULTS);
    onClose();
  };

  return (
    <>
      {/* Invisible backdrop to dismiss popover when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Floating Popover anchored directly relative to the filters */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-xs font-semibold text-zinc-900">Más filtros</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-3.5 max-h-80 overflow-y-auto text-xs">
          <div>
            <label className="block text-2xs font-semibold text-zinc-600 mb-1">
              Vendedor
            </label>
            <Select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              options={[
                { label: "Todos los vendedores", value: "Todos" },
                ...sellers.map((name) => ({ label: name, value: name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-zinc-600 mb-1">
              Estado
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: "Todos los estados", value: "Todos" },
                { label: "Al día", value: "Al día" },
                { label: "Con atraso", value: "Con atraso" },
              ]}
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-zinc-600 mb-1">
              Última compra
            </label>
            <Select
              value={lastPurchase}
              onChange={(e) => setLastPurchase(e.target.value)}
              options={[
                { label: "Cualquier fecha", value: "Cualquier fecha" },
                { label: "Últimos 7 días", value: "7_dias" },
                { label: "Últimos 30 días", value: "30_dias" },
                { label: "Más de 3 meses", value: "3_meses" },
              ]}
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-2">
          <Button onClick={handleApply} size="sm" className="w-full text-xs h-8">
            Aplicar filtros
          </Button>
          <Button
            onClick={handleClear}
            variant="secondary"
            size="sm"
            className="w-full text-xs h-8"
          >
            Limpiar
          </Button>
        </div>
      </div>
    </>
  );
};
