"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MoreVertical, Calendar } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { formatCurrency } from "@/shared/lib/utils";
import { Cotizacion } from "../models/venta.model";

interface CotizacionesTableProps {
  cotizaciones: Cotizacion[];
}

export const CotizacionesTable: React.FC<CotizacionesTableProps> = ({ cotizaciones }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [seller, setSeller] = useState("Todos");

  const filtered = cotizaciones.filter((c) => {
    const matchesSearch =
      !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.clienteName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "Todos" || c.status === status;
    const matchesSeller = seller === "Todos" || c.seller === seller;

    return matchesSearch && matchesStatus && matchesSeller;
  });

  const columns: Column<Cotizacion>[] = [
    {
      header: "Código",
      accessorKey: "code",
      cell: (row) => (
        <Link
          href={`/comercial/ventas/cotizaciones/${row.id}/`}
          className="font-semibold text-zinc-900 hover:underline"
        >
          {row.code}
        </Link>
      ),
    },
    {
      header: "Cliente",
      accessorKey: "clienteName",
      cell: (row) => <span className="font-medium text-zinc-900">{row.clienteName}</span>,
    },
    {
      header: "Vendedor",
      accessorKey: "seller",
    },
    {
      header: "Fecha",
      accessorKey: "date",
    },
    {
      header: "Importe (S/)",
      cell: (row) => (
        <span className="font-semibold text-zinc-900">
          {formatCurrency(row.amount).replace("S/ ", "")}
        </span>
      ),
    },
    {
      header: "Estado",
      cell: (row) => {
        const variant =
          row.status === "Aprobada"
            ? "success"
            : row.status === "Enviada"
            ? "info"
            : "neutral";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/comercial/ventas/cotizaciones/${row.id}/`}>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-3">
              Ver
            </Button>
          </Link>
          <button className="p-1 text-zinc-400 hover:text-zinc-700 rounded">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código o cliente..."
        hasMoreFilters
        onToggleMoreFilters={() => {}}
      >
        <div className="w-36">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Borrador", value: "Borrador" },
              { label: "Enviada", value: "Enviada" },
              { label: "Aprobada", value: "Aprobada" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 self-end h-9">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span>16 oct. 2026</span>
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
              { label: "Carlos Díaz", value: "Carlos Díaz" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        entityName="cotizaciones"
      />
    </div>
  );
};
