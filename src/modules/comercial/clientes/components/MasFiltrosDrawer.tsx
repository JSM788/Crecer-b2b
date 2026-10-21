"use client";

import React, { useState } from "react";
import { SideDrawer } from "@/shared/components/ui/side-drawer";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/select";

interface MasFiltrosDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: { seller: string; status: string; lastPurchase: string }) => void;
  /** Seller names present in the data; the "Todos" option is added here. */
  sellers: string[];
}

export const MasFiltrosDrawer: React.FC<MasFiltrosDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  sellers,
}) => {
  const [seller, setSeller] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [lastPurchase, setLastPurchase] = useState("Cualquier fecha");

  const handleApply = () => {
    onApply({ seller, status, lastPurchase });
    onClose();
  };

  const handleClear = () => {
    setSeller("Todos");
    setStatus("Todos");
    setLastPurchase("Cualquier fecha");
    onApply({ seller: "Todos", status: "Todos", lastPurchase: "Cualquier fecha" });
    onClose();
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Más filtros"
      footer={
        <div className="flex flex-col w-full gap-2.5">
          <Button onClick={handleApply} className="w-full">
            Aplicar filtros
          </Button>
          <Button onClick={handleClear} variant="secondary" className="w-full">
            Limpiar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
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
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
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
          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
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
    </SideDrawer>
  );
};
