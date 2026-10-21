"use client";

import React, { useEffect, useState } from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Cliente } from "../models/cliente.model";

export const SCOPE_SELECTED = "Cartera seleccionada";
export const SCOPE_SAME_RUC = "Todas las tiendas del RUC";

interface AsignarVendedorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientes: Cliente[];
  /** Seller names present in the data. */
  sellers: string[];
  onConfirm: (seller: string, scope: string) => void;
}

export const AsignarVendedorDrawer: React.FC<AsignarVendedorDrawerProps> = ({
  isOpen,
  onClose,
  selectedClientes,
  sellers,
  onConfirm,
}) => {
  const [selectedSeller, setSelectedSeller] = useState("");
  const [scope, setScope] = useState(SCOPE_SELECTED);

  const primaryClient = selectedClientes[0];

  // Open with the current responsible selected, falling back to the first seller.
  const primarySeller = primaryClient?.seller;
  useEffect(() => {
    if (!isOpen) return;
    setSelectedSeller(primarySeller && sellers.includes(primarySeller) ? primarySeller : sellers[0] ?? "");
    setScope(SCOPE_SELECTED);
  }, [isOpen, primarySeller, sellers]);

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar vendedor"
      footer={
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Cancelar
          </Button>
          <Button
            disabled={!selectedSeller}
            onClick={() => {
              onConfirm(selectedSeller, scope);
              onClose();
            }}
            className="w-full bg-[#27272a] hover:bg-zinc-800 text-white font-medium"
          >
            Confirmar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            {selectedClientes.length > 1 ? "Clientes seleccionados" : "Cliente seleccionado"}
          </label>
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-lg">
            <p className="text-sm font-semibold text-zinc-900">
              {selectedClientes.length === 1 && primaryClient
                ? primaryClient.name
                : `${selectedClientes.length} clientes seleccionados`}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {selectedClientes.length === 1 && primaryClient
                ? `${primaryClient.code} · ${primaryClient.district}`
                : `${selectedClientes.length} clientes en lista`}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Vendedor
          </label>
          <Select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            options={sellers.map((name) => ({ label: name, value: name }))}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
            Alcance
          </label>
          <Select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            options={[
              { label: SCOPE_SELECTED, value: SCOPE_SELECTED },
              { label: SCOPE_SAME_RUC, value: SCOPE_SAME_RUC },
            ]}
          />
          <p className="text-2xs text-zinc-400 mt-1.5">
            {scope === SCOPE_SAME_RUC
              ? "Se asignará el vendedor a todas las tiendas que comparten el RUC."
              : "Se asignará el vendedor a los clientes seleccionados."}
          </p>
        </div>
      </div>
    </SideDrawer>
  );
};
