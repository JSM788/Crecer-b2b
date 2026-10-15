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
      width: "30%",
      cell: (row) => (
        <div>
          <Link
            href={`/comercial/clientes/${row.id}/`}
            className="font-semibold text-zinc-900 hover:underline block"
          >
            {row.name}
          </Link>
          <span className="text-2xs text-zinc-400 font-normal">{row.code}</span>
        </div>
      ),
    },
    {
      header: "Distrito",
      accessorKey: "district",
      width: "22%",
      cell: (row) => <span className="font-medium text-zinc-800">{row.district}</span>,
    },
    {
      header: "Responsable",
      width: "22%",
      cell: (row) => (
        <span
          className={
            row.seller === "Sin asignar" ? "text-amber-600 font-semibold" : "text-zinc-700 font-medium"
          }
        >
          {row.seller}
        </span>
      ),
    },
    {
      header: "Zona",
      accessorKey: "zone",
      width: "18%",
      cell: (row) => <span className="text-zinc-600">{row.zone}</span>,
    },
    {
      header: "",
      width: "8%",
      className: "text-center",
      cell: (row) => (
        <Link
          href={`/comercial/clientes/${row.id}/`}
          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 inline-block transition-colors"
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

      {/* Floating Bottom Action Bar for Bulk Assignment matching Clientes-Asignacion-2.png */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-zinc-200/90 shadow-xl rounded-xl px-4 py-2.5 flex items-center justify-between gap-8 min-w-[340px] sm:min-w-[420px]">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-900">
            <div className="w-4 h-4 rounded bg-[#27272a] text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <span>
              {selectedIds.length} {selectedIds.length === 1 ? "cliente seleccionado" : "clientes seleccionados"}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAsignarOpen(true)}
            className="text-xs font-semibold h-8 bg-[#27272a] hover:bg-zinc-800 text-white px-4 rounded-lg"
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
