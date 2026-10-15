"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreVertical, CheckSquare } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Cliente } from "../models/cliente.model";
import { AsignarVendedorDrawer } from "./AsignarVendedorDrawer";

interface ClientesAsignacionesTableProps {
  clientes: Cliente[];
}

export const ClientesAsignacionesTable: React.FC<ClientesAsignacionesTableProps> = ({
  clientes: initialClientes,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState("Todos");
  const [zone, setZone] = useState("Todas");
  const [selectedIds, setSelectedIds] = useState<string[]>(["cl-001"]);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);

  const filteredData = clientes.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesSeller = seller === "Todos" || c.seller === seller;
    const matchesZone = zone === "Todas" || c.zone === zone;

    return matchesSearch && matchesSeller && matchesZone;
  });

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((c) => c.id));
    }
  };

  const handleAssignSeller = (newSeller: string) => {
    setClientes((prev) =>
      prev.map((c) => (selectedIds.includes(c.id) ? { ...c, seller: newSeller } : c))
    );
    setSelectedIds([]);
  };

  const selectedClientes = clientes.filter((c) => selectedIds.includes(c.id));

  const columns: Column<Cliente>[] = [
    {
      header: "Tienda",
      sortable: true,
      cell: (row) => (
        <div>
          <Link
            href={`/comercial/clientes/${row.id}/`}
            className="font-semibold text-zinc-900 hover:underline block"
          >
            {row.name}
          </Link>
          <span className="text-2xs text-zinc-400">{row.code}</span>
        </div>
      ),
    },
    {
      header: "Distrito",
      accessorKey: "district",
    },
    {
      header: "Responsable",
      cell: (row) => (
        <span
          className={
            row.seller === "Sin asignar" ? "text-amber-600 font-medium" : "text-zinc-800"
          }
        >
          {row.seller}
        </span>
      ),
    },
    {
      header: "Zona",
      accessorKey: "zone",
    },
    {
      header: "",
      className: "w-10 text-right",
      cell: (row) => (
        <Link
          href={`/comercial/clientes/${row.id}/`}
          className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 inline-block"
          title="Ver ficha"
        >
          <MoreVertical className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4 relative pb-16">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o RUC..."
      >
        <div className="w-48">
          <Select
            label="Vendedor"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            options={[
              { label: "Todos los vendedores", value: "Todos" },
              { label: "Ana Torres", value: "Ana Torres" },
              { label: "Carlos Rojas", value: "Carlos Rojas" },
              { label: "Lucía Mendoza", value: "Lucía Mendoza" },
              { label: "Luis Ramos", value: "Luis Ramos" },
            ]}
          />
        </div>
        <div className="w-44">
          <Select
            label="Zona"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            options={[
              { label: "Todas las zonas", value: "Todas" },
              { label: "Lima Centro", value: "Lima Centro" },
              { label: "Lima Sur", value: "Lima Sur" },
              { label: "Lima Oeste", value: "Lima Oeste" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        entityName="clientes"
      />

      {/* Floating Bottom Action Bar for Bulk Assignment */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-6 border border-zinc-700">
          <div className="flex items-center gap-2 text-xs font-medium">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>
              {selectedIds.length} {selectedIds.length === 1 ? "cliente seleccionado" : "clientes seleccionados"}
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsAsignarOpen(true)}
            className="text-xs font-semibold h-7 bg-white text-zinc-900 hover:bg-zinc-100"
          >
            Asignar vendedor
          </Button>
        </div>
      )}

      <AsignarVendedorDrawer
        isOpen={isAsignarOpen}
        onClose={() => setIsAsignarOpen(false)}
        selectedClientes={selectedClientes}
        onConfirm={handleAssignSeller}
      />
    </div>
  );
};
