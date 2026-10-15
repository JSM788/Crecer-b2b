"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Cliente } from "../models/cliente.model";
import { MasFiltrosDrawer } from "./MasFiltrosDrawer";

interface ClientesCarteraTableProps {
  clientes: Cliente[];
}

export const ClientesCarteraTable: React.FC<ClientesCarteraTableProps> = ({ clientes }) => {
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("Todos");
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [extraFilters, setExtraFilters] = useState<{ seller: string; status: string }>({
    seller: "Todos",
    status: "Todos",
  });

  const filteredData = clientes.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.ruc.includes(search);
    const matchesDistrict = district === "Todos" || c.district === district;
    const matchesSeller =
      extraFilters.seller === "Todos" || c.seller === extraFilters.seller;
    const matchesStatus =
      extraFilters.status === "Todos" || c.condition === extraFilters.status;

    return matchesSearch && matchesDistrict && matchesSeller && matchesStatus;
  });

  const columns: Column<Cliente>[] = [
    {
      header: "Cliente",
      sortable: true,
      cell: (row) => (
        <div>
          <Link
            href={`/comercial/clientes/${row.id}/`}
            className="font-semibold text-zinc-900 hover:underline block"
          >
            {row.name}
          </Link>
          <span className="text-2xs text-zinc-400">RUC {row.ruc}</span>
        </div>
      ),
    },
    {
      header: "Distrito",
      cell: (row) => (
        <div>
          <span className="font-medium text-zinc-900 block">{row.district}</span>
          <span className="text-2xs text-zinc-400">{row.city}</span>
        </div>
      ),
    },
    {
      header: "Vendedor",
      accessorKey: "seller",
      cell: (row) => <span className="text-zinc-800">{row.seller}</span>,
    },
    {
      header: "Condición",
      cell: (row) => (
        <Badge variant={row.condition === "Al día" ? "success" : "warning"}>
          {row.condition}
        </Badge>
      ),
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
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar clientes por nombre o RUC..."
        hasMoreFilters
        onToggleMoreFilters={() => setIsMoreFiltersOpen(true)}
      >
        <div className="w-44">
          <Select
            label="Distrito"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={[
              { label: "Todos los distritos", value: "Todos" },
              { label: "San Borja", value: "San Borja" },
              { label: "Miraflores", value: "Miraflores" },
              { label: "Santiago de Surco", value: "Santiago de Surco" },
              { label: "San Miguel", value: "San Miguel" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        entityName="clientes"
      />

      <MasFiltrosDrawer
        isOpen={isMoreFiltersOpen}
        onClose={() => setIsMoreFiltersOpen(false)}
        onApply={(f) => setExtraFilters({ seller: f.seller, status: f.status })}
      />
    </div>
  );
};
