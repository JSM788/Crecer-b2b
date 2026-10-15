"use client";

import React, { useState } from "react";
import { FileText, CheckCircle2, Calendar } from "lucide-react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatCurrency } from "@/shared/lib/utils";
import { Gasto } from "../models/gasto.model";
import { RegistrarGastoDrawer } from "./RegistrarGastoDrawer";
import { DetalleGastoDrawer } from "./DetalleGastoDrawer";

interface GastosTableProps {
  gastos: Gasto[];
}

export const GastosTable: React.FC<GastosTableProps> = ({ gastos }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [seller, setSeller] = useState("Todos");
  const [category, setCategory] = useState("Todas");
  const [isRegistrarOpen, setIsRegistrarOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);

  const filtered = gastos.filter((g) => {
    const matchesSearch =
      !search ||
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      g.observations.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "Todos" || g.status === status;
    const matchesSeller = seller === "Todos" || g.seller === seller;
    const matchesCategory = category === "Todas" || g.category === category;

    return matchesSearch && matchesStatus && matchesSeller && matchesCategory;
  });

  const columns: Column<Gasto>[] = [
    {
      header: "Gasto",
      accessorKey: "code",
      cell: (row) => <span className="font-semibold text-zinc-900">{row.code}</span>,
    },
    {
      header: "Vendedor",
      accessorKey: "seller",
    },
    {
      header: "Categoría",
      accessorKey: "category",
    },
    {
      header: "Fecha",
      accessorKey: "date",
    },
    {
      header: "Total",
      cell: (row) => (
        <span className="font-semibold text-zinc-900">{formatCurrency(row.total)}</span>
      ),
    },
    {
      header: "Estado",
      cell: (row) => {
        const variant = row.status === "Revisado" ? "neutral" : "warning";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      header: "Acción",
      className: "w-24 text-right",
      cell: (row) => (
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs px-3"
          onClick={() => setSelectedGasto(row)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar gastos, descripción..."
      >
        <div className="w-36">
          <Select
            label="Estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Todos", value: "Todos" },
              { label: "Por revisar", value: "Por revisar" },
              { label: "Revisado", value: "Revisado" },
            ]}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-md text-xs font-medium bg-white text-zinc-800 self-end h-9">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <span>10 mar. 2025 - 16 mar. 2025</span>
        </div>

        <div className="w-36">
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

        <div className="w-36">
          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { label: "Todas", value: "Todas" },
              { label: "Peaje", value: "Peaje" },
              { label: "Combustible", value: "Combustible" },
              { label: "Alimentación", value: "Alimentación" },
              { label: "Estacionamiento", value: "Estacionamiento" },
              { label: "Movilidad", value: "Movilidad" },
            ]}
          />
        </div>
      </FilterBar>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-500">Por revisar</p>
              <p className="text-lg font-bold text-zinc-950">S/ 85</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-zinc-100 text-zinc-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xs text-zinc-500">Revisados</p>
              <p className="text-lg font-bold text-zinc-950">S/ 120</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(row) => row.id}
        entityName="gastos"
      />

      <RegistrarGastoDrawer
        isOpen={isRegistrarOpen}
        onClose={() => setIsRegistrarOpen(false)}
      />

      <DetalleGastoDrawer
        isOpen={!!selectedGasto}
        onClose={() => setSelectedGasto(null)}
        gasto={selectedGasto}
      />
    </div>
  );
};
