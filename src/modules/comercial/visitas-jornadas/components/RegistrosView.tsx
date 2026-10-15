"use client";

import React, { useState } from "react";
import { MoreVertical, Calendar } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { RegistroVisita } from "../models/visita.model";
import { RegistroVisitaDrawer } from "./RegistroVisitaDrawer";

interface RegistrosViewProps {
  registros: RegistroVisita[];
}

export const RegistrosView: React.FC<RegistrosViewProps> = ({ registros }) => {
  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState("Todos");
  const [result, setResult] = useState("Todos");
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroVisita | null>(null);

  const filtered = registros.filter((r) => {
    const matchesSearch =
      !search ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesSeller = seller === "Todos" || r.seller === seller;
    const matchesResult = result === "Todos" || r.result === result;

    return matchesSearch && matchesSeller && matchesResult;
  });

  const columns: Column<RegistroVisita>[] = [
    {
      header: "Código",
      accessorKey: "code",
      cell: (row) => <span className="font-semibold text-zinc-900">{row.code}</span>,
    },
    {
      header: "Cliente",
      accessorKey: "clientName",
      cell: (row) => <span className="font-medium text-zinc-900">{row.clientName}</span>,
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
      header: "Resultado",
      cell: (row) => {
        const variant =
          row.result === "Con pedido"
            ? "success"
            : row.result === "Sin compra"
            ? "neutral"
            : "warning";
        return <Badge variant={variant}>{row.result}</Badge>;
      },
    },
    {
      header: "Evidencia",
      cell: (row) => (
        <span className="text-zinc-500">
          {row.evidenceCount} {row.evidenceCount === 1 ? "foto" : "fotos"}
        </span>
      ),
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs px-3"
            onClick={() => setSelectedRegistro(row)}
          >
            Ver
          </Button>
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
        searchPlaceholder="Buscar por cliente..."
      >
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

        <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 self-end h-9">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span>16 oct. 2026</span>
        </div>

        <div className="w-36">
          <Select
            label="Resultado"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Con pedido", value: "Con pedido" },
              { label: "Sin compra", value: "Sin compra" },
              { label: "Local cerrado", value: "Local cerrado" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        entityName="registros"
      />

      <RegistroVisitaDrawer
        isOpen={!!selectedRegistro}
        onClose={() => setSelectedRegistro(null)}
        registro={selectedRegistro}
      />
    </div>
  );
};
