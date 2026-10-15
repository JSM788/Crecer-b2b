"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/shared/patterns/DataTable";
import { FilterBar } from "@/shared/patterns/FilterBar";
import { Select } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { LineaCredito } from "../models/finanzas.model";

interface LineasCreditoTableProps {
  initialData: LineaCredito[];
}

export const LineasCreditoTable: React.FC<LineasCreditoTableProps> = ({
  initialData,
}) => {
  const [data, setData] = useState<LineaCredito[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filteredData = data.filter((item) => {
    const matchesSearch =
      !search ||
      item.clientName.toLowerCase().includes(search.toLowerCase()) ||
      item.ruc.includes(search);
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleBloqueo = (id: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "Bloqueada" ? "Activa" : "Bloqueada",
            }
          : item
      )
    );
  };

  const columns: Column<LineaCredito>[] = [
    {
      header: "Cliente / RUC",
      sortable: true,
      width: "25%",
      cell: (row) => (
        <div>
          <p className="font-bold text-zinc-900">{row.clientName}</p>
          <span className="text-2xs text-zinc-400">RUC: {row.ruc}</span>
        </div>
      ),
    },
    {
      header: "Línea Aprobada",
      accessorKey: "assignedLimit",
      sortable: true,
      width: "15%",
      cell: (row) => (
        <span className="font-semibold text-zinc-900">
          S/ {row.assignedLimit.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Saldo Utilizado",
      accessorKey: "usedAmount",
      width: "15%",
      cell: (row) => (
        <span className="text-zinc-700 font-medium">
          S/ {row.usedAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Disponible",
      accessorKey: "availableAmount",
      width: "15%",
      cell: (row) => (
        <span className="font-extrabold text-emerald-700">
          S/ {row.availableAmount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Plazo",
      width: "10%",
      cell: (row) => <span className="text-zinc-600 font-medium">{row.paymentTermDays} días</span>,
    },
    {
      header: "Estado",
      accessorKey: "status",
      width: "12%",
      cell: (row) => (
        <Badge
          variant={
            row.status === "Activa"
              ? "success"
              : row.status === "En evaluación"
              ? "warning"
              : "danger"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Acción",
      width: "14%",
      className: "text-right",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleToggleBloqueo(row.id)}
          className={`text-2xs h-7 px-2.5 font-medium ${
            row.status === "Bloqueada"
              ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              : "text-rose-700 border-rose-300 hover:bg-rose-50"
          }`}
        >
          {row.status === "Bloqueada" ? "Desbloquear" : "Bloquear línea"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por cliente o RUC..."
      >
        <div className="w-48">
          <Select
            label="Estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "Todos los estados", value: "Todos" },
              { label: "Activa", value: "Activa" },
              { label: "Bloqueada", value: "Bloqueada" },
              { label: "En evaluación", value: "En evaluación" },
            ]}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(row) => row.id}
        entityName="líneas de crédito"
      />
    </div>
  );
};
