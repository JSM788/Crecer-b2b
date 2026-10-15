"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MaterialPOP } from "../models/solicitud.model";

interface MaterialPOPTableProps {
  materiales: MaterialPOP[];
  onOpenNew?: () => void;
}

export const MaterialPOPTable: React.FC<MaterialPOPTableProps> = ({
  materiales,
  onOpenNew,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [brand, setBrand] = useState("Todas");
  const [seller, setSeller] = useState("Todos");

  const filtered = materiales.filter((m) => {
    const matchesSearch =
      !search ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "Todos" || m.status === status;
    const matchesBrand = brand === "Todas" || m.brand === brand;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  const columns: Column<MaterialPOP>[] = [
    {
      header: "Solicitud",
      accessorKey: "code",
      cell: (row) => <span className="font-semibold text-zinc-900">{row.code}</span>,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      cell: (row) => <span className="font-medium text-zinc-900">{row.clientName}</span>,
    },
    {
      header: "Material",
      accessorKey: "material",
    },
    {
      header: "Marca",
      cell: (row) => (
        <span className="font-semibold text-zinc-800">
          {row.brand || "—"}
        </span>
      ),
    },
    {
      header: "Cantidad",
      accessorKey: "quantity",
      cell: (row) => <span className="font-medium">{row.quantity}</span>,
    },
    {
      header: "Estado",
      cell: (row) => {
        const variant =
          row.status === "Aprobada"
            ? "success"
            : row.status === "Pendiente"
            ? "warning"
            : "danger";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <Button size="sm" variant="secondary" className="h-7 text-xs px-3">
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar solicitudes, cliente..."
      >
        <div className="w-36">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Pendiente", value: "Pendiente" },
              { label: "Aprobada", value: "Aprobada" },
            ]}
          />
        </div>

        <div className="w-36">
          <Select
            label="Marca"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            options={[
              { label: "Todas", value: "Todas" },
              { label: "Bravery", value: "Bravery" },
              { label: "Royal Canin", value: "Royal Canin" },
              { label: "Pro Plan", value: "Pro Plan" },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            label="Vendedor"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        entityName="solicitudes"
      />
    </div>
  );
};
