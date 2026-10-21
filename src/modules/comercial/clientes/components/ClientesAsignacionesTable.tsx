"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { optionsFrom } from "@/shared/lib/options";
import { clienteTieneFicha, useDemo, useSellerNames } from "@/shared/state/demo-store";
import { Cliente } from "../models/cliente.model";
import { AsignarVendedorDrawer, SCOPE_SAME_RUC } from "./AsignarVendedorDrawer";

interface ClientesAsignacionesTableProps {
  clientes: Cliente[];
}

export const ClientesAsignacionesTable: React.FC<ClientesAsignacionesTableProps> = ({
  clientes,
}) => {
  const { asignarVendedor } = useDemo();
  const sellers = useSellerNames();
  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState("Todos");
  const [zone, setZone] = useState("Todas");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [drawerClienteIds, setDrawerClienteIds] = useState<string[]>([]);

  const sellerOptions = useMemo(
    () => optionsFrom(clientes.map((c) => c.seller), "Todos los vendedores"),
    [clientes]
  );
  const zoneOptions = useMemo(
    () =>
      optionsFrom(
        clientes.map((c) => c.zone),
        "Todas las zonas"
      ).map((o) => ({ ...o, value: o.value === "Todos" ? "Todas" : o.value })),
    [clientes]
  );

  const filteredData = clientes.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.ruc.includes(search);
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

  // Drawer clients are read live from the store so the summary never goes stale.
  const drawerClientes = clientes.filter((c) => drawerClienteIds.includes(c.id));

  const handleOpenSingleAssign = (cliente: Cliente) => {
    setDrawerClienteIds([cliente.id]);
    setIsAsignarOpen(true);
  };

  const handleOpenBulkAssign = () => {
    setDrawerClienteIds(selectedIds);
    setIsAsignarOpen(true);
  };

  const handleAssignSeller = (newSeller: string, scope: string) => {
    let idsToUpdate = drawerClienteIds;
    if (scope === SCOPE_SAME_RUC) {
      const rucs = new Set(drawerClientes.map((c) => c.ruc));
      idsToUpdate = clientes.filter((c) => rucs.has(c.ruc)).map((c) => c.id);
    }
    asignarVendedor(idsToUpdate, newSeller);
    setSelectedIds((prev) => prev.filter((id) => !idsToUpdate.includes(id)));
    setDrawerClienteIds([]);
    setIsAsignarOpen(false);
  };

  const columns: Column<Cliente>[] = [
    {
      header: "Tienda",
      sortable: true,
      width: "30%",
      cell: (row) => (
        <div>
          {clienteTieneFicha(row.id) ? (
            <Link
              href={`/comercial/clientes/${row.id}/`}
              className="font-semibold text-zinc-900 hover:underline block"
            >
              {row.name}
            </Link>
          ) : (
            <span className="font-semibold text-zinc-900 block">{row.name}</span>
          )}
          <span className="text-2xs text-zinc-400 font-normal">
            {row.code}
            {!clienteTieneFicha(row.id) && " · Ficha pendiente de sincronización"}
          </span>
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
            options={sellerOptions}
          />
        </div>
        <div className="w-44">
          <Select
            label="Zona"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            options={zoneOptions}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-zinc-200/90 shadow-xl rounded-xl px-4 py-2.5 flex items-center justify-between gap-8 min-w-80 sm:min-w-[26rem]">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-900">
            <div className="w-4 h-4 rounded bg-[#27272a] text-white flex items-center justify-center text-3xs font-bold">
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
          setDrawerClienteIds([]);
        }}
        selectedClientes={drawerClientes}
        sellers={sellers}
        onConfirm={handleAssignSeller}
      />
    </div>
  );
};
