"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreVertical, Filter } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Cliente } from "../models/cliente.model";
import { MasFiltrosPopover } from "./MasFiltrosPopover";
import { Search } from "lucide-react";

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
      width: "32%",
      cell: (row) => (
        <div>
          <Link
            href={`/comercial/clientes/${row.id}/`}
            className="font-semibold text-zinc-900 hover:underline block"
          >
            {row.name}
          </Link>
          <span className="text-2xs text-zinc-400 font-normal">RUC {row.ruc}</span>
        </div>
      ),
    },
    {
      header: "Distrito",
      width: "22%",
      cell: (row) => (
        <div>
          <span className="font-medium text-zinc-900 block">{row.district}</span>
          <span className="text-2xs text-zinc-400 font-normal">{row.city}</span>
        </div>
      ),
    },
    {
      header: "Vendedor",
      width: "22%",
      accessorKey: "seller",
      cell: (row) => <span className="text-zinc-700 font-medium">{row.seller}</span>,
    },
    {
      header: "Condición",
      width: "16%",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
            row.condition === "Al día"
              ? "bg-[#ecfdf5] text-[#059669]"
              : "bg-[#fffbeb] text-[#d97706]"
          }`}
        >
          {row.condition}
        </span>
      ),
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
    <div className="space-y-4">
      {/* Filter Row: perfectly baseline aligned using items-end */}
      <div className="flex flex-wrap items-end gap-3 py-1">
        {/* Search input */}
        <div className="relative min-w-[260px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clientes por nombre o RUC..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-zinc-200 rounded-md placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
        </div>

        {/* District select */}
        <div className="w-48">
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

        {/* Más filtros button with anchored popover */}
        <div className="relative">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            className="text-xs h-9 px-3 gap-1.5"
          >
            <Filter className="h-3.5 w-3.5 text-zinc-500" />
            Más filtros
          </Button>

          <MasFiltrosPopover
            isOpen={isMoreFiltersOpen}
            onClose={() => setIsMoreFiltersOpen(false)}
            onApply={(f) => setExtraFilters({ seller: f.seller, status: f.status })}
          />
        </div>
      </div>

      {/* Calibrated Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        entityName="clientes"
      />
    </div>
  );
};
