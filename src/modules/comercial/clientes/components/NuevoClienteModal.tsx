"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

export interface NuevoClienteData {
  name: string;
  ruc: string;
  district: string;
  address: string;
  seller: string;
}

interface NuevoClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: NuevoClienteData) => void;
  /** Districts and sellers already present in the master data. */
  districts: string[];
  sellers: string[];
  /** RUCs already registered, to reject duplicates. */
  existingRucs: string[];
}

const FORM_ID = "nuevo-cliente-form";

export const NuevoClienteModal: React.FC<NuevoClienteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  districts,
  sellers,
  existingRucs,
}) => {
  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [seller, setSeller] = useState("");
  const [error, setError] = useState("");

  // Every time the modal opens, start from a clean form with valid select values.
  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setRuc("");
    setAddress("");
    setError("");
    setDistrict(districts[0] ?? "");
    setSeller(sellers[0] ?? "");
    // Only re-run when the modal opens, not when the data lists change underneath.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ingresa la razón social o nombre comercial.");
      return;
    }
    if (!/^\d{11}$/.test(ruc.trim())) {
      setError("El RUC debe tener 11 dígitos.");
      return;
    }
    if (existingRucs.includes(ruc.trim())) {
      setError("Ya existe un cliente registrado con ese RUC.");
      return;
    }
    onSave({ name: name.trim(), ruc: ruc.trim(), district, address: address.trim(), seller });
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
          <Button type="button" variant="secondary" onClick={onClose} size="sm">
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} size="sm">
            Crear cliente
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
              placeholder="20123456789"
              maxLength={11}
              inputMode="numeric"
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
              options={districts.map((d) => ({ label: d, value: d }))}
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
            options={sellers.map((s) => ({ label: s, value: s }))}
          />
        </div>

        {error && (
          <p role="alert" className="text-2xs font-medium text-red-600">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
};
