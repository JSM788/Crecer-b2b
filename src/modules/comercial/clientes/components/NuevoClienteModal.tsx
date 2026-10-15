"use client";

import React, { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

interface NuevoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (cliente: any) => void;
}

export const NuevoClienteModal: React.FC<NuevoClienteModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [district, setDistrict] = useState("San Borja");
  const [address, setAddress] = useState("");
  const [seller, setSeller] = useState("Ana Torres");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({ name, ruc, district, address, seller });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo cliente"
      subtitle="Ingresa los datos para registrar un cliente en cartera"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} size="sm">
            Crear cliente
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Razón Social / Nombre Comercial *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Veterinaria El Bosque SAC"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              RUC *
            </label>
            <Input
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="20123456789"
              maxLength={11}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Distrito *
            </label>
            <Select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              options={[
                { label: "San Borja", value: "San Borja" },
                { label: "Miraflores", value: "Miraflores" },
                { label: "Santiago de Surco", value: "Santiago de Surco" },
                { label: "San Miguel", value: "San Miguel" },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Dirección completa
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Principal 123, Urb. Primavera"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Vendedor responsable
          </label>
          <Select
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            options={[
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Carlos Rojas", value: "Carlos Rojas" },
              { label: "Lucía Mendoza", value: "Lucía Mendoza" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
};
