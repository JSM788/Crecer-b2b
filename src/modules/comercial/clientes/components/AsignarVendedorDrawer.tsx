"use client";

import React, { useState } from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";
import { Cliente } from "../models/cliente.model";

interface AsignarVendedorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientes: Cliente[];
  onConfirm: (seller: string) => void;
}

export const AsignarVendedorDrawer: React.FC<AsignarVendedorDrawerProps> = ({
  isOpen,
  onClose,
  selectedClientes,
  onConfirm,
}) => {
  const [selectedSeller, setSelectedSeller] = useState("Ana Torres");
  const [scope, setScope] = useState("Cartera seleccionada");

  const primaryClient = selectedClientes[0];

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar vendedor"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} className="px-5">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(selectedSeller);
              onClose();
            }}
            className="px-5"
          >
            Confirmar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">
            Cliente seleccionado
          </label>
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <p className="text-sm font-semibold text-zinc-900">
              {primaryClient ? primaryClient.name : "Varios clientes seleccionados"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {primaryClient
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
            options={[
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Carlos Rojas", value: "Carlos Rojas" },
              { label: "Lucía Mendoza", value: "Lucía Mendoza" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
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
              { label: "Cartera seleccionada", value: "Cartera seleccionada" },
              { label: "Todas las tiendas del RUC", value: "Todas las tiendas del RUC" },
            ]}
          />
          <p className="text-2xs text-zinc-400 mt-1.5">
            Se asignará el vendedor al cliente seleccionado.
          </p>
        </div>
      </div>
    </SideDrawer>
  );
};
