"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";
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
  const [drawerClientes, setDrawerClientes] = useState<Cliente[]>([]);

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

  const selectedClientes = clientes.filter((c) => selectedIds.includes(c.id));

  const handleOpenSingleAssign = (cliente: Cliente) => {
    setDrawerClientes([cliente]);
    setIsAsignarOpen(true);
  };

  const handleOpenBulkAssign = () => {
    setDrawerClientes(selectedClientes);
    setIsAsignarOpen(true);
  };

  const handleAssignSeller = (newSeller: string) => {
    const idsToUpdate = drawerClientes.map((c) => c.id);
    setClientes((prev) =>
      prev.map((c) => (idsToUpdate.includes(c.id) ? { ...c, seller: newSeller } : c))
    );
    setSelectedIds((prev) => prev.filter((id) => !idsToUpdate.includes(id)));
    setDrawerClientes([]);
    setIsAsignarOpen(false);
  };

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
      width: "16%",
      cell: (row) => <span className="text-zinc-600">{row.zone}</span>,
    },
    {
      header: "Acción",
      width: "14%",
      className: "text-right",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleOpenSingleAssign(row)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/90 rounded-md transition-colors"
          title="Asignar comercial"
        >
          <UserCheck className="h-3.5 w-3.5 text-zinc-600" />
          <span>Asignar</span>
        </button>
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
            onClick={handleOpenBulkAssign}
            className="text-xs font-semibold h-8 bg-[#27272a] hover:bg-zinc-800 text-white px-4 rounded-lg"
          >
            Asignar vendedor
          </Button>
        </div>
      )}

      <AsignarVendedorDrawer
        isOpen={isAsignarOpen}
        onClose={() => {
          setIsAsignarOpen(false);
          setDrawerClientes([]);
        }}
        selectedClientes={drawerClientes}
        onConfirm={handleAssignSeller}
      />
    </div>
  );
};
